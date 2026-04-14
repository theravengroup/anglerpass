import { jsonCreated, jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { messageSchema } from "@/lib/validations/guides";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";
import { requireEnabled } from "@/lib/feature-flags";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Returns true if `senderId` and `recipientId` share a real platform
 * relationship. Prevents the messages endpoint from being used as an
 * open inbox against arbitrary user IDs.
 */
async function assertMessagingRelationship(
  admin: AdminClient,
  senderId: string,
  recipientId: string,
  bookingId: string | null
): Promise<boolean> {
  // (4) Platform admin — unrestricted support channel.
  const { data: adminRow } = await admin
    .from("profiles")
    .select("role")
    .in("id", [senderId, recipientId])
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();
  if (adminRow) return true;

  // (1) Booking participants. If a booking_id was supplied, both users
  // must be tied to that booking; otherwise any shared booking counts.
  const bookingQuery = admin
    .from("bookings")
    .select(`
      id,
      angler_id,
      guide_id,
      properties!inner(owner_id)
    `)
    .limit(50);
  if (bookingId) bookingQuery.eq("id", bookingId);

  const { data: bookings } = await bookingQuery;
  if (bookings) {
    const participants = (b: {
      angler_id: string | null;
      guide_id: string | null;
      properties: { owner_id: string | null } | { owner_id: string | null }[];
    }): Set<string> => {
      const owner = Array.isArray(b.properties)
        ? b.properties[0]?.owner_id ?? null
        : b.properties?.owner_id ?? null;
      return new Set(
        [b.angler_id, b.guide_id, owner].filter((v): v is string => Boolean(v))
      );
    };
    for (const b of bookings) {
      const set = participants(b);
      if (set.has(senderId) && set.has(recipientId)) return true;
    }
  }

  // (2, 3) Shared club membership — both active on the same club, or one
  // is a staff/owner on a club the other belongs to.
  const { data: senderMemberships } = await admin
    .from("club_memberships")
    .select("club_id, role, status")
    .eq("user_id", senderId)
    .eq("status", "active");
  const { data: recipientMemberships } = await admin
    .from("club_memberships")
    .select("club_id, role, status")
    .eq("user_id", recipientId)
    .eq("status", "active");

  const senderClubs = new Set((senderMemberships ?? []).map((m) => m.club_id));
  if ((recipientMemberships ?? []).some((m) => senderClubs.has(m.club_id))) {
    return true;
  }

  // Owner-of-club ↔ member-of-that-club.
  const { data: senderOwnedClubs } = await admin
    .from("clubs")
    .select("id")
    .eq("owner_id", senderId);
  const ownedBySender = new Set((senderOwnedClubs ?? []).map((c) => c.id));
  if ((recipientMemberships ?? []).some((m) => ownedBySender.has(m.club_id))) {
    return true;
  }

  const { data: recipientOwnedClubs } = await admin
    .from("clubs")
    .select("id")
    .eq("owner_id", recipientId);
  const ownedByRecipient = new Set((recipientOwnedClubs ?? []).map((c) => c.id));
  if ((senderMemberships ?? []).some((m) => ownedByRecipient.has(m.club_id))) {
    return true;
  }

  return false;
}

// GET: List user's message threads
export async function GET() {
  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const admin = createAdminClient();

    // Fetch threads where user is a participant
    const { data: threads, error } = await admin
      .from("message_threads")
      .select(
        "id, participant_a, participant_b, booking_id, last_message_at, created_at"
      )
      .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
      .order("last_message_at", { ascending: false });

    if (error) {
      console.error("[messages] Threads fetch error:", error);
      return jsonError("Failed to fetch threads", 500);
    }

    if (!threads?.length) {
      return jsonOk({ threads: [] });
    }

    // For each thread, get the other participant's info and unread count
    const enrichedThreads = await Promise.all(
      threads.map(async (thread) => {
        const otherId =
          thread.participant_a === user.id
            ? thread.participant_b
            : thread.participant_a;

        const { data: otherProfile } = await admin
          .from("profiles")
          .select("display_name")
          .eq("id", otherId)
          .maybeSingle();

        // Get last message preview
        const { data: lastMessage } = await admin
          .from("messages")
          .select("body, sender_id, created_at")
          .eq("thread_id", thread.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Get unread count
        const { count: unreadCount } = await admin
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("thread_id", thread.id)
          .eq("recipient_id", user.id)
          .is("read_at", null);

        return {
          ...thread,
          other_participant: {
            id: otherId,
            display_name: otherProfile?.display_name ?? "Unknown",
          },
          last_message: lastMessage
            ? {
                body:
                  lastMessage.body.length > 100
                    ? lastMessage.body.slice(0, 100) + "..."
                    : lastMessage.body,
                is_own: lastMessage.sender_id === user.id,
                created_at: lastMessage.created_at,
              }
            : null,
          unread_count: unreadCount ?? 0,
        };
      })
    );

    return jsonOk({ threads: enrichedThreads });
  } catch (err) {
    console.error("[messages] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

// POST: Send a message (creates thread if needed)
export async function POST(request: Request) {
  const killed = await requireEnabled("messaging.send");
  if (killed) return killed;

  const limited = rateLimit("messages-send", getClientIp(request), 20, 60_000);
  if (limited) return limited;

  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const body = await request.json();
    const result = messageSchema.safeParse(body);

    if (!result.success) {
      return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
    }

    if (result.data.recipient_id === user.id) {
      return jsonError("Cannot send a message to yourself", 400);
    }

    const admin = createAdminClient();

    // Authorization: sender and recipient must share a real platform
    // relationship — otherwise anyone could DM any user by guessing IDs.
    // Allowed relationships:
    //   1. Both are parties to a booking (angler, guide, property owner)
    //   2. They are both active members of the same club
    //   3. One is a club admin/owner and the other is a member of that club
    //   4. Sender or recipient is a platform admin (support channel)
    const canMessage = await assertMessagingRelationship(
      admin,
      user.id,
      result.data.recipient_id,
      result.data.booking_id ?? null
    );
    if (!canMessage) {
      return jsonError(
        "You can only message users you share a booking or club with",
        403
      );
    }

    // Find or create thread
    const participantA =
      user.id < result.data.recipient_id ? user.id : result.data.recipient_id;
    const participantB =
      user.id < result.data.recipient_id ? result.data.recipient_id : user.id;

    let threadId: string;

    // Check for existing thread
    let query = admin
      .from("message_threads")
      .select("id")
      .eq("participant_a", participantA)
      .eq("participant_b", participantB);

    if (result.data.booking_id) {
      query = query.eq("booking_id", result.data.booking_id);
    } else {
      query = query.is("booking_id", null);
    }

    const { data: existingThread } = await query.maybeSingle();

    if (existingThread) {
      threadId = existingThread.id;

      // Update last_message_at
      await admin
        .from("message_threads")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", threadId);
    } else {
      // Create new thread
      const { data: newThread, error: threadError } = await admin
        .from("message_threads")
        .insert({
          participant_a: participantA,
          participant_b: participantB,
          booking_id: result.data.booking_id ?? null,
        })
        .select()
        .single();

      if (threadError) {
        console.error("[messages] Thread creation error:", threadError);
        return jsonError("Failed to create conversation", 500);
      }

      threadId = newThread!.id;
    }

    // Create message
    const { data: message, error: msgError } = await admin
      .from("messages")
      .insert({
        thread_id: threadId,
        sender_id: user.id,
        recipient_id: result.data.recipient_id,
        body: result.data.body,
        booking_id: result.data.booking_id ?? null,
      })
      .select()
      .single();

    if (msgError) {
      console.error("[messages] Message insert error:", msgError);
      return jsonError("Failed to send message", 500);
    }

    return jsonCreated({ message, thread_id: threadId });
  } catch (err) {
    console.error("[messages] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
