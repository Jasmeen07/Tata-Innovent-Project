import type { AlertRecord, ChecklistItem, LiveState, ReportPayload, ToolRecord } from "@/types/aeroguard";

export const aircraftId = "AG-782 NEO";
export const technician = "Priya Raman";
export const currentTask = "Left wing access panel verification";

export const demoTools: ToolRecord[] = [
  {
    unique_id: 101,
    tool_name: "Torque Wrench",
    entry_time: new Date(Date.now() - 28 * 60_000).toISOString(),
    current_position: [412, 288],
    status: "available",
    last_seen: new Date().toISOString(),
    confidence: 0.96,
  },
  {
    unique_id: 118,
    tool_name: "Screwdriver",
    entry_time: new Date(Date.now() - 24 * 60_000).toISOString(),
    current_position: [528, 312],
    status: "in_use",
    last_seen: new Date().toISOString(),
    confidence: 0.93,
  },
  {
    unique_id: 126,
    tool_name: "Inspection Light",
    entry_time: new Date(Date.now() - 19 * 60_000).toISOString(),
    current_position: [282, 341],
    status: "searching",
    last_seen: new Date(Date.now() - 18_000).toISOString(),
    confidence: 0.71,
  },
  {
    unique_id: 134,
    tool_name: "Wrench",
    entry_time: new Date(Date.now() - 31 * 60_000).toISOString(),
    current_position: null,
    status: "missing",
    last_seen: new Date(Date.now() - 96_000).toISOString(),
    missing_since: new Date(Date.now() - 80_000).toISOString(),
    confidence: 0.64,
  },
];

export const demoChecklist: ChecklistItem[] = [
  { id: 1, name: "Remove Panel", required_tools: ["Screwdriver"], completed: true, completed_at: new Date(Date.now() - 18 * 60_000).toISOString() },
  { id: 2, name: "Use Screwdriver", required_tools: ["Screwdriver"], completed: true, completed_at: new Date(Date.now() - 12 * 60_000).toISOString() },
  { id: 3, name: "Return Wrench", required_tools: ["Wrench"], completed: false },
  { id: 4, name: "Final Inspection", required_tools: ["Inspection Light"], completed: false },
];

export const demoAlerts: AlertRecord[] = [
  {
    id: 88,
    level: "red",
    message: "Missing Tool: Wrench has not been detected in the bay.",
    tool_id: 134,
    tool_name: "Wrench",
    created_at: new Date(Date.now() - 82_000).toISOString(),
    resolved: false,
  },
  {
    id: 91,
    level: "yellow",
    message: "Checklist Incomplete: final inspection still pending.",
    created_at: new Date(Date.now() - 38_000).toISOString(),
    resolved: false,
  },
];

export function createDemoLiveState(): LiveState {
  return {
    system: "AeroGuard",
    timestamp: new Date().toISOString(),
    last_update: new Date().toISOString(),
    status: "red",
    message: "Tool return verification blocked",
    detections: [
      { object_id: 118, class_name: "screwdriver", confidence: 0.93, bbox: { x1: 498, y1: 286, x2: 560, y2: 342 } },
      { object_id: 126, class_name: "inspection_light", confidence: 0.71, bbox: { x1: 254, y1: 316, x2: 312, y2: 364 } },
    ],
    tools: demoTools,
    alerts: demoAlerts,
    checklist: demoChecklist,
    workspace_left_behind: [demoTools[3]],
    frame_jpeg_base64: null,
  };
}

export function createDemoReport(): ReportPayload {
  return {
    report_id: Date.now(),
    title: "AeroGuard Maintenance Verification Report",
    generated_at: new Date().toISOString(),
    aircraft_id: aircraftId,
    technician,
    maintenance_summary: {
      verification_status: "blocked",
      total_tools_detected: demoTools.length,
      missing_tool_count: 1,
      active_alert_count: demoAlerts.length,
    },
    missing_tool_report: demoTools.filter((tool) => tool.status === "missing"),
    tool_usage: demoTools,
    checklist: demoChecklist,
    time_taken: {
      started_at: demoTools[3].entry_time,
      ended_at: new Date().toISOString(),
    },
    pdf_ready_sections: ["maintenance_summary", "missing_tool_report", "tool_usage", "checklist"],
  };
}
