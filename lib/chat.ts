export type Approval = {
  id: string;
  kind: "book" | "cancel" | "reschedule";
  expiresAt: string;
  details: Record<string, unknown>;
  status?: "pending" | "submitted" | "confirmed" | "superseded" | "failed";
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  approval?: Approval;
  error?: boolean;
};

export type ChatEvent =
  | { type: "session"; sessionId: string }
  | { type: "delta"; text: string }
  | { type: "approval_required"; approval: Approval }
  | { type: "action_outcome"; approvalId: string; action: Approval["kind"]; status: string }
  | { type: "done"; sessionId: string }
  | { type: "error"; error: string };

export type ChatPayload =
  | { message: string; sessionId?: string }
  | { sessionId: string; approval: { id: string; confirm: true } };
