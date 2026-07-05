"use client";

import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import type { AlertRecord, ToolRecord } from "@/types/aeroguard";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const chartOptions = {
  plugins: {
    legend: {
      labels: { color: "#cbd5e1", boxWidth: 12 },
    },
  },
  scales: {
    x: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(255,255,255,0.06)" } },
    y: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(255,255,255,0.06)" } },
  },
};

export function ChartsPanel({ tools, alerts }: { tools: ToolRecord[]; alerts: AlertRecord[] }) {
  const statusCounts = tools.reduce<Record<string, number>>((acc, tool) => {
    acc[tool.status] = (acc[tool.status] ?? 0) + 1;
    return acc;
  }, {});

  const alertCounts = alerts.reduce<Record<string, number>>((acc, alert) => {
    acc[alert.level] = (acc[alert.level] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="grid gap-4 xl:grid-cols-3">
      <div className="panel rounded-lg p-4">
        <h2 className="mb-4 font-semibold text-white">Tool Usage</h2>
        <Pie
          data={{
            labels: Object.keys(statusCounts),
            datasets: [{ data: Object.values(statusCounts), backgroundColor: ["#34d399", "#2f9cff", "#facc15", "#f87171"] }],
          }}
        />
      </div>
      <div className="panel rounded-lg p-4">
        <h2 className="mb-4 font-semibold text-white">Maintenance Duration</h2>
        <Bar
          options={chartOptions}
          data={{
            labels: ["Panel", "Tools", "Inspection", "Verification"],
            datasets: [{ label: "Minutes", data: [12, 18, 9, 6], backgroundColor: "#2f9cff", borderRadius: 6 }],
          }}
        />
      </div>
      <div className="panel rounded-lg p-4">
        <h2 className="mb-4 font-semibold text-white">Alert Frequency</h2>
        <Bar
          options={chartOptions}
          data={{
            labels: ["Green", "Yellow", "Red"],
            datasets: [{ label: "Alerts", data: [alertCounts.green ?? 0, alertCounts.yellow ?? 0, alertCounts.red ?? 0], backgroundColor: ["#34d399", "#facc15", "#f87171"], borderRadius: 6 }],
          }}
        />
      </div>
    </section>
  );
}
