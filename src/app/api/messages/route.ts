import { jsonCreated, jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { messageSchema } from "@/lib/validations/guides";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";

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
          .single();

        // Get last message preview
        const { data: lastMessage } = await admin
          .from("messages")
          .select("body, sender_id, created_at")
          .eq("thread_id", thread.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

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

    const admin = createAdminClient();

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
