/**
 * Workflow execution engine — processes workflow enrollments through the
 * visual node graph. Each enrollment sits on a node. The engine:
 *
 * 1. Finds enrollments that are ready (wait_until has passed or is null)
 * 2. Executes the current node's action
 * 3. Follows the appropriate edge to the next node
 * 4. Updates the enrollment (or completes/exits it)
 *
 * Called by the /api/cron/crm-workflow-runner cron every 5 minutes.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { crmTable } from "@/lib/crm/admin-queries";
import { sendCrmEmail } from "@/lib/crm/email-sender";
import { runPreSendChecks } from "@/lib/crm/subscription-checks";
import { renderTemplate, buildTemplateData } from "@/lib/crm/template-engine";
import { sendSms, canReceiveSms } from "@/lib/crm/sms-sender";
import { createNotification } from "@/lib/crm/notifications";
import type {
  WorkflowNodeType,
  SendEmailNodeConfig,
  SendSmsNodeConfig,
  NotifyNodeConfig,
  DelayNodeConfig,
  ConditionNodeConfig,
  SplitNodeConfig,
} from "@/lib/crm/types";

// ─── Types ─────────────────────────────────────────────────────────

interface EnrollmentRow {
  id: string;
  workflow_id: string;
  user_id: string | null;
  email: string;
  current_node_id: string | null;
  status: string;
  wait_until: string | null;
  context_data: Record<string, unknown> | null;
}

interface NodeRow {
  id: string;
  workflow_id: string;
  type: WorkflowNodeType;
  label: string;
  config: Record<string, unknown>;
}

interface EdgeRow {
  id: string;
  source_node_id: string;
  target_node_id: string;
  source_handle: string;
}

// ─── Main Entry Point ──────────────────────────────────────────────

export async function processWorkflowEnrollments(
  admin: SupabaseClient
): Promise<{
  processed: number;
  advanced: number;
  completed: number;
  exited: number;
  errors: number;
}> {
  const now = new Date().toISOString();

  // Fetch enrollments ready to process:
  // - status = active
  // - current_node_id is not null (enrolled at a node)
  // - wait_until is null or has passed
  const { data: enrollments } = await crmTable(admin, "crm_workflow_enrollments")
    .select("id, workflow_id, user_id, email, current_node_id, status, wait_until, context_data")
    .eq("status", "active")
    .not("current_node_id", "is", null)
    .or(`wait_until.is.null,wait_until.lte.${now}`)
    .limit(100)
    .returns<EnrollmentRow[]>();

  if (!enrollments || enrollments.length === 0) {
    return { processed: 0, advanced: 0, completed: 0, exited: 0, errors: 0 };
  }

  // Pre-load all needed workflows' nodes and edges in bulk
  const workflowIds = [...new Set(enrollments.map((e) => e.workflow_id))];
  const graphCache = new Map<
    string,
    { nodes: Map<string, NodeRow>; edges: EdgeRow[] }
  >();

  for (const wfId of workflowIds) {
    const [nodesRes, edgesRes] = await Promise.all([
      crmTable(admin, "crm_workflow_nodes")
        .select("id, workflow_id, type, label, config")
        .eq("workflow_id", wfId)
        .returns<NodeRow[]>(),
      crmTable(admin, "crm_workflow_edges")
        .select("id, source_node_id, target_node_id, source_handle")
        .eq("workflow_id", wfId)
        .returns<EdgeRow[]>(),
    ]);

    const nodeMap = new Map<string, NodeRow>();
    for (const n of nodesRes.data ?? []) {
      nodeMap.set(n.id, n);
    }

    graphCache.set(wfId, {
      nodes: nodeMap,
      edges: edgesRes.data ?? [],
    });
  }

  let processed = 0;
  let advanced = 0;
  let completed = 0;
  let exited = 0;
  let errors = 0;

  for (const enrollment of enrollments) {
    processed++;

    try {
      const graph = graphCache.get(enrollment.workflow_id);
      if (!graph) {
        errors++;
        continue;
      }

      const currentNode = enrollment.current_node_id
        ? graph.nodes.get(enrollment.current_node_id)
        : null;

      if (!currentNode) {
        // Node was deleted — exit enrollment
        await exitEnrollment(admin, enrollment.id, "node_deleted");
        exited++;
        continue;
      }

      // Execute the node's action and determine which handle to follow
      const result = await executeNode(admin, enrollment, currentNode, graph.edges);

      if (result.action === "wait") {
        // Node set a wait_until — update enrollment
        await crmTable(admin, "crm_workflow_enrollments")
          .update({
            wait_until: result.waitUntil,
            last_processed_at: new Date().toISOString(),
          })
          .eq("id", enrollment.id);
        advanced++;
      } else if (result.action === "advance") {
        // Find the next node via the edge
        const nextNodeId = findNextNode(
          graph.edges,
          currentNode.id,
          result.handle ?? "default"
        );

        if (!nextNodeId) {
          // No edge from this handle — complete the enrollment
          await completeEnrollment(admin, enrollment.id);
          completed++;
        } else {
          const nextNode = graph.nodes.get(nextNodeId);
          if (!nextNode) {
            await exitEnrollment(admin, enrollment.id, "missing_target_node");
            exited++;
          } else if (nextNode.type === "end") {
            // Reached an end node — complete
            await logWorkflowStep(admin, enrollment, nextNode, "completed");
            await completeEnrollment(admin, enrollment.id);
            completed++;
          } else {
            // Move to next node
            await crmTable(admin, "crm_workflow_enrollments")
              .update({
                current_node_id: nextNodeId,
                wait_until: null,
                last_processed_at: new Date().toISOString(),
              })
              .eq("id", enrollment.id);
            advanced++;
          }
        }
      } else if (result.action === "exit") {
        await exitEnrollment(admin, enrollment.id, result.reason ?? "action_exit");
        exited++;
      }
    } catch (err) {
      console.error(
        `[workflow-engine] Error processing enrollment ${enrollment.id}:`,
        err
      );
      await logWorkflowStep(admin, enrollment, null, "error", {
        error: err instanceof Error ? err.message : "Unknown error",
      });
      errors++;
    }
  }

  return { processed, advanced, completed, exited, errors };
}

// ─── Node Execution ────────────────────────────────────────────────

type NodeResult =
  | { action: "advance"; handle?: string }
  | { action: "wait"; waitUntil: string }
  | { action: "exit"; reason?: string };

async function executeNode(
  admin: SupabaseClient,
  enrollment: EnrollmentRow,
  node: NodeRow,
  edges: EdgeRow[]
): Promise<NodeResult> {
  switch (node.type as WorkflowNodeType) {
    case "trigger":
      // Trigger node is the entry point — just advance
      await logWorkflowStep(admin, enrollment, node, "passed");
      return { action: "advance", handle: "default" };

    case "send_email":
      return executeSendEmail(admin, enrollment, node);

    case "send_sms":
      return executeSendSms(admin, enrollment, node);

    case "notify":
      return executeNotify(admin, enrollment, node);

    case "delay":
      return executeDelay(admin, enrollment, node);

    case "condition":
      return executeCondition(admin, enrollment, node);

    case "split":
      return executeSplit(admin, enrollment, node);

    case "end":
      await logWorkflowStep(admin, enrollment, node, "completed");
      return { action: "exit", reason: "end_node" };

    default:
      return { action: "advance", handle: "default" };
  }
}

// ─── Send Email Node ───────────────────────────────────────────────

async function executeSendEmail(
  admin: SupabaseClient,
  enrollment: EnrollmentRow,
  node: NodeRow
): Promise<NodeResult> {
  const config = node.config as unknown as SendEmailNodeConfig;

  if (!config.subject || !config.html_body) {
    await logWorkflowStep(admin, enrollment, node, "skipped", {
      reason: "missing_subject_or_body",
    });
    return { action: "advance", handle: "default" };
  }

  // Run pre-send checks (suppression, opt-out, topic, frequency cap)
  // Use a synthetic campaign ID based on workflow
  const checks = await runPreSendChecks(admin, {
    recipientEmail: enrollment.email,
    recipientId: enrollment.user_id ?? undefined,
    recipientType: "user",
    campaignId: enrollment.workflow_id, // Use workflow ID as campaign proxy
  });

  if (!checks.allowed) {
    await logWorkflowStep(admin, enrollment, node, "skipped", {
      reason: checks.reason,
    });
    return { action: "advance", handle: "default" };
  }

  // Build template data
  let displayName: string | undefined;
  if (enrollment.user_id) {
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", enrollment.user_id)
      .maybeSingle();
    displayName = (profile as Record<string, unknown> | null)?.display_name as string | undefined;
  }

  const templateData = buildTemplateData(
    {
      userId: enrollment.user_id ?? undefined,
      email: enrollment.email,
      displayName: displayName ?? undefined,
    },
    enrollment.context_data ?? undefined
  );

  const renderedSubject = renderTemplate(config.subject, templateData);
  const renderedBody = renderTemplate(config.html_body, templateData);

  // Create a tracking record
  const sendId = crypto.randomUUID();
  await crmTable(admin, "campaign_sends").insert({
    id: sendId,
    campaign_id: null,
    step_id: null,
    recipient_id: enrollment.user_id,
    recipient_email: enrollment.email,
    recipient_type: "user",
    status: "queued",
    template_data: templateData,
  });

  // Send the email
  const result = await sendCrmEmail(admin, {
    sendId,
    to: enrollment.email,
    subject: renderedSubject,
    htmlBody: renderedBody,
    fromName: config.from_name ?? "AnglerPass",
    recipientName: displayName ?? undefined,
    userId: enrollment.user_id ?? undefined,
    templateData,
  });

  if (result.success) {
    await logWorkflowStep(admin, enrollment, node, "sent", {
      send_id: sendId,
      subject: renderedSubject,
    });
  } else {
    await logWorkflowStep(admin, enrollment, node, "failed", {
      send_id: sendId,
      error: result.error,
    });
  }

  return { action: "advance", handle: "default" };
}

// ─── Send SMS Node ─────────────────────────────────────────────────

async function executeSendSms(
  admin: SupabaseClient,
  enrollment: EnrollmentRow,
  node: NodeRow
): Promise<NodeResult> {
  const config = node.config as unknown as SendSmsNodeConfig;

  if (!config.message) {
    await logWorkflowStep(admin, enrollment, node, "skipped", {
      reason: "missing_message",
    });
    return { action: "advance", handle: "default" };
  }

  if (!enrollment.user_id) {
    await logWorkflowStep(admin, enrollment, node, "skipped", {
      reason: "no_user_id",
    });
    return { action: "advance", handle: "default" };
  }

  // Check if user can receive SMS
  const smsCheck = await canReceiveSms(admin, enrollment.user_id);
  if (!smsCheck.allowed || !smsCheck.phoneNumber) {
    await logWorkflowStep(admin, enrollment, node, "skipped", {
      reason: "sms_not_available",
    });
    return { action: "advance", handle: "default" };
  }

  // Resolve display name for template
  let displayName: string | undefined;
  const { data: profile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", enrollment.user_id)
    .maybeSingle();
  displayName = (profile as Record<string, unknown> | null)?.display_name as string | undefined;

  const result = await sendSms(admin, {
    userId: enrollment.user_id,
    phoneNumber: smsCheck.phoneNumber,
    message: config.message,
    sourceType: "workflow",
    sourceId: enrollment.workflow_id,
    templateContext: {
      userId: enrollment.user_id,
      email: enrollment.email,
      displayName,
    },
    templateExtras: enrollment.context_data ?? undefined,
  });

  if (result.success) {
    await logWorkflowStep(admin, enrollment, node, "sms_sent", {
      send_id: result.sendId,
      phone: smsCheck.phoneNumber,
    });
  } else {
    await logWorkflowStep(admin, enrollment, node, "sms_failed", {
      send_id: result.sendId,
      error: result.error,
    });
  }

  return { action: "advance", handle: "default" };
}

// ─── Notify Node (In-App) ──────────────────────────────────────────

async function executeNotify(
  admin: SupabaseClient,
  enrollment: EnrollmentRow,
  node: NodeRow
): Promise<NodeResult> {
  const config = node.config as unknown as NotifyNodeConfig;

  if (!config.title) {
    await logWorkflowStep(admin, enrollment, node, "skipped", {
      reason: "missing_title",
    });
    return { action: "advance", handle: "default" };
  }

  if (!enrollment.user_id) {
    await logWorkflowStep(admin, enrollment, node, "skipped", {
      reason: "no_user_id",
    });
    return { action: "advance", handle: "default" };
  }

  // Resolve display name for template
  let displayName: string | undefined;
  const { data: profile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", enrollment.user_id)
    .maybeSingle();
  displayName = (profile as Record<string, unknown> | null)?.display_name as string | undefined;

  const notifId = await createNotification(admin, {
    userId: enrollment.user_id,
    title: config.title,
    body: config.body,
    actionUrl: config.action_url,
    category: config.category ?? "workflow",
    sourceType: "workflow",
    sourceId: enrollment.workflow_id,
    templateContext: {
      userId: enrollment.user_id,
      email: enrollment.email,
      displayName,
    },
    templateExtras: enrollment.context_data ?? undefined,
  });

  await logWorkflowStep(admin, enrollment, node, "notified", {
    notification_id: notifId,
  });

  return { action: "advance", handle: "default" };
}

// ─── Delay Node ────────────────────────────────────────────────────

async function executeDelay(
  admin: SupabaseClient,
  enrollment: EnrollmentRow,
  node: NodeRow
): Promise<NodeResult> {
  const config = node.config as unknown as DelayNodeConfig;

  // If enrollment already has a wait_until set for this delay and it's passed,
  // that means we're being processed after the wait — advance
  if (enrollment.wait_until) {
    const waitTime = new Date(enrollment.wait_until).getTime();
    if (Date.now() >= waitTime) {
      await logWorkflowStep(admin, enrollment, node, "passed", {
        delayed: config.duration,
        unit: config.unit,
      });
      return { action: "advance", handle: "default" };
    }
  }

  // Calculate wait time
  const durationMs = getDelayMs(config.duration ?? 1, config.unit ?? "days");
  const waitUntil = new Date(Date.now() + durationMs).toISOString();

  await logWorkflowStep(admin, enrollment, node, "waiting", {
    wait_until: waitUntil,
    duration: config.duration,
    unit: config.unit,
  });

  return { action: "wait", waitUntil };
}

function getDelayMs(duration: number, unit: string): number {
  switch (unit) {
    case "minutes":
      return duration * 60_000;
    case "hours":
      return duration * 3_600_000;
    case "days":
      return duration * 86_400_000;
    default:
      return duration * 86_400_000;
  }
}

// ─── Condition Node ────────────────────────────────────────────────

async function executeCondition(
  admin: SupabaseClient,
  enrollment: EnrollmentRow,
  node: NodeRow
): Promise<NodeResult> {
  const config = node.config as unknown as ConditionNodeConfig;
  let matches = false;

  try {
    matches = await evaluateCondition(admin, enrollment, config);
  } catch (err) {
    console.error(
      `[workflow-engine] Condition evaluation error for node ${node.id}:`,
      err
    );
  }

  const handle = matches ? "yes" : "no";

  await logWorkflowStep(admin, enrollment, node, "evaluated", {
    field: config.field,
    operator: config.operator,
    value: config.value,
    result: handle,
  });

  return { action: "advance", handle };
}

async function evaluateCondition(
  admin: SupabaseClient,
  enrollment: EnrollmentRow,
  config: ConditionNodeConfig
): Promise<boolean> {
  const field = config.field ?? "";
  const op = config.operator ?? "eq";
  const expected = config.value ?? "";

  // Resolve the field value
  let actual: string | number | boolean | null = null;

  if (field.startsWith("user.") && enrollment.user_id) {
    const userField = field.replace("user.", "");

    switch (userField) {
      case "role": {
        const { data } = await admin
          .from("profiles")
          .select("role")
          .eq("id", enrollment.user_id)
          .maybeSingle();
        actual = (data as Record<string, unknown> | null)?.role as string | null;
        break;
      }
      case "has_booking": {
        const { count } = await admin
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("user_id", enrollment.user_id);
        actual = (count ?? 0) > 0;
        break;
      }
      case "booking_count": {
        const { count } = await admin
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("user_id", enrollment.user_id);
        actual = count ?? 0;
        break;
      }
      case "days_since_signup": {
        const { data } = await admin
          .from("profiles")
          .select("created_at")
          .eq("id", enrollment.user_id)
          .maybeSingle();
        if (data) {
          const created = new Date((data as Record<string, unknown>).created_at as string);
          actual = Math.floor((Date.now() - created.getTime()) / 86_400_000);
        }
        break;
      }
      case "club_member": {
        const { count } = await admin
          .from("club_memberships")
          .select("id", { count: "exact", head: true })
          .eq("user_id", enrollment.user_id)
          .eq("status", "active");
        actual = (count ?? 0) > 0;
        break;
      }
    }
  }

  if (field.startsWith("engagement.") && enrollment.email) {
    const engField = field.replace("engagement.", "");

    switch (engField) {
      case "opened_last_email":
      case "clicked_last_email": {
        // Check the most recent send to this email
        const { data } = await crmTable(admin, "campaign_sends")
          .select("opened_at, clicked_at")
          .eq("recipient_email", enrollment.email)
          .order("created_at", { ascending: false })
          .limit(1)
          .returns<{ opened_at: string | null; clicked_at: string | null }[]>();

        if (data && data.length > 0) {
          actual =
            engField === "opened_last_email"
              ? data[0].opened_at !== null
              : data[0].clicked_at !== null;
        } else {
          actual = false;
        }
        break;
      }
    }
  }

  // Compare
  return compareValue(actual, op, expected);
}

function compareValue(
  actual: string | number | boolean | null,
  op: string,
  expected: string
): boolean {
  if (actual === null) {
    return op === "exists" ? false : false;
  }

  const actualStr = String(actual);
  const actualNum = Number(actual);
  const expectedNum = Number(expected);

  switch (op) {
    case "eq":
      return actualStr === expected || actualStr === String(expected).toLowerCase();
    case "neq":
      return actualStr !== expected;
    case "gt":
      return !isNaN(actualNum) && !isNaN(expectedNum) && actualNum > expectedNum;
    case "lt":
      return !isNaN(actualNum) && !isNaN(expectedNum) && actualNum < expectedNum;
    case "contains":
      return actualStr.toLowerCase().includes(expected.toLowerCase());
    case "exists":
      return actual !== null && actual !== undefined;
    default:
      return false;
  }
}

// ─── Split Node ────────────────────────────────────────────────────

async function executeSplit(
  admin: SupabaseClient,
  enrollment: EnrollmentRow,
  node: NodeRow
): Promise<NodeResult> {
  const config = node.config as unknown as SplitNodeConfig;
  const pct = config.split_percent ?? 50;

  // Deterministic split based on enrollment ID hash
  const hash = simpleHash(enrollment.id);
  const bucket = hash % 100;
  const handle = bucket < pct ? "a" : "b";

  await logWorkflowStep(admin, enrollment, node, "split", {
    split_percent: pct,
    bucket,
    path: handle,
  });

  return { action: "advance", handle };
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// ─── Edge Resolution ───────────────────────────────────────────────

function findNextNode(
  edges: EdgeRow[],
  sourceNodeId: string,
  handle: string
): string | null {
  // Try exact handle match first
  const exact = edges.find(
    (e) => e.source_node_id === sourceNodeId && e.source_handle === handle
  );
  if (exact) return exact.target_node_id;

  // Fall back to "default" handle
  if (handle !== "default") {
    const fallback = edges.find(
      (e) => e.source_node_id === sourceNodeId && e.source_handle === "default"
    );
    if (fallback) return fallback.target_node_id;
  }

  return null;
}

// ─── Enrollment Helpers ────────────────────────────────────────────

async function completeEnrollment(
  admin: SupabaseClient,
  enrollmentId: string
): Promise<void> {
  await crmTable(admin, "crm_workflow_enrollments")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      last_processed_at: new Date().toISOString(),
    })
    .eq("id", enrollmentId);
}

async function exitEnrollment(
  admin: SupabaseClient,
  enrollmentId: string,
  reason: string
): Promise<void> {
  await crmTable(admin, "crm_workflow_enrollments")
    .update({
      status: "exited",
      completed_at: new Date().toISOString(),
      last_processed_at: new Date().toISOString(),
    })
    .eq("id", enrollmentId);

  console.log(
    `[workflow-engine] Enrollment ${enrollmentId} exited: ${reason}`
  );
}

// ─── Logging ───────────────────────────────────────────────────────

async function logWorkflowStep(
  admin: SupabaseClient,
  enrollment: EnrollmentRow,
  node: NodeRow | null,
  action: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await crmTable(admin, "crm_workflow_logs").insert({
      workflow_id: enrollment.workflow_id,
      enrollment_id: enrollment.id,
      node_id: node?.id ?? null,
      action,
      details: details ?? {},
    });
  } catch (err) {
    console.error("[workflow-engine] Failed to write log:", err);
  }
}

// ─── Trigger-based Enrollment ──────────────────────────────────────

/**
 * Enroll a user/email into all active workflows that match the given
 * trigger event. Called from fireCrmTrigger.
 */
