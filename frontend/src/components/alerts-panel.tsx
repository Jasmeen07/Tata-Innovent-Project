import { BellRing } from "lucide-react";
import { AlertPill } from "@/components/status";
import type { AlertRecord } from "@/types/aeroguard";
import { formatTimestamp } from "@/lib/report";

export function AlertsPanel({ alerts }: { alerts: AlertRecord[] }) {
  return (
    <section className="panel rounded-lg p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BellRing className="h-5 w-5 text-aero-300" />
          <h2 className="font-semibold text-white">Alerts</h2>
        </div>
        <span className="text-sm text-slate-400">{alerts.filter((alert) => !alert.resolved).length} active</span>
      </div>
      <div className="space-y-3">
        {alerts.slice(0, 5).map((alert, index) => (
          <article key={`${alert.id ?? index}-${alert.created_at}`} className={`rounded-lg border bg-white/[0.035] p-3 ${alert.level === "red" ? "animate-pulseAlert border-red-400/40" : "border-white/10"}`}>
            <div className="flex items-center justify-between gap-2">
              <AlertPill level={alert.level} />
              <span className="text-xs text-slate-500">{formatTimestamp(alert.created_at)}</span>
            </div>
            <p className="mt-3 text-sm text-slate-200">{alert.message}</p>
          </article>
        ))}
        {alerts.length === 0 && <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">No active maintenance alerts.</p>}
      </div>
    </section>
  );
}
