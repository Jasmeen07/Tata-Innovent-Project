import { AlertTriangle, CheckCircle2, CircleDotDashed, LoaderCircle, XCircle } from "lucide-react";
import type { AlertLevel, ToolStatus } from "@/types/aeroguard";

const toolStyles: Record<ToolStatus, string> = {
  available: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  in_use: "border-aero-400/40 bg-aero-400/10 text-aero-200",
  searching: "border-yellow-300/40 bg-yellow-300/10 text-yellow-100",
  missing: "border-red-400/50 bg-red-400/10 text-red-200",
  returned: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
};

const levelStyles: Record<AlertLevel, string> = {
  green: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  yellow: "border-yellow-300/40 bg-yellow-300/10 text-yellow-100",
  red: "border-red-400/50 bg-red-400/10 text-red-200",
};

export function StatusPill({ status }: { status: ToolStatus }) {
  const Icon = status === "missing" ? XCircle : status === "searching" ? LoaderCircle : status === "in_use" ? CircleDotDashed : CheckCircle2;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${toolStyles[status]}`}>
      <Icon className={`h-3.5 w-3.5 ${status === "searching" ? "animate-spin" : ""}`} />
      {status.replace("_", " ")}
    </span>
  );
}

export function AlertPill({ level }: { level: AlertLevel }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${levelStyles[level]}`}>
      <AlertTriangle className="h-3.5 w-3.5" />
      {level}
    </span>
  );
}

export function CompletionRing({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(value, 100));
  return (
    <div
      className="grid h-24 w-24 place-items-center rounded-full"
      style={{ background: `conic-gradient(#2f9cff ${clamped * 3.6}deg, rgba(255,255,255,0.1) 0deg)` }}
    >
      <div className="grid h-[4.7rem] w-[4.7rem] place-items-center rounded-full bg-hangar-950">
        <span className="text-xl font-bold text-white">{clamped}%</span>
      </div>
    </div>
  );
}