export async function enrollInWorkflows(
  admin: SupabaseClient,
  event: string,
  context: {
    userId?: string;
    email: string;
    metadata?: Record<string, unknown>;
  }
): Promise<number> {
  // Find active workflows triggered by this event
  const { data: workflows } = await crmTable(admin, "crm_workflows")
    .select("id")
    .eq("status", "active")
    .eq("trigger_event", event)
    .returns<{ id: string }[]>();

  if (!workflows || workflows.length === 0) return 0;

  let enrolled = 0;

  for (const wf of workflows) {
    // Check for existing active enrollment
    const { data: existing } = await crmTable(admin, "crm_workflow_enrollments")
      .select("id")
      .eq("workflow_id", wf.id)
      .eq("email", context.email)
      .eq("status", "active")
      .maybeSingle();

    if (existing) continue;

    // Find the trigger node
    const { data: triggerNode } = await crmTable(admin, "crm_workflow_nodes")
      .select("id")
      .eq("workflow_id", wf.id)
      .eq("type", "trigger")
      .limit(1)
      .returns<{ id: string }[]>();

    if (!triggerNode || triggerNode.length === 0) continue;

    // Create enrollment at the trigger node
    await crmTable(admin, "crm_workflow_enrollments").insert({
      workflow_id: wf.id,
      user_id: context.userId ?? null,
      email: context.email,
      current_node_id: triggerNode[0].id,
      status: "active",
      wait_until: null,
      context_data: context.metadata ?? null,
    });

    enrolled++;
  }

  return enrolled;
}
