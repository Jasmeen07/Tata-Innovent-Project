"use client";

import { Activity, ClipboardCheck, Clock3, Plane, RadioTower, UserRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertsPanel } from "@/components/alerts-panel";
import { ChartsPanel } from "@/components/charts-panel";
import { ChecklistPanel } from "@/components/checklist-panel";
import { AppView, LayoutShell } from "@/components/layout-shell";
import { LiveFeed } from "@/components/live-feed";
import { MetricCard } from "@/components/metric-card";
import { ReportPanel } from "@/components/report-panel";
import { CompletionRing } from "@/components/status";
import { ToolMonitor } from "@/components/tool-monitor";
import { API_BASE_URL, fetchAlerts, fetchChecklist, fetchLiveState, fetchTools, generateReport } from "@/lib/api";
import { aircraftId, currentTask, technician } from "@/lib/demo-data";
import { formatTimestamp } from "@/lib/report";
import type { AlertRecord, ChecklistItem, LiveState, ReportPayload, ToolRecord } from "@/types/aeroguard";

const reportsKey = "aeroguard.report.history";

export default function DashboardPage() {
  const [live, setLive] = useState<LiveState | null>(null);
  const [tools, setTools] = useState<ToolRecord[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [reports, setReports] = useState<ReportPayload[]>([]);
  const [activeView, setActiveView] = useState<AppView>("dashboard");

  const completion = useMemo(() => {
    if (!checklist.length) return 0;
    return Math.round((checklist.filter((item) => item.completed).length / checklist.length) * 100);
  }, [checklist]);

  const refresh = useCallback(async () => {
    const [nextLive, nextTools, nextChecklist, nextAlerts] = await Promise.all([
      fetchLiveState(true),
      fetchTools(),
      fetchChecklist(),
      fetchAlerts(),
    ]);
    setLive(nextLive);
    setTools(nextTools.length ? nextTools : nextLive.tools);
    setChecklist(nextChecklist.length ? nextChecklist : nextLive.checklist);
    setAlerts(nextAlerts.length ? nextAlerts : nextLive.alerts);
  }, []);

  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, 1000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const stored = window.localStorage.getItem(reportsKey);
    if (stored) setReports(JSON.parse(stored) as ReportPayload[]);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(reportsKey, JSON.stringify(reports.slice(0, 25)));
  }, [reports]);

  async function handleGenerateReport() {
    const report = await generateReport();
    const enriched = { ...report, aircraft_id: report.aircraft_id ?? aircraftId, technician: report.technician ?? technician };
    setReports((current) => [enriched, ...current].slice(0, 25));
  }

  const liveState = live;
  const activeAlerts = alerts.filter((alert) => !alert.resolved);
  const missingTools = tools.filter((tool) => tool.status === "missing").length;

  return (
    <LayoutShell activeView={activeView} onViewChange={setActiveView}>
      <div className="mx-auto max-w-[1800px] space-y-5">
        <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="panel rounded-lg p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-aero-300">Line maintenance bay 04</p>
                <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">{aircraftId}</h2>
                <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
                  <span className="inline-flex items-center gap-2"><UserRound className="h-4 w-4 text-aero-300" />{technician}</span>
                  <span className="inline-flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-aero-300" />{currentTask}</span>
                  <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-aero-300" />{formatTimestamp(liveState?.last_update)}</span>
                </div>
              </div>
              <CompletionRing value={completion} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <MetricCard label="Current Status" value={liveState?.status?.toUpperCase() ?? "SYNC"} detail={liveState?.message ?? "Waiting for backend"} icon={Activity} />
            <MetricCard label="Realtime Link" value="REST" detail="Polling every second" icon={RadioTower} />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Today's Aircraft" value="7" detail="3 awaiting release" icon={Plane} />
          <MetricCard label="Tools Detected" value={`${tools.length}`} detail={`${missingTools} missing`} icon={Activity} />
          <MetricCard label="Active Alerts" value={`${activeAlerts.length}`} detail="Critical alerts animate" icon={RadioTower} />
          <MetricCard label="Completion" value={`${completion}%`} detail={currentTask} icon={ClipboardCheck} />
        </section>

        {activeView === "dashboard" && (
          <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            {liveState && <LiveFeed live={liveState} apiUrl={API_BASE_URL} onRefresh={refresh} />}
            <div className="grid gap-4">
              <ChecklistPanel checklist={checklist} />
              <AlertsPanel alerts={activeAlerts} />
            </div>
          </section>
        )}

        {activeView === "live" && liveState && <LiveFeed live={liveState} apiUrl={API_BASE_URL} onRefresh={refresh} />}
        {activeView === "tools" && <ToolMonitor tools={tools} />}
        {activeView === "analytics" && <ChartsPanel tools={tools} alerts={alerts} />}
        {activeView === "reports" && <ReportPanel reports={reports} alerts={alerts} onGenerate={handleGenerateReport} />}
      </div>
    </LayoutShell>
  );
}
