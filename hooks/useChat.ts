"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { streamChat } from "@/lib/api";
import type { Approval, ChatEvent, ChatMessage, ChatPayload } from "@/lib/chat";

const makeId = () => crypto.randomUUID();

export function useChat(onAuthExpired: () => void, onSession: (id: string) => void) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>();
  const [busy, setBusy] = useState(false);
  const sessionRef = useRef<string | undefined>(undefined);
  const busyRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef(new Map<string, ChatMessage[]>());

  useEffect(() => {
    if (sessionRef.current && !busy) cacheRef.current.set(sessionRef.current, messages);
  }, [messages, busy]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    sessionRef.current = undefined;
    setSessionId(undefined);
    setMessages([]);
    busyRef.current = false;
    setBusy(false);
  }, []);

  const openSession = useCallback((id: string, history: ChatMessage[]) => {
    if (busyRef.current) return false;
    sessionRef.current = id;
    setSessionId(id);
    setMessages(cacheRef.current.get(id) || history);
    return true;
  }, []);
  const forgetSession = useCallback((id: string) => { cacheRef.current.delete(id); }, []);
  const clearAll = useCallback(() => { reset(); cacheRef.current.clear(); }, [reset]);
  const getSessionId = useCallback(() => sessionRef.current, []);

  const run = useCallback(async (payload: ChatPayload, token: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const replyId = makeId();
    const controller = new AbortController();
    abortRef.current = controller;
    setMessages((current) => [
      ...current,
      { id: replyId, role: "assistant", text: "" },
    ]);
    const onEvent = (event: ChatEvent) => {
      if (abortRef.current !== controller) return;
      if (event.type === "session" || event.type === "done") {
        sessionRef.current = event.sessionId;
        setSessionId(event.sessionId);
        if (event.type === "session") onSession(event.sessionId);
      }
      if (event.type === "delta") {
        setMessages((current) => current.map((item) =>
          item.id === replyId ? { ...item, text: item.text + event.text } : item,
        ));
      }
      if (event.type === "approval_required") {
        setMessages((current) => current.map((item) =>
          item.id === replyId
            ? { ...item, approval: { ...event.approval, status: "pending" } }
            : item,
        ));
      }
      if (event.type === "action_outcome") {
        const successful = event.status === "request_sent" ||
          ["confirmed", "cancelled", "rescheduled"].includes(event.status);
        const status = event.status === "request_sent" ? "submitted" as const
          : successful ? "confirmed" as const : "failed" as const;
        setMessages((current) => current.map((item) =>
          item.approval?.id === event.approvalId
            ? { ...item, approval: { ...item.approval, status } }
            : item,
        ));
      }
    };
    try {
      await streamChat(payload, token, onEvent, controller.signal);
      return true;
    } catch (error) {
      if (!controller.signal.aborted) {
        const message = error instanceof Error ? error.message : "Something went wrong.";
        if (/expired access token|invalid access token/i.test(message)) onAuthExpired();
        setMessages((current) => current.map((item) =>
          item.id === replyId
            ? { ...item, text: item.text ? item.text + "\n\n" + message : message, error: true }
            : item,
        ));
      }
      return false;
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        busyRef.current = false;
        setBusy(false);
      }
    }
  }, [onAuthExpired, onSession]);

  const send = useCallback(async (message: string, token: string) => {
    const text = message.trim();
    if (!text || busyRef.current) return;
    setMessages((current) => [
      ...current.map((item) =>
        item.approval?.status === "pending"
          ? { ...item, approval: { ...item.approval, status: "superseded" as const } }
          : item,
      ),
      { id: makeId(), role: "user", text },
    ]);
    await run({ message: text, ...(sessionRef.current ? { sessionId: sessionRef.current } : {}) }, token);
  }, [run]);

  const confirm = useCallback(async (approval: Approval, token: string) => {
    if (!sessionRef.current || busyRef.current) return;
    setMessages((current) => [
      ...current,
      { id: makeId(), role: "user", text: approval.kind === "cancel"
        ? "Confirm cancellation request" : "Send " + (approval.kind === "book" ? "booking" : "reschedule") + " request to provider" },
    ]);
    await run({ sessionId: sessionRef.current, approval: { id: approval.id, confirm: true } }, token);
  }, [run]);

  return { messages, sessionId, busy, send, confirm, reset, openSession, forgetSession, clearAll, getSessionId };
}
