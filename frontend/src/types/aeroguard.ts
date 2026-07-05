export type ToolStatus = "available" | "in_use" | "searching" | "missing" | "returned";
export type AlertLevel = "green" | "yellow" | "red";

export type BoundingBox = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type Detection = {
  bbox: BoundingBox;
  class_name: string;
  confidence: number;
  object_id: number;
  disappeared_frames?: number;
  timestamp?: string;
};

export type ToolRecord = {
  unique_id: number;
  tool_name: string;
  entry_time: string;
  exit_time?: string | null;
  current_position?: [number, number] | null;
  movement_history?: unknown[];
  status: ToolStatus;
  last_seen: string;
  missing_since?: string | null;
  confidence?: number;
};

export type ChecklistItem = {
  id: number;
  name: string;
  required_tools: string[];
  completed: boolean;
  completed_at?: string | null;
};

export type AlertRecord = {
  id?: number | null;
  level: AlertLevel;
  message: string;
  tool_id?: number | null;
  tool_name?: string | null;
  created_at: string;
  resolved: boolean;
  metadata?: Record<string, unknown>;
};

export type LiveState = {
  system: string;
  timestamp: string;
  last_update: string | null;
  status: AlertLevel;
  message: string;
  detections: Detection[];
  tools: ToolRecord[];
  alerts: AlertRecord[];
  checklist: ChecklistItem[];
  workspace_left_behind: ToolRecord[];
  frame_jpeg_base64?: string | null;
};

export type ReportPayload = {
  report_id?: number;
  title: string;
  generated_at: string;
  aircraft_id?: string;
  technician?: string;
  maintenance_summary: {
    verification_status: string;
    total_tools_detected: number;
    missing_tool_count: number;
    active_alert_count: number;
  };
  missing_tool_report: ToolRecord[];
  tool_usage: ToolRecord[];
  checklist: ChecklistItem[];
  time_taken: {
    seconds?: number;
    started_at?: string | null;
    ended_at?: string | null;
  };
  pdf_ready_sections: string[];
};
