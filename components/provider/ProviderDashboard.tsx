"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Avatar, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Tab, Tabs, ThemeProvider, Typography } from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import HandymanRoundedIcon from "@mui/icons-material/HandymanRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useIdentity } from "@/hooks/useIdentity";
import { useProviderData } from "@/hooks/useProviderData";
import { apiRequest } from "@/lib/api";
import type { ProviderBooking, ProviderRescheduleRequest } from "@/lib/provider";
import { formatTime } from "@/lib/provider";
import { theme } from "@/lib/theme";
import { Availability, BookingRequests, ListingSetup, RescheduleRequests, ServiceCatalog } from "./ProviderSections";

type Section = "overview" | "requests" | "services" | "availability";

export function ProviderDashboard() {
  const router = useRouter();
  const auth = useIdentity();
  const { identity, ready, authOpen, setAuthOpen, expire } = auth;
  const providerIdentity = identity?.role === "service_provider" ? identity : null;
  const workspace = useProviderData(providerIdentity, expire);
  const { data, loading, error, setError, refresh } = workspace;
  const [section, setSection] = useState<Section>("overview");
  const [saving, setSaving] = useState(false);
  const [decision, setDecision] = useState<{ booking: ProviderBooking; action: "accept" | "reject" } | null>(null);
  const [rescheduleDecision, setRescheduleDecision] = useState<{ request: ProviderRescheduleRequest; action: "accept" | "reject" } | null>(null);

  useEffect(() => {
    if (identity?.role === "customer") router.replace("/");
  }, [identity, router]);

  const mutate = async (path: string, method: "POST" | "PATCH", body?: unknown) => {
    if (!providerIdentity) return;
    setSaving(true);
    setError("");
    try {
      await apiRequest(path, providerIdentity.token, { method, body });
      await refresh();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "The request failed.";
      setError(message);
      if (/access token/i.test(message)) expire();
      throw reason;
    } finally {
      setSaving(false);
    }
  };

  const providerId = data?.profile.providerDetails?.id;
  const addListing = (values: { serviceType: string; serviceArea: string; basePrice: number }) =>
    mutate("users/" + providerIdentity?.userId, "PATCH", { providerDetails: values });
  const addService = (values: { name: string; description: string; price: number; durationMinutes: number }) =>
    mutate("providers/" + providerId + "/services", "POST", values);
  const addSlot = (values: { serviceId: string; startsAt: string; endsAt: string }) =>
    mutate("providers/" + providerId + "/slots", "POST", values);
  const decide = async () => {
    if (!decision || !providerId) return;
    try {
      await mutate("providers/" + providerId + "/bookings/" + decision.booking.id + "/" + decision.action, "PATCH");
      setDecision(null);
    } catch { /* Error appears above the workspace. */ }
  };

  const decideReschedule = async () => {
    if (!rescheduleDecision || !providerId) return;
    try {
      await mutate("providers/" + providerId + "/reschedule-requests/" + rescheduleDecision.request.id + "/" + rescheduleDecision.action, "PATCH");
      setRescheduleDecision(null);
    } catch { /* Error appears above the workspace. */ }
  };

  if (!ready || (identity?.role === "service_provider" && !data && loading)) {
    return <ThemeProvider theme={theme}><div className="provider-loading"><CircularProgress size={30} /></div></ThemeProvider>;
  }

  if (!identity || identity.role !== "service_provider") {
    return <ThemeProvider theme={theme}>
      <div className="provider-gate">
        <span className="brand-mark"><AutoAwesomeRoundedIcon fontSize="small" /></span>
        <span className="provider-kicker">HOMIE FOR PROFESSIONALS</span>
        <h1>A better way to run your day.</h1>
        <p>Manage requests, publish your services, and keep your schedule in one calm place.</p>
        <Button variant="contained" onClick={() => setAuthOpen(true)} sx={{ mt: 2, borderRadius: "13px", textTransform: "none", fontWeight: 800, px: 3 }}>Sign in as a provider</Button>
        <Button href="/" sx={{ mt: 1, textTransform: "none" }}>Go to customer chat</Button>
      </div>
      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} registrationRole="service_provider"
        onSuccess={async (token, email, expiresIn) => {
          const next = await auth.loginWithToken(token, email, expiresIn);
          if (next.role !== "service_provider") router.replace("/");
        }} />
    </ThemeProvider>;
  }

  const pending = data?.bookings.filter((item) => item.status === "held") || [];
  const confirmed = data?.bookings.filter((item) => item.status === "confirmed" && new Date(item.startsAt).getTime() >= Date.now()) || [];

  return <ThemeProvider theme={theme}>
    <div className="provider-shell">
      <header className="provider-header">
        <div className="provider-brand"><span className="brand-mark"><AutoAwesomeRoundedIcon fontSize="small" /></span><strong>homie<span>.</span></strong><small>PRO</small></div>
        <div className="provider-header-actions">
          <Chip size="small" label="Provider workspace" sx={{ display: { xs: "none", sm: "flex" }, bgcolor: "#e4f2ea", color: "#3b8575", fontWeight: 800 }} />
          <NotificationBell key={identity.token} token={identity.token} onUnauthorized={expire} />
          <Avatar sx={{ width: 34, height: 34, bgcolor: "#c7e8d8", color: "#277e6e", fontWeight: 800, fontSize: 13 }}>{identity.email[0]?.toUpperCase()}</Avatar>
          <IconButton aria-label="Sign out" onClick={() => { auth.logout(); router.replace("/provide"); }} size="small" sx={{ color: "#719389" }}><LogoutRoundedIcon fontSize="small" /></IconButton>
        </div>
      </header>
      <div className="provider-content">
        <div className="provider-intro">
          <div><span className="provider-kicker">YOUR WORKSPACE</span><h1>Good to see you, {data?.profile.fullName?.split(" ")[0] || "partner"}.</h1>
            <p>{data?.profile.providerDetails ? data.profile.providerDetails.serviceType + " · " + data.profile.providerDetails.serviceArea : "Set up your listing to start receiving requests."}</p></div>
          <Button startIcon={<RefreshRoundedIcon />} onClick={() => void refresh()} disabled={loading} variant="outlined" sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 800, alignSelf: "flex-start" }}>Refresh</Button>
        </div>
        {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2.5, borderRadius: "14px" }}>{error}</Alert>}
        {!data ? <div className="provider-panel"><p>Could not load your workspace. Use Refresh to try again.</p></div> :
          !data.profile.providerDetails ? <ListingSetup saving={saving} onCreate={addListing} /> :
          <>
            <div className="provider-stats">
              <div><span className="provider-stat-icon amber"><PendingActionsRoundedIcon /></span><small>Needs your reply</small><strong>{pending.length + (data?.reschedules.filter((item) => item.status === "pending").length || 0)}</strong></div>
              <div><span className="provider-stat-icon green"><CalendarMonthRoundedIcon /></span><small>Upcoming bookings</small><strong>{confirmed.length}</strong></div>
              <div><span className="provider-stat-icon blue"><HandymanRoundedIcon /></span><small>Active services</small><strong>{data.services.length}</strong></div>
            </div>
            <Box sx={{ borderBottom: "1px solid #e6ece9", mb: 3, overflowX: "auto" }}>
              <Tabs value={section} onChange={(_, value: Section) => setSection(value)} variant="scrollable" scrollButtons={false}
                sx={{ minHeight: 48, "& .MuiTab-root": { textTransform: "none", fontWeight: 800, fontSize: 12, minHeight: 48 } }}>
                <Tab value="overview" label="Overview" /><Tab value="requests" label="Requests" /><Tab value="services" label="Services" /><Tab value="availability" label="Availability" />
              </Tabs>
            </Box>
            {section === "overview" && <>
              <div className="provider-overview-note"><span className="provider-icon"><AutoAwesomeRoundedIcon fontSize="small" /></span><div><strong>You&apos;re ready for what&apos;s next.</strong><p>Keep your services and available hours up to date so customers can find a time that works.</p></div></div>
              <BookingRequests bookings={pending.slice(0, 3)} services={data.services} onDecide={(booking, action) => setDecision({ booking, action })} />
              <RescheduleRequests requests={data.reschedules.filter((item) => item.status === "pending").slice(0, 3)} services={data.services} onDecide={(request, action) => setRescheduleDecision({ request, action })} />
            </>}
            {section === "requests" && <>
              <BookingRequests bookings={data.bookings} services={data.services} onDecide={(booking, action) => setDecision({ booking, action })} />
              <RescheduleRequests requests={data.reschedules} services={data.services} onDecide={(request, action) => setRescheduleDecision({ request, action })} />
            </>}
            {section === "services" && <ServiceCatalog services={data.services} saving={saving} error={error} onAdd={addService} />}
            {section === "availability" && <Availability slots={data.slots} services={data.services} saving={saving} error={error} onAdd={addSlot} />}
          </>
        }
      </div>
    </div>
    <Dialog open={Boolean(decision)} onClose={() => !saving && setDecision(null)} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: "22px" } } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>{decision?.action === "accept" ? "Confirm this booking request?" : "Decline this request?"}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        <Typography sx={{ fontSize: 13, color: "#73877e", lineHeight: 1.7 }}>
          {decision && (data?.services.find((item) => item.id === decision.booking.serviceId)?.name || "Service")} on {decision && formatTime(decision.booking.startsAt)}.
        </Typography>
        <Typography sx={{ fontSize: 11, color: "#9caaa4", mt: 1 }}>This decision will notify the customer.</Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={() => setDecision(null)} disabled={saving}>Keep pending</Button>
        <Button onClick={() => void decide()} disabled={saving} variant="contained" color={decision?.action === "reject" ? "error" : "primary"}>{decision?.action === "accept" ? "Confirm booking" : "Decline booking"}</Button>
      </DialogActions>
    </Dialog>
    <Dialog open={Boolean(rescheduleDecision)} onClose={() => !saving && setRescheduleDecision(null)} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: "22px" } } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>{rescheduleDecision?.action === "accept" ? "Confirm the new booking time?" : "Decline the new time?"}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography sx={{ fontSize: 13, color: "#73877e" }}>
          {rescheduleDecision && formatTime(rescheduleDecision.request.oldStartsAt)} → {rescheduleDecision && formatTime(rescheduleDecision.request.startsAt)}.
        </Typography>
        <Typography sx={{ fontSize: 11, color: "#9caaa4", mt: 1 }}>The customer will be notified of your decision.</Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={() => setRescheduleDecision(null)} disabled={saving}>Keep pending</Button>
        <Button onClick={() => void decideReschedule()} disabled={saving} variant="contained" color={rescheduleDecision?.action === "reject" ? "error" : "primary"}>{rescheduleDecision?.action === "accept" ? "Confirm new time" : "Decline request"}</Button>
      </DialogActions>
    </Dialog>
  </ThemeProvider>;
}
