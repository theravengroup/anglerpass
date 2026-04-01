import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { messageSchema } from "@/lib/validations/guides";

// GET: List user's message threads
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Fetch threads where user is a participant
    const { data: threads, error } = await (admin
      .from("message_threads" as never)
      .select(
        "id, participant_a, participant_b, booking_id, last_message_at, created_at"
      )
      .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
      .order("last_message_at" as never, { ascending: false })) as unknown as { data: { id: string; participant_a: string; participant_b: string; booking_id: string | null; last_message_at: string; created_at: string }[] | null; error: unknown };

    if (error) {
      console.error("[messages] Threads fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch threads" },
        { status: 500 }
      );
    }

    if (!threads?.length) {
      return NextResponse.json({ threads: [] });
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
        const { data: lastMessage } = await (admin
          .from("messages" as never)
          .select("body, sender_id, created_at")
          .eq("thread_id" as never, thread.id)
          .order("created_at" as never, { ascending: false })
          .limit(1)
          .single()) as unknown as { data: { body: string; sender_id: string; created_at: string } | null };

        // Get unread count
        const { count: unreadCount } = await (admin
          .from("messages" as never)
          .select("id", { count: "exact", head: true })
          .eq("thread_id" as never, thread.id)
          .eq("recipient_id" as never, user.id)
          .is("read_at" as never, null)) as unknown as { count: number | null };

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

    return NextResponse.json({ threads: enrichedThreads });
  } catch (err) {
    console.error("[messages] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Send a message (creates thread if needed)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = messageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
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
      .from("message_threads" as never)
      .select("id")
      .eq("participant_a" as never, participantA)
      .eq("participant_b" as never, participantB);

    if (result.data.booking_id) {
      query = query.eq("booking_id" as never, result.data.booking_id);
    } else {
      query = query.is("booking_id" as never, null);
    }

    const { data: existingThread } = await (query.maybeSingle()) as unknown as { data: { id: string } | null };

    if (existingThread) {
      threadId = existingThread.id;

      // Update last_message_at
      await admin
        .from("message_threads" as never)
        .update({ last_message_at: new Date().toISOString() } as never)
        .eq("id" as never, threadId);
    } else {
      // Create new thread
      const { data: newThread, error: threadError } = await (admin
        .from("message_threads" as never)
        .insert({
          participant_a: participantA,
          participant_b: participantB,
          booking_id: result.data.booking_id ?? null,
        } as never)
        .select()
        .single()) as unknown as { data: { id: string } | null; error: unknown };

      if (threadError) {
        console.error("[messages] Thread creation error:", threadError);
        return NextResponse.json(
          { error: "Failed to create conversation" },
          { status: 500 }
        );
      }

      threadId = newThread!.id;
    }

    // Create message
    const { data: message, error: msgError } = await admin
      .from("messages" as never)
      .insert({
        thread_id: threadId,
        sender_id: user.id,
        recipient_id: result.data.recipient_id,
        body: result.data.body,
        booking_id: result.data.booking_id ?? null,
      } as never)
      .select()
      .single();

    if (msgError) {
      console.error("[messages] Message insert error:", msgError);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message, thread_id: threadId }, { status: 201 });
  } catch (err) {
    console.error("[messages] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
