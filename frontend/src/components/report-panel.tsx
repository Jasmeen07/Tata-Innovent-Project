"use client";

import { Download, FileText, Printer, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { aircraftId, technician } from "@/lib/demo-data";
import { exportReportPdf, formatTimestamp } from "@/lib/report";
import type { AlertRecord, ReportPayload } from "@/types/aeroguard";

export function ReportPanel({
  reports,
  alerts,
  onGenerate,
}: {
  reports: ReportPayload[];
  alerts: AlertRecord[];
  onGenerate: () => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return reports;
    return reports.filter((report) => {
      const haystack = `${report.report_id ?? ""} ${report.aircraft_id ?? aircraftId} ${report.technician ?? technician} ${report.maintenance_summary.verification_status}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [query, reports]);

  async function handleGenerate() {
    setBusy(true);
    try {
      await onGenerate();
    } finally {
      setBusy(false);
    }
  }

  const latest = reports[0];

  return (
    <section className="panel rounded-lg p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-aero-300" />
          <h2 className="font-semibold text-white">Maintenance Report</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={handleGenerate} className="focus-ring inline-flex items-center gap-2 rounded-lg bg-aero-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-aero-400" disabled={busy}>
            <Printer className="h-4 w-4" />
            {busy ? "Generating" : "Generate"}
          </button>
          <button onClick={() => latest && exportReportPdf(latest, alerts)} className="focus-ring inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10" disabled={!latest}>
            <Download className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      {latest && (
        <div className="mb-4 grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Aircraft ID</p>
            <p className="mt-1 font-semibold text-white">{latest.aircraft_id ?? aircraftId}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Technician</p>
            <p className="mt-1 font-semibold text-white">{latest.technician ?? technician}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Verification Result</p>
            <p className="mt-1 font-semibold text-white">{latest.maintenance_summary.verification_status}</p>
          </div>
        </div>
      )}

      <div className="mb-3 flex items-center gap-2 rounded-lg border border-white/10 bg-hangar-950/60 px-3 py-2">
        <Search className="h-4 w-4 text-slate-500" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search history or filter by aircraft"
          className="w-full border-0 bg-transparent p-0 text-sm text-white placeholder:text-slate-500 focus:ring-0"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3">Report</th>
              <th className="px-3 py-3">Aircraft</th>
              <th className="px-3 py-3">Technician</th>
              <th className="px-3 py-3">Alerts</th>
              <th className="px-3 py-3">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filtered.map((report) => (
              <tr key={`${report.report_id ?? report.generated_at}`} className="text-slate-300">
                <td className="px-3 py-3 font-medium text-white">#{report.report_id ?? "local"}</td>
                <td className="px-3 py-3">{report.aircraft_id ?? aircraftId}</td>
                <td className="px-3 py-3">{report.technician ?? technician}</td>
                <td className="px-3 py-3">{report.maintenance_summary.active_alert_count}</td>
                <td className="px-3 py-3">{formatTimestamp(report.generated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
