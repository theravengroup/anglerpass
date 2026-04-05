import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";

// GET: Fetch messages in a thread (paginated)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Verify user is a participant
    const { data: thread } = await admin
      .from("message_threads")
      .select("id, participant_a, participant_b, booking_id")
      .eq("id", threadId)
      .single();

    if (!thread) {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      );
    }

    if (thread.participant_a !== user.id && thread.participant_b !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const { data: messages, error } = await admin
      .from("messages")
      .select("id, sender_id, recipient_id, body, read_at, created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[messages/thread] Fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    // Mark unread messages as read
    await admin
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("thread_id", threadId)
      .eq("recipient_id", user.id)
      .is("read_at", null);

    return NextResponse.json({
      messages: messages ?? [],
      thread,
    });
  } catch (err) {
    console.error("[messages/thread] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Send a message to this thread
export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const limited = rateLimit("messages-reply", getClientIp(request), 20, 60_000);
  if (limited) return limited;

  try {
    const { threadId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Verify user is a participant
    const { data: thread } = await admin
      .from("message_threads")
      .select("id, participant_a, participant_b, booking_id")
      .eq("id", threadId)
      .single();

    if (!thread) {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      );
    }

    if (thread.participant_a !== user.id && thread.participant_b !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const messageBody = typeof body.body === "string" ? body.body.trim() : "";

    if (!messageBody || messageBody.length > 5000) {
      return NextResponse.json(
        { error: "Message must be between 1 and 5000 characters" },
        { status: 400 }
      );
    }

    const recipientId =
      thread.participant_a === user.id
        ? thread.participant_b
        : thread.participant_a;

    // Create message
    const { data: message, error: msgError } = await admin
      .from("messages")
      .insert({
        thread_id: threadId,
        sender_id: user.id,
        recipient_id: recipientId,
        body: messageBody,
        booking_id: thread.booking_id,
      })
      .select()
      .single();

    if (msgError) {
      console.error("[messages/thread] Insert error:", msgError);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    // Update thread last_message_at
    await admin
      .from("message_threads")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", threadId);

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    console.error("[messages/thread] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
