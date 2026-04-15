"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { downloadCSV } from "@/lib/csv";
import { toDateString } from "@/lib/utils";

type ExportType = "payouts" | "exceptions" | "revenue" | "cash_flow";

const EXPORT_OPTIONS: Array<{ type: ExportType; label: string }> = [
  { type: "payouts", label: "Payouts" },
  { type: "exceptions", label: "Exceptions" },
  { type: "revenue", label: "Revenue Streams" },
  { type: "cash_flow", label: "Cash Flow" },
];

export default function FinanceExportButton() {
  const [exporting, setExporting] = useState<ExportType | null>(null);
  const [open, setOpen] = useState(false);

  async function handleExport(type: ExportType) {
    setExporting(type);
    try {
      switch (type) {
        case "payouts":
          await exportPayouts();
          break;
        case "exceptions":
          await exportExceptions();
          break;
        case "revenue":
          await exportRevenue();
          break;
        case "cash_flow":
          await exportCashFlow();
          break;
      }
    } finally {
      setExporting(null);
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-md bg-parchment px-3 py-1.5 text-sm text-text-primary hover:bg-parchment-light"
      >
        <Download className="h-3.5 w-3.5" />
        Export CSV
      </button>

      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-stone-light bg-white py-1 shadow-lg">
          {EXPORT_OPTIONS.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => handleExport(type)}
              disabled={exporting !== null}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-parchment disabled:opacity-50"
            >
              {exporting === type ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 text-text-light" />
              )}
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

async function exportPayouts() {
  const res = await fetch("/api/admin/finance-ops");
  if (!res.ok) return;
  const data = await res.json();

  const rows: string[][] = [
    ["Payout ID", "Amount", "Status", "Reconciliation", "Arrival Date", "Items", "Created"],
  ];

  for (const p of data.payouts ?? []) {
    rows.push([
      p.stripe_payout_id,
      String(p.amount),
      p.status,
      p.reconciliation_status,
      p.arrival_date ?? "",
      String(p.item_count),
      p.created_at,
    ]);
  }

  downloadCSV(rows, `anglerpass-payouts-${toDateString()}.csv`);
}

async function exportExceptions() {
  const res = await fetch("/api/admin/finance-ops/exceptions?all=true");
  if (!res.ok) return;
  const data = await res.json();

  const rows: string[][] = [
    ["Type", "Severity", "Status", "Description", "Age (days)", "Created", "Resolved At", "Resolution Note"],
  ];

  for (const ex of data.exceptions ?? []) {
    rows.push([
      ex.type,
      ex.severity,
      ex.status,
      ex.description,
      String(ex.age_days),
      ex.created_at,
      ex.resolved_at ?? "",
      ex.resolution_note ?? "",
    ]);
  }

  downloadCSV(rows, `anglerpass-exceptions-${toDateString()}.csv`);
}

async function exportRevenue() {
  const res = await fetch("/api/admin/finance-ops/revenue-streams?days=90");
  if (!res.ok) return;
  const data = await res.json();

  const rows: string[][] = [
    ["Date", "Platform Fees", "Cross-Club Fees", "Independent Guide Service Fees", "Membership Fees", "Compass Credits"],
  ];

  for (const day of data.daily ?? []) {
    rows.push([
      day.date,
      String(day.platform),
      String(day.cross_club),
      String(day.guide),
      String(day.membership),
      String(day.compass),
    ]);
  }

  // Add totals row
  rows.push([
    "TOTAL",
    String(data.streams.platform_fees),
    String(data.streams.cross_club_fees),
    String(data.streams.guide_service_fees),
    String(data.streams.membership_fees),
    String(data.streams.compass_credit_revenue),
  ]);

  downloadCSV(rows, `anglerpass-revenue-${toDateString()}.csv`);
}

async function exportCashFlow() {
  const res = await fetch("/api/admin/finance-ops/cash-flow?days=90");
  if (!res.ok) return;
  const data = await res.json();

  const rows: string[][] = [
    ["Date", "Payouts Created", "Settled in Mercury"],
  ];

  for (const day of data.daily_payouts ?? []) {
    rows.push([day.date, String(day.created), String(day.settled)]);
  }

  downloadCSV(rows, `anglerpass-cash-flow-${toDateString()}.csv`);
}
