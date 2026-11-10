"use client";

import { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Menu, MenuItem, TextField, Typography } from "@mui/material";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import type { AgentSession } from "@/lib/sessions";

export type SessionListProps = {
  sessions: AgentSession[];
  activeId?: string;
  busy: boolean;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string;
  onSelect: (id: string) => Promise<void>;
  onRename: (id: string, title: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onLoadMore: () => Promise<void>;
};

export function SessionList(props: SessionListProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [target, setTarget] = useState<AgentSession | null>(null);
  const [dialog, setDialog] = useState<"rename" | "delete" | null>(null);
  const [title, setTitle] = useState("");
  const [working, setWorking] = useState(false);
  const [actionError, setActionError] = useState("");

  const openAction = (action: "rename" | "delete") => {
    setAnchor(null);
    setTitle(target?.title || "");
    setActionError("");
    setDialog(action);
  };
  const submit = async () => {
    if (!target || working) return;
    setWorking(true);
    setActionError("");
    try {
      if (dialog === "rename") await props.onRename(target.id, title.trim());
      if (dialog === "delete") await props.onDelete(target.id);
      setDialog(null);
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Could not update the conversation.");
    } finally {
      setWorking(false);
    }
  };

  return <>
    <div className="sidebar-section-label">CONVERSATIONS</div>
    <div className="sidebar-session-list">
      {props.loading && !props.sessions.length && <Typography sx={{ px: 1.5, fontSize: 11, color: "#8ea49a" }}>Loading conversations...</Typography>}
      {!props.loading && !props.sessions.length && <Typography sx={{ px: 1.5, fontSize: 11, color: "#8ea49a" }}>Your chats will appear here.</Typography>}
      {props.sessions.map((session) => <div className={"sidebar-session" + (props.activeId === session.id ? " selected" : "")} key={session.id}>
        <button type="button" disabled={props.busy} className="sidebar-session-open" onClick={() => void props.onSelect(session.id)}
          aria-current={props.activeId === session.id ? "page" : undefined} title={session.title}>
          <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 17, flex: "none" }} />
          <span>{session.title || "Untitled conversation"}</span>
        </button>
        <IconButton size="small" aria-label={"Options for " + session.title} disabled={props.busy}
          onClick={(event) => { setTarget(session); setAnchor(event.currentTarget); }} sx={{ color: "#739087", flex: "none", p: .4 }}>
          <MoreHorizRoundedIcon fontSize="small" />
        </IconButton>
      </div>)}
      {props.hasMore && <Button size="small" disabled={props.loading || props.loadingMore || props.busy} onClick={() => void props.onLoadMore().catch(() => {})}
        sx={{ mt: 1, ml: 1, textTransform: "none", fontSize: 11, fontWeight: 800 }}> {props.loadingMore ? "Loading..." : "Load more"}</Button>}
      {props.error && <Typography role="alert" sx={{ px: 1.5, mt: 1, color: "#a94945", fontSize: 10 }}>{props.error}</Typography>}
    </div>
    <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} slotProps={{ paper: { sx: { borderRadius: "12px" } } }}>
      <MenuItem onClick={() => openAction("rename")} sx={{ fontSize: 12 }}>Rename</MenuItem>
      <MenuItem onClick={() => openAction("delete")} sx={{ fontSize: 12, color: "#b74b45" }}>Delete</MenuItem>
    </Menu>
    <Dialog open={Boolean(dialog)} onClose={() => !working && setDialog(null)} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: "20px" } } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>{dialog === "rename" ? "Rename conversation" : "Delete conversation?"}</DialogTitle>
      <DialogContent>
        {dialog === "rename" ? <TextField autoFocus fullWidth label="Title" value={title} onChange={(event) => setTitle(event.target.value)}
          slotProps={{ htmlInput: { maxLength: 120 } }} sx={{ mt: 1 }} /> :
          <Typography sx={{ color: "#788d83", fontSize: 13, lineHeight: 1.6 }}>
            This removes the conversation and its pending approvals. Existing bookings stay in your account.
          </Typography>}
        {actionError && <Typography role="alert" sx={{ mt: 1.5, color: "#b74b45", fontSize: 12 }}>{actionError}</Typography>}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={() => setDialog(null)} disabled={working}>Cancel</Button>
        <Button variant="contained" color={dialog === "delete" ? "error" : "primary"} disabled={working || (dialog === "rename" && !title.trim())} onClick={() => void submit()}>
          {dialog === "rename" ? "Save title" : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  </>;
}
