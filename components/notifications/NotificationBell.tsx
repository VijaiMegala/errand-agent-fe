"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Box, Button, IconButton, Popover, Typography } from "@mui/material";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { apiRequest } from "@/lib/api";

type Notification = {
  id: number | string;
  bookingId: string;
  eventType: "booking_requested" | "booking_confirmed" | "booking_rejected" | "reschedule_requested" | "reschedule_confirmed" | "reschedule_rejected";
  createdAt: string;
  readAt: string | null;
};

const labels: Record<Notification["eventType"], { title: string; description: string }> = {
  booking_requested: { title: "New booking request", description: "A customer has requested a time." },
  booking_confirmed: { title: "Booking confirmed", description: "Your provider confirmed the booking." },
  booking_rejected: { title: "Booking declined", description: "Your provider declined the request." },
  reschedule_requested: { title: "New time requested", description: "A customer requested a different booking time." },
  reschedule_confirmed: { title: "New time confirmed", description: "Your provider approved the new booking time." },
  reschedule_rejected: { title: "New time declined", description: "Your provider declined the reschedule request." },
};

export function NotificationBell({ token, onUnauthorized }: {
  token: string;
  onUnauthorized: () => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiRequest<{ data: Notification[] }>("notifications", token);
      setItems(result.data);
      setError("");
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Could not load notifications.";
      if (/access token/i.test(message)) onUnauthorized();
      else setError(message);
    } finally {
      setLoading(false);
    }
  }, [token, onUnauthorized]);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => { if (!document.hidden) void refresh(); }, 20_000);
    const onFocus = () => { void refresh(); };
    window.addEventListener("focus", onFocus);
    return () => { window.clearInterval(interval); window.removeEventListener("focus", onFocus); };
  }, [refresh]);

  const markRead = async (notification: Notification) => {
    if (notification.readAt) return;
    try {
      const result = await apiRequest<{ data: Notification }>(
        "notifications/" + notification.id + "/read", token, { method: "PATCH" },
      );
      setItems((current) => current.map((item) =>
        String(item.id) === String(notification.id) ? result.data : item,
      ));
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Could not mark notification as read.";
      if (/access token/i.test(message)) onUnauthorized();
      else setError(message);
    }
  };

  const unread = items.filter((item) => !item.readAt).length;
  return (
    <>
      <IconButton aria-label={unread ? unread + " unread notifications" : "Notifications"}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ color: "#438579", bgcolor: "#f1f7f3", borderRadius: "12px", width: 40, height: 40 }}>
        <Badge badgeContent={unread} color="primary" max={99}><NotificationsNoneRoundedIcon fontSize="small" /></Badge>
      </IconButton>
      <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { width: { xs: "min(360px, 94vw)", sm: 370 }, mt: 1, borderRadius: "20px", boxShadow: "0 18px 48px #163d2d27" } } }}>
        <Box sx={{ p: 2.3, borderBottom: "1px solid #e8eeea", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 800 }}>Notifications</Typography>
            <Typography sx={{ fontSize: 11, color: "#91a09b" }}>{unread ? unread + " unread" : "All caught up"}</Typography>
          </Box>
          <IconButton aria-label="Refresh notifications" onClick={() => void refresh()} size="small" disabled={loading}><RefreshRoundedIcon fontSize="small" /></IconButton>
        </Box>
        {error && <Alert severity="error" sx={{ m: 1.5, borderRadius: 2, fontSize: 11 }}>{error}</Alert>}
        <Box sx={{ maxHeight: 380, overflowY: "auto" }}>
          {!items.length && !loading && <Typography sx={{ p: 3, color: "#879b93", fontSize: 12, textAlign: "center" }}>No notifications yet.</Typography>}
          {items.map((item) => (
            <Box key={item.id} sx={{ px: 2.3, py: 1.7, borderBottom: "1px solid #f0f3f0", bgcolor: item.readAt ? "#fff" : "#f2f9f5" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 800 }}>{labels[item.eventType]?.title || item.eventType}</Typography>
                {!item.readAt && <Box aria-label="Unread" sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#43a887", mt: .5, flex: "none" }} />}
              </Box>
              <Typography sx={{ fontSize: 11, color: "#7d9189", mt: .4 }}>{labels[item.eventType]?.description || "Booking update"}</Typography>
              <Typography sx={{ fontSize: 10, color: "#9caea5", mt: .8 }}>
                {new Date(item.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </Typography>
              {!item.readAt && <Button size="small" onClick={() => void markRead(item)} sx={{ p: 0, mt: .8, textTransform: "none", fontSize: 10, fontWeight: 800 }}>Mark as read</Button>}
            </Box>
          ))}
        </Box>
      </Popover>
    </>
  );
}
