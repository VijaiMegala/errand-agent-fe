import { Button } from "@mui/material";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import type { Approval } from "@/lib/chat";

const labels: Record<Approval["kind"], string> = {
  book: "Review your booking request",
  cancel: "Review your cancellation",
  reschedule: "Review reschedule request",
};

const displayFields: Record<Approval["kind"], [string, string][]> = {
  book: [
    ["providerName", "Professional"], ["service", "Service"], ["area", "Area"],
    ["startsAt", "Starts"], ["endsAt", "Ends"], ["quotedPrice", "Quoted price"],
  ],
  cancel: [
    ["service", "Service"], ["startsAt", "Current time"],
    ["quotedPrice", "Original quote"], ["providerId", "Provider ID"],
    ["bookingId", "Booking ID"], ["slot", "Slot"],
  ],
  reschedule: [
    ["service", "Service"], ["oldStartsAt", "Current time"], ["newStartsAt", "New time"], ["newEndsAt", "New end time"],
    ["quotedPrice", "Quoted price"], ["providerId", "Provider ID"],
    ["bookingId", "Booking ID"], ["oldSlot", "Current slot"], ["newSlot", "New slot"],
  ],
};

function formatValue(key: string, value: unknown) {
  if (key === "quotedPrice" && typeof value === "number") {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
  }
  if ((key.toLowerCase().includes("starts") || key === "endsAt" || key === "newEndsAt") && typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(parsed);
    }
  }
  return String(value);
}

export function ApprovalCard({ approval, busy, onConfirm }: {
  approval: Approval;
  busy: boolean;
  onConfirm: (approval: Approval) => void;
}) {
  const expired = new Date(approval.expiresAt).getTime() <= Date.now();
  const active = approval.status === "pending" && !expired;
  return (
    <div className="approval-card">
      <div className="approval-card-title"><CheckCircleOutlineRoundedIcon fontSize="small" />{labels[approval.kind]}</div>
      <div className="approval-grid">
        {displayFields[approval.kind].filter(([key]) => approval.details[key] != null).map(([key, label]) => (
          <div className="approval-field" key={key}><small>{label}</small><strong>{formatValue(key, approval.details[key])}</strong></div>
        ))}
      </div>
      <div className="approval-foot">
        {approval.status === "submitted" ? "Request sent. Awaiting provider acceptance." :
          approval.status === "confirmed" ? "Action confirmed." :
          approval.status === "failed" ? "This request could not be completed. Check the reply below." :
          approval.status === "superseded" ? "This proposal was replaced by your next message." :
          expired ? "This proposal has expired. Ask for fresh availability." :
          "Available until " + new Intl.DateTimeFormat("en-IN", { timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(approval.expiresAt))}
      </div>
      <Button variant="contained" fullWidth disabled={!active || busy} onClick={() => onConfirm(approval)}
        sx={{ borderRadius: "12px", textTransform: "none", fontSize: 12, fontWeight: 800, boxShadow: "none" }}>
        {approval.kind === "book" ? "Send request to provider" : approval.kind === "cancel" ? "Confirm cancellation" : "Send reschedule request"}
      </Button>
    </div>
  );
}
