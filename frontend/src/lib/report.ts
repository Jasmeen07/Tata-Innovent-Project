import jsPDF from "jspdf";
import { aircraftId, technician } from "@/lib/demo-data";
import type { AlertRecord, ReportPayload } from "@/types/aeroguard";

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function exportReportPdf(report: ReportPayload, alerts: AlertRecord[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  let y = 18;

  const writeLine = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 72, y);
    y += 8;
  };

  doc.setFillColor(6, 16, 31);
  doc.rect(0, 0, pageWidth, 36, "F");
  doc.setTextColor(229, 241, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("AeroGuard Maintenance Report", margin, 22);
  doc.setTextColor(15, 23, 42);
  y = 48;

  writeLine("Aircraft ID", report.aircraft_id ?? aircraftId);
  writeLine("Technician", report.technician ?? technician);
  writeLine("Verification", report.maintenance_summary.verification_status.toUpperCase());
  writeLine("Generated", formatDate(report.generated_at));
  writeLine("Duration", `${report.time_taken.seconds ?? "Estimated"} seconds`);
  writeLine("Tools Used", `${report.maintenance_summary.total_tools_detected}`);
  writeLine("Alerts", `${report.maintenance_summary.active_alert_count}`);

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Checklist", margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  report.checklist.forEach((item) => {
    doc.text(`${item.completed ? "[x]" : "[ ]"} ${item.name}`, margin, y);
    y += 7;
  });

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Alert Summary", margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  alerts.slice(0, 6).forEach((alert) => {
    doc.text(`${alert.level.toUpperCase()} - ${alert.message.slice(0, 82)}`, margin, y);
    y += 7;
  });

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Verification Result", margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.text(
    report.maintenance_summary.missing_tool_count > 0
      ? "Blocked: missing tool reconciliation is required before aircraft release."
      : "Verified: all tracked tools are accounted for.",
    margin,
    y,
    { maxWidth: pageWidth - margin * 2 },
  );

  doc.save(`aeroguard-report-${Date.now()}.pdf`);
}

export function formatTimestamp(value?: string | null) {
  if (!value) return "Offline";
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}
