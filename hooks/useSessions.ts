"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteSession, listSessionMessages, listSessions, renameSession,
  sessionPageSize, type AgentSession,
} from "@/lib/sessions";

export function useSessions(token: string | null, onUnauthorized: () => void) {
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const [nextOffset, setNextOffset] = useState(0);
  const currentToken = useRef(token);
  currentToken.current = token;

  useEffect(() => {
    setSessions([]);
    setLoading(false);
    setLoadingMore(false);
    setHasMore(false);
    setNextOffset(0);
    setError("");
  }, [token]);

  const fail = useCallback((reason: unknown) => {
    const message = reason instanceof Error ? reason.message : "Could not load conversations.";
    if (/access token/i.test(message)) onUnauthorized();
    else setError(message);
    return reason;
  }, [onUnauthorized]);

  const refresh = useCallback(async () => {
    if (!token) return [];
    setLoading(true);
    try {
      const page = await listSessions(token);
      if (currentToken.current !== token) return [];
      setSessions(page);
      setHasMore(page.length === sessionPageSize);
      setNextOffset(page.length);
      setError("");
      return page;
    } catch (reason) {
      if (currentToken.current !== token) return [];
      throw fail(reason);
    } finally {
      if (currentToken.current === token) setLoading(false);
    }
  }, [token, fail]);

  const loadMore = useCallback(async () => {
    if (!token || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const page = await listSessions(token, nextOffset);
      if (currentToken.current !== token) return;
      setSessions((current) => [
        ...current,
        ...page.filter((item) => !current.some((existing) => existing.id === item.id)),
      ]);
      setHasMore(page.length === sessionPageSize);
      setNextOffset((current) => current + page.length);
      setError("");
    } catch (reason) {
      if (currentToken.current !== token) return;
      throw fail(reason);
    } finally {
      if (currentToken.current === token) setLoadingMore(false);
    }
  }, [token, nextOffset, loadingMore, hasMore, fail]);

  const loadMessages = useCallback(async (sessionId: string) => {
    if (!token) return [];
    try {
      const messages = await listSessionMessages(token, sessionId);
      if (currentToken.current === token) setError("");
      return messages;
    } catch (reason) {
      if (currentToken.current !== token) return [];
      throw fail(reason);
    }
  }, [token, fail]);

  const rename = useCallback(async (id: string, title: string) => {
    if (!token) return;
    try {
      const updated = await renameSession(token, id, title);
      if (currentToken.current !== token) return;
      setSessions((current) => [updated, ...current.filter((item) => item.id !== id)]);
      setError("");
    } catch (reason) {
      if (currentToken.current !== token) return;
      throw fail(reason);
    }
  }, [token, fail]);

  const remove = useCallback(async (id: string) => {
    if (!token) return;
    try {
      await deleteSession(token, id);
      if (currentToken.current !== token) return;
      setSessions((current) => current.filter((item) => item.id !== id));
      setError("");
    } catch (reason) {
      if (currentToken.current !== token) return;
      throw fail(reason);
    }
  }, [token, fail]);

  return { sessions, loading, loadingMore, hasMore, error, refresh, loadMore, loadMessages, rename, remove };
}
