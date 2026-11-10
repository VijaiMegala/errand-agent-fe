"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, CircularProgress, Drawer, IconButton, ThemeProvider } from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { Sidebar } from "@/components/layout/Sidebar";
import { RightRail } from "@/components/layout/RightRail";
import { useChat } from "@/hooks/useChat";
import { useIdentity } from "@/hooks/useIdentity";
import { useSessions } from "@/hooks/useSessions";
import type { Approval } from "@/lib/chat";
import { theme } from "@/lib/theme";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Welcome } from "./Welcome";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";

const sessionIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ChatWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedSessionId = searchParams.get("sessionId");
  const auth = useIdentity();
  const { identity, authOpen, setAuthOpen, expire } = auth;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const onSession = useCallback((id: string) => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("sessionId") === id) return;
    params.set("sessionId", id);
    router.replace("/?" + params.toString());
  }, [router]);
  const chat = useChat(expire, onSession);
  const token = identity?.role === "customer" ? identity.token : null;
  const sessionStore = useSessions(token, expire);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const selectionRun = useRef(0);
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    if (token) void sessionStore.refresh().catch(() => {});
  }, [token, sessionStore.refresh]);

  useEffect(() => {
    const run = ++selectionRun.current;
    setSessionError("");
    if (!requestedSessionId) {
      chat.reset();
      setSessionLoading(false);
      return;
    }
    if (!sessionIdPattern.test(requestedSessionId)) {
      chat.reset();
      setSessionLoading(false);
      setSessionError("This conversation link is invalid.");
      return;
    }
    if (!token) {
      chat.reset();
      setSessionLoading(false);
      return;
    }
    if (chat.getSessionId() === requestedSessionId) {
      setSessionLoading(false);
      return;
    }
    chat.reset();
    setSessionLoading(true);
    void sessionStore.loadMessages(requestedSessionId).then((history) => {
      if (run === selectionRun.current) chat.openSession(requestedSessionId, history);
    }).catch((reason) => {
      if (run === selectionRun.current) {
        setSessionError(reason instanceof Error ? reason.message : "Could not load this conversation.");
      }
    }).finally(() => {
      if (run === selectionRun.current) setSessionLoading(false);
    });
    return () => { selectionRun.current++; };
  }, [token, requestedSessionId, sessionStore.loadMessages, chat.reset, chat.openSession, chat.getSessionId]);

  useEffect(() => {
    const nextId = identity?.userId || null;
    if (previousUserId.current && previousUserId.current !== nextId) chat.clearAll();
    previousUserId.current = nextId;
  }, [identity?.userId, chat.clearAll]);

  useEffect(() => {
    if (identity?.role === "service_provider") router.replace("/provide");
  }, [identity, router]);

  const urlForSession = (id?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("sessionId", id);
    else params.delete("sessionId");
    return params.size ? "/?" + params.toString() : "/";
  };

  const sendText = (text: string) => {
    if (!text.trim() || chat.busy || sessionLoading || sessionError) return;
    if (!identity || identity.expiresAt <= Date.now()) {
      setDraft(text);
      if (identity) expire();
      else setAuthOpen(true);
      return;
    }
    setDraft("");
    void chat.send(text, identity.token).then(async () => {
      await sessionStore.refresh();
    }).catch(() => {});
  };

  const confirm = (approval: Approval) => {
    if (approval.status !== "pending" || new Date(approval.expiresAt).getTime() <= Date.now()) return;
    if (!identity || identity.expiresAt <= Date.now()) {
      if (identity) expire();
      else setAuthOpen(true);
      return;
    }
    void chat.confirm(approval, identity.token).then(() => sessionStore.refresh()).catch(() => {});
  };

  const newChat = () => {
    if (chat.busy) return;
    selectionRun.current++;
    setSessionLoading(false);
    setSessionError("");
    chat.reset();
    setDraft("");
    setMobileOpen(false);
    router.push(urlForSession());
  };
  const logout = () => {
    auth.logout();
    chat.clearAll();
    setMobileOpen(false);
  };
  const handleLogin = async (token: string, email: string, expiresIn: number) => {
    const next = await auth.loginWithToken(token, email, expiresIn);
    if (next.role === "service_provider") router.replace("/provide");
  };
  const selectSession = async (id: string) => {
    if (chat.busy) return;
    setMobileOpen(false);
    if (requestedSessionId !== id) router.push(urlForSession(id));
  };
  const deleteSession = async (id: string) => {
    await sessionStore.remove(id);
    chat.forgetSession(id);
    if (requestedSessionId === id) {
      chat.reset();
      router.replace(urlForSession());
    }
  };
  const sessionList = {
    sessions: sessionStore.sessions,
    activeId: requestedSessionId && sessionIdPattern.test(requestedSessionId) ? requestedSessionId : undefined,
    busy: chat.busy,
    loading: sessionStore.loading,
    loadingMore: sessionStore.loadingMore,
    hasMore: sessionStore.hasMore,
    error: sessionStore.error,
    onSelect: selectSession,
    onRename: sessionStore.rename,
    onDelete: deleteSession,
    onLoadMore: sessionStore.loadMore,
  };
  const sidebar = <Sidebar email={identity?.email} sessionList={sessionList}
    onNewChat={newChat} onLogin={() => setAuthOpen(true)} onLogout={logout} />;

  return (
    <ThemeProvider theme={theme}>
      <div className="workspace">
        {sidebar}
        <main className="main-shell">
          <header className="topbar">
            <div className="topbar-title">
              <IconButton className="mobile-menu" aria-label="Open menu" onClick={() => setMobileOpen(true)} size="small"><MenuRoundedIcon /></IconButton>
              <span className="agent-avatar"><AutoAwesomeRoundedIcon fontSize="small" /></span>
              <span className="topbar-copy"><strong>{sessionStore.sessions.find((item) => item.id === requestedSessionId)?.title || "Homie Assistant"}</strong><span>Your everyday home helper</span></span>
            </div>
            <div className="topbar-actions">
              <span className="online-pill">Here to help</span>
              {identity?.role === "customer" && <NotificationBell key={identity.token} token={identity.token} onUnauthorized={expire} />}
              {chat.messages.length > 0
                ? <IconButton aria-label="New conversation" onClick={newChat} sx={{ bgcolor: "#f2f7f3", borderRadius: "12px", color: "#46867b" }}><AddRoundedIcon /></IconButton>
                : !identity && <Button variant="outlined" size="small" onClick={() => setAuthOpen(true)} sx={{ textTransform: "none", borderRadius: "12px", fontWeight: 800 }}>Sign in</Button>}
            </div>
          </header>
          <div className="content-grid">
            <div className="chat-column">
              <div className="chat-scroll">
                {sessionLoading ? <div className="chat-loading"><CircularProgress size={25} /><span>Loading conversation...</span></div> :
                sessionError ? <div className="chat-loading"><Alert severity="error" sx={{ borderRadius: "14px" }}>{sessionError}</Alert></div> :
                chat.messages.length === 0
                  ? <Welcome onPrompt={sendText} />
                  : <MessageList messages={chat.messages} busy={chat.busy} onConfirm={confirm} />}
              </div>
              <Composer value={draft} onChange={setDraft} onSend={() => sendText(draft)} busy={chat.busy} disabled={sessionLoading || Boolean(sessionError) || Boolean(requestedSessionId && !token)} />
            </div>
            <RightRail />
          </div>
        </main>
      </div>
      <Drawer anchor="left" open={mobileOpen} onClose={() => setMobileOpen(false)}
        slotProps={{ paper: { sx: { width: 270, background: "#e9f1ed" } } }}>
        <Sidebar mobile email={identity?.email} sessionList={sessionList}
          onNewChat={newChat} onLogin={() => { setAuthOpen(true); setMobileOpen(false); }}
          onLogout={logout} />
      </Drawer>
      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)}
        onSuccess={handleLogin} />
    </ThemeProvider>
  );
}
