import { MapPin, Wrench } from "lucide-react";
import { StatusPill } from "@/components/status";
import type { ToolRecord } from "@/types/aeroguard";

export function ToolMonitor({ tools }: { tools: ToolRecord[] }) {
  return (
    <section className="panel rounded-lg p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-aero-300" />
          <h2 className="font-semibold text-white">Live Tool Monitoring</h2>
        </div>
        <span className="text-sm text-slate-400">{tools.length} detected</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {tools.map((tool, index) => (
          <article key={`${tool.unique_id}-${tool.tool_name}-${tool.last_seen ?? index}`} className="panel-subtle rounded-lg p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-white">{tool.tool_name}</p>
                <p className="mt-1 text-xs text-slate-500">Tracking ID #{tool.unique_id}</p>
              </div>
              <StatusPill status={tool.status} />
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>Confidence</span>
                <span className="font-medium text-white">{Math.round((tool.confidence ?? 0.88) * 100)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-aero-400" style={{ width: `${Math.round((tool.confidence ?? 0.88) * 100)}%` }} />
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="h-4 w-4" />
                <span>{tool.current_position ? `${tool.current_position[0]}, ${tool.current_position[1]}` : "Not visible"}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
