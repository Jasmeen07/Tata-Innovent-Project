import { CheckSquare, Square } from "lucide-react";
import type { ChecklistItem } from "@/types/aeroguard";

export function ChecklistPanel({ checklist }: { checklist: ChecklistItem[] }) {
  return (
    <section className="panel rounded-lg p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-white">Maintenance Checklist</h2>
        <span className="text-sm text-slate-400">{checklist.filter((item) => item.completed).length}/{checklist.length}</span>
      </div>
      <div className="space-y-3">
        {checklist.map((item) => (
          <label key={item.id} className="flex cursor-default items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            {item.completed ? <CheckSquare className="h-5 w-5 text-emerald-300" /> : <Square className="h-5 w-5 text-slate-500" />}
            <span className={item.completed ? "text-white" : "text-slate-300"}>{item.name}</span>
            {item.required_tools.length > 0 && <span className="ml-auto text-xs text-slate-500">{item.required_tools.join(", ")}</span>}
          </label>
        ))}
      </div>
    </section>
  );
}
