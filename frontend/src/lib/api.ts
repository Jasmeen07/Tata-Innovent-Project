import { createDemoLiveState, createDemoReport } from "@/lib/demo-data";
import type { AlertRecord, ChecklistItem, LiveState, ReportPayload, ToolRecord } from "@/types/aeroguard";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`AeroGuard API ${path} returned ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function normalizeTool(tool: ToolRecord): ToolRecord {
  return {
    ...tool,
    status: tool.status === "returned" ? "available" : tool.status,
    confidence: tool.confidence ?? 0.88,
  };
}

function dedupeTools(tools: ToolRecord[]): ToolRecord[] {
  const byIdentity = new Map<string, ToolRecord>();

  tools.map(normalizeTool).forEach((tool) => {
    const key = `${tool.unique_id}-${tool.tool_name}`;
    const existing = byIdentity.get(key);
    if (!existing || new Date(tool.last_seen).getTime() >= new Date(existing.last_seen).getTime()) {
      byIdentity.set(key, tool);
    }
  });

  return [...byIdentity.values()];
}

export async function fetchLiveState(includeFrame = true): Promise<LiveState> {
  try {
    const live = await getJson<LiveState>(`/live?include_frame=${includeFrame}`);
    return {
      ...live,
      tools: dedupeTools(live.tools ?? []),
      checklist: live.checklist ?? [],
      alerts: live.alerts ?? [],
    };
  } catch {
    return createDemoLiveState();
  }
}

export async function fetchTools(): Promise<ToolRecord[]> {
  try {
    const payload = await getJson<{ tools: ToolRecord[]; database?: ToolRecord[] }>("/tools");
    return dedupeTools([...(payload.tools ?? []), ...(payload.database ?? [])]);
  } catch {
    return createDemoLiveState().tools;
  }
}

export async function fetchChecklist(): Promise<ChecklistItem[]> {
  try {
    const payload = await getJson<{ checklist: ChecklistItem[] }>("/checklist");
    return payload.checklist ?? [];
  } catch {
    return createDemoLiveState().checklist;
  }
}

export async function fetchAlerts(): Promise<AlertRecord[]> {
  try {
    const payload = await getJson<{ active: AlertRecord[]; database?: AlertRecord[] }>("/alerts?include_resolved=true");
    const byKey = new Map<string, AlertRecord>();
    [...(payload.active ?? []), ...(payload.database ?? [])].forEach((alert) => {
      byKey.set(`${alert.id ?? alert.created_at}-${alert.message}`, alert);
    });
    return [...byKey.values()];
  } catch {
    return createDemoLiveState().alerts;
  }
}

export async function generateReport(): Promise<ReportPayload> {
  try {
    return await getJson<ReportPayload>("/report");
  } catch {
    return createDemoReport();
  }
}

export { API_BASE_URL };
