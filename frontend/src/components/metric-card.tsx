import type { LucideIcon } from "lucide-react";

export function MetricCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: LucideIcon }) {
  return (
    <section className="panel rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-aero-400/25 bg-aero-400/10 text-aero-200">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </section>
  );
}
