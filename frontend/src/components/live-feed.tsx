"use client";

import { Camera, ExternalLink, Maximize2, RefreshCw, ScanLine, Wifi, WifiOff } from "lucide-react";
import { useRef, useState } from "react";
import type { LiveState } from "@/types/aeroguard";
import { formatTimestamp } from "@/lib/report";

export function LiveFeed({
  live,
  apiUrl,
  onRefresh,
}: {
  live: LiveState;
  apiUrl: string;
  onRefresh: () => Promise<void>;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [refreshing, setRefreshing] = useState(false);
  const hasFrame = Boolean(live.frame_jpeg_base64);
  const apiConnected = Boolean(live.timestamp);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleFullscreen() {
    await frameRef.current?.requestFullscreen?.();
  }

  return (
    <section className="panel overflow-hidden rounded-lg">
      <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-aero-300" />
          <h2 className="font-semibold text-white">Live Camera Feed</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${apiConnected ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" : "border-red-400/40 bg-red-400/10 text-red-200"}`}>
            {apiConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {apiConnected ? "API connected" : "API offline"}
          </span>
          <button onClick={handleRefresh} className="focus-ring inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:border-aero-400/40 hover:bg-aero-400/10">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button onClick={handleFullscreen} className="focus-ring grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-white transition hover:border-aero-400/40 hover:bg-aero-400/10" aria-label="Fullscreen live feed">
            <Maximize2 className="h-4 w-4" />
          </button>
          <a href={`${apiUrl}/live?include_frame=true`} target="_blank" className="focus-ring grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-white transition hover:border-aero-400/40 hover:bg-aero-400/10" aria-label="Open raw live API">
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
      <div ref={frameRef} className="relative aspect-video min-h-72 bg-hangar-950">
        {live.frame_jpeg_base64 ? (
          // FastAPI returns a base64 JPEG when /live?include_frame=true is requested.
          // eslint-disable-next-line @next/next/no-img-element
          <img className="h-full w-full object-cover" src={`data:image/jpeg;base64,${live.frame_jpeg_base64}`} alt="AeroGuard live maintenance camera" />
        ) : (
          <div className="grid h-full place-items-center bg-[linear-gradient(120deg,rgba(47,156,255,0.10),transparent),repeating-linear-gradient(0deg,rgba(255,255,255,0.04)_0_1px,transparent_1px_48px),repeating-linear-gradient(90deg,rgba(255,255,255,0.035)_0_1px,transparent_1px_64px)]">
            <div className="text-center">
              <ScanLine className="mx-auto h-12 w-12 text-aero-300" />
              <p className="mt-4 text-lg font-semibold text-white">{apiConnected ? "No frame produced yet" : "Synthetic hangar preview"}</p>
              <p className="mt-1 text-sm text-slate-400">
                {apiConnected ? "FastAPI is responding, but frame_jpeg_base64 is empty." : "Connect FastAPI for live AI overlay frames."}
              </p>
            </div>
          </div>
        )}
        <div className="absolute left-4 top-4 rounded-lg border border-white/10 bg-black/45 px-3 py-2 text-xs text-slate-200 backdrop-blur">
          Last update: {formatTimestamp(live.last_update)}
        </div>
        {!hasFrame && apiConnected && (
          <div className="absolute right-4 top-4 max-w-xs rounded-lg border border-yellow-300/30 bg-yellow-300/10 px-3 py-2 text-xs text-yellow-100 backdrop-blur">
            Backend API works, but its processing thread has not emitted an image frame.
          </div>
        )}
        <div className="absolute bottom-4 left-4 right-4 grid gap-2 sm:grid-cols-2">
          {live.detections.slice(0, 2).map((item) => (
            <div key={item.object_id} className="rounded-lg border border-aero-400/30 bg-aero-950/40 px-3 py-2 text-xs backdrop-blur">
              <span className="font-semibold text-aero-200">ID #{item.object_id}</span>
              <span className="ml-2 text-slate-300">{item.class_name}</span>
              <span className="float-right text-slate-400">{Math.round(item.confidence * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
