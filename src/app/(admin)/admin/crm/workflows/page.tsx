"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  GitBranch,
  Play,
  Pause,
  Trash2,
} from "lucide-react";
import AdminPageGuard from "@/components/admin/AdminPageGuard";
import CampaignStatusBadge from "@/components/admin/crm/CampaignStatusBadge";
import type { CampaignStatus } from "@/lib/crm/types";

interface WorkflowRow {
  id: string;
  name: string;
  description: string | null;
  status: string;
  trigger_event: string | null;
  node_count: number;
  active_enrollments: number;
  updated_at: string;
}

export default function CrmWorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/crm/workflows");
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data.workflows ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createWorkflow = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/crm/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Workflow" }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/crm/workflows/${data.workflow.id}`);
      }
    } finally {
      setCreating(false);
    }
  };

  const deleteWorkflow = async (id: string) => {
    if (!confirm("Delete this workflow?")) return;
    const res = await fetch(`/api/admin/crm/workflows/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      load();
    } else {
      const data = await res.json();
      alert(data.error ?? "Failed to delete");
    }
  };

  return (
    <AdminPageGuard path="/admin/crm">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            Visual automation flows with branching logic.
          </p>
          <button
            onClick={createWorkflow}
            disabled={creating}
            className="flex items-center gap-1.5 rounded-md bg-forest px-3 py-2 text-xs font-medium text-white hover:bg-forest-deep disabled:opacity-50"
          >
            {creating ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Plus className="size-3.5" />
            )}
            New Workflow
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-charcoal" />
          </div>
        ) : workflows.length === 0 ? (
          <div className="rounded-lg border border-stone-light/20 p-8 text-center">
            <GitBranch className="mx-auto size-8 text-stone" />
            <p className="mt-2 text-sm text-text-secondary">
              No workflows yet
            </p>
            <p className="mt-1 text-xs text-text-light">
              Create your first workflow to automate multi-step&nbsp;sequences.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {workflows.map((wf) => (
              <div
                key={wf.id}
                className="flex items-center gap-4 rounded-lg border border-stone-light/20 bg-white p-4"
              >
                <button
                  onClick={() =>
                    router.push(`/admin/crm/workflows/${wf.id}`)
                  }
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex items-center gap-2">
                    <GitBranch className="size-4 text-river" />
                    <p className="truncate text-sm font-medium text-text-primary">
                      {wf.name}
                    </p>
                    <CampaignStatusBadge
                      status={wf.status as CampaignStatus}
                    />
                  </div>
                  <p className="mt-0.5 text-xs text-text-light">
                    {wf.node_count} node{wf.node_count !== 1 ? "s" : ""}
                    {wf.active_enrollments > 0 &&
                      ` · ${wf.active_enrollments} active`}
                    {wf.trigger_event &&
                      ` · Trigger: ${wf.trigger_event}`}
                    {" · Updated "}
                    {new Date(wf.updated_at).toLocaleDateString()}
                  </p>
                </button>

                <div className="flex shrink-0 items-center gap-1">
                  {wf.status !== "active" && (
                    <button
                      onClick={() => deleteWorkflow(wf.id)}
                      className="rounded p-1.5 text-stone hover:text-red-500"
                      aria-label="Delete workflow"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminPageGuard>
  );
}
