"use client";

import { FormEvent, useState } from "react";
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import HandymanRoundedIcon from "@mui/icons-material/HandymanRounded";
import type { ProviderBooking, ProviderRescheduleRequest, ProviderSlot, ServiceOffering } from "@/lib/provider";
import { formatMoney, formatTime } from "@/lib/provider";

export function ListingSetup({ saving, onCreate }: {
  saving: boolean;
  onCreate: (values: { serviceType: string; serviceArea: string; basePrice: number }) => Promise<void>;
}) {
  const [serviceType, setServiceType] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    void onCreate({ serviceType: serviceType.trim(), serviceArea: serviceArea.trim(), basePrice: Number(basePrice) }).catch(() => {});
  };
  return (
    <section className="provider-panel setup-panel">
      <span className="provider-icon"><HandymanRoundedIcon /></span>
      <h2>Let&apos;s set up your listing</h2>
      <p>Add your specialty, service area, and starting price. Then you can publish services and available times.</p>
      <Box component="form" onSubmit={submit} sx={{ display: "grid", gap: 2, maxWidth: 520, mt: 3 }}>
        <TextField required label="Your specialty" value={serviceType} onChange={(event) => setServiceType(event.target.value)} placeholder="e.g. Plumbing" />
        <TextField required label="Service area" value={serviceArea} onChange={(event) => setServiceArea(event.target.value)} placeholder="e.g. Indiranagar" />
        <TextField required label="Starting price (₹)" type="number" slotProps={{ htmlInput: { min: 0, step: 1 } }} value={basePrice} onChange={(event) => setBasePrice(event.target.value)} />
        <Button type="submit" variant="contained" disabled={saving} sx={{ width: "fit-content", borderRadius: "13px", textTransform: "none", fontWeight: 800, px: 3 }}>
          Create listing
        </Button>
      </Box>
    </section>
  );
}

export function BookingRequests({ bookings, services, onDecide }: {
  bookings: ProviderBooking[];
  services: ServiceOffering[];
  onDecide: (booking: ProviderBooking, decision: "accept" | "reject") => void;
}) {
  return (
    <section className="provider-panel">
      <div className="provider-section-head"><div><h2>Booking requests</h2><p>Review and respond before the hold expires.</p></div><Chip size="small" label={bookings.filter((item) => item.status === "held").length + " pending"} sx={{ bgcolor: "#e3f2e9", color: "#34846b", fontWeight: 800 }} /></div>
      {!bookings.length && <div className="provider-empty"><CalendarMonthRoundedIcon /><strong>No requests yet</strong><span>New customer bookings will appear here.</span></div>}
      <div className="provider-booking-list">
        {bookings.map((booking) => {
          const service = services.find((item) => item.id === booking.serviceId);
          const active = booking.status === "held";
          return (
            <article className="provider-booking" key={booking.id}>
              <div className="provider-booking-main">
                <span className="provider-booking-icon"><CalendarMonthRoundedIcon fontSize="small" /></span>
                <div>
                  <h3>{service?.name || "Service request"}</h3>
                  <p>{formatTime(booking.startsAt)} · {formatTime(booking.endsAt).split(", ").at(-1)}</p>
                  <small>Customer {booking.customerUserId.slice(0, 8)} · Request {booking.id.slice(0, 8)}</small>
                </div>
              </div>
              <div className="provider-booking-actions">
                <Chip size="small" label={active ? "Awaiting reply" : booking.status === "held" ? "Expired" : booking.status} sx={{ textTransform: "capitalize", fontWeight: 700, bgcolor: active ? "#fff1dc" : "#f0f4f1", color: active ? "#b17832" : "#6c8178" }} />
                {active && <div className="provider-action-buttons">
                  <Button variant="outlined" size="small" onClick={() => onDecide(booking, "reject")} sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700 }}>Decline</Button>
                  <Button variant="contained" size="small" onClick={() => onDecide(booking, "accept")} sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, boxShadow: "none" }}>Confirm booking</Button>
                </div>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function RescheduleRequests({ requests, services, onDecide }: {
  requests: ProviderRescheduleRequest[];
  services: ServiceOffering[];
  onDecide: (request: ProviderRescheduleRequest, decision: "accept" | "reject") => void;
}) {
  const pending = requests.filter((request) => request.status === "pending");
  return <section className="provider-panel">
    <div className="provider-section-head"><div><h2>Reschedule requests</h2><p>Only you can approve a new booking time.</p></div>
      <Chip size="small" label={pending.length + " pending"} sx={{ bgcolor: "#e3f2e9", color: "#34846b", fontWeight: 800 }} />
    </div>
    {!requests.length && <div className="provider-empty"><CalendarMonthRoundedIcon /><strong>No reschedule requests</strong><span>New time requests will appear here.</span></div>}
    <div className="provider-booking-list">
      {requests.map((request) => {
        const active = request.status === "pending";
        const service = services.find((item) => item.id === request.serviceId);
        return <article className="provider-booking" key={request.id}>
          <div className="provider-booking-main">
            <span className="provider-booking-icon"><CalendarMonthRoundedIcon fontSize="small" /></span>
            <div><h3>{service?.name || "Service"} · New time requested</h3>
              <p>{formatTime(request.oldStartsAt)} → {formatTime(request.startsAt)}</p>
              <small>Customer {request.customerUserId.slice(0, 8)} · Until {formatTime(request.expiresAt)}</small>
            </div>
          </div>
          <div className="provider-booking-actions">
            <Chip size="small" label={active ? "Awaiting reply" : request.status === "pending" ? "Expired" : request.status}
              sx={{ textTransform: "capitalize", fontWeight: 700, bgcolor: active ? "#fff1dc" : "#f0f4f1", color: active ? "#b17832" : "#6c8178" }} />
            {active && <div className="provider-action-buttons">
              <Button variant="outlined" size="small" onClick={() => onDecide(request, "reject")} sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700 }}>Decline</Button>
              <Button variant="contained" size="small" onClick={() => onDecide(request, "accept")} sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, boxShadow: "none" }}>Confirm new time</Button>
            </div>}
          </div>
        </article>;
      })}
    </div>
  </section>;
}

export function ServiceCatalog({ services, saving, error, onAdd }: {
  services: ServiceOffering[];
  saving: boolean;
  error: string;
  onAdd: (values: { name: string; description: string; price: number; durationMinutes: number }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("60");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await onAdd({ name: name.trim(), description: description.trim(), price: Number(price), durationMinutes: Number(duration) });
      setOpen(false);
      setName(""); setDescription(""); setPrice(""); setDuration("60");
    } catch { /* Error appears in the dashboard. */ }
  };
  return (
    <section className="provider-panel">
      <div className="provider-section-head"><div><h2>Your services</h2><p>What customers can book with you.</p></div>
        <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={() => setOpen(true)} sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 800, boxShadow: "none" }}>Add service</Button>
      </div>
      {!services.length && <div className="provider-empty"><HandymanRoundedIcon /><strong>No services yet</strong><span>Add your first service to make booking possible.</span></div>}
      <div className="provider-service-grid">
        {services.map((service) => <article className="provider-service-card" key={service.id}>
          <span className="provider-icon"><HandymanRoundedIcon fontSize="small" /></span>
          <h3>{service.name}</h3><p>{service.description || "Home service"}</p>
          <div><strong>{formatMoney(service.price)}</strong><span>{service.durationMinutes} min</span></div>
        </article>)}
      </div>
      <Dialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: "22px" } } }}>
        <Box component="form" onSubmit={submit}>
          <DialogTitle sx={{ fontWeight: 800 }}>Add a service</DialogTitle>
          <DialogContent sx={{ display: "grid", gap: 2, pt: "12px!important" }}>
            {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
            <TextField label="Service name" required value={name} onChange={(event) => setName(event.target.value)} />
            <TextField label="Description" multiline rows={2} value={description} onChange={(event) => setDescription(event.target.value)} />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField label="Price (₹)" type="number" required fullWidth slotProps={{ htmlInput: { min: 0, step: 1 } }} value={price} onChange={(event) => setPrice(event.target.value)} />
              <TextField label="Minutes" type="number" required fullWidth slotProps={{ htmlInput: { min: 15, max: 1440, step: 1 } }} value={duration} onChange={(event) => setDuration(event.target.value)} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}><Button onClick={() => setOpen(false)} disabled={saving}>Cancel</Button><Button type="submit" variant="contained" disabled={saving}>Save service</Button></DialogActions>
        </Box>
      </Dialog>
    </section>
  );
}

export function Availability({ slots, services, saving, error, onAdd }: {
  slots: ProviderSlot[];
  services: ServiceOffering[];
  saving: boolean;
  error: string;
  onAdd: (values: { serviceId: string; startsAt: string; endsAt: string }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [serviceId, setServiceId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [localError, setLocalError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const startsAt = new Date(start);
    const endsAt = new Date(end);
    if (!serviceId || !services.some((service) => service.id === serviceId)) {
      setLocalError("Choose a service for this availability window.");
      return;
    }
    if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) {
      setLocalError("Choose a valid end time after the start time.");
      return;
    }
    setLocalError("");
    try {
      await onAdd({ serviceId, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() });
      setOpen(false); setServiceId(""); setStart(""); setEnd("");
    } catch { /* Error appears in the dashboard. */ }
  };
  return (
    <section className="provider-panel">
      <div className="provider-section-head"><div><h2>Availability</h2><p>Choose a service and the times customers can book it.</p></div>
        <Button startIcon={<AddRoundedIcon />} variant="contained" disabled={!services.length} onClick={() => setOpen(true)} sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 800, boxShadow: "none" }}>Add time</Button>
      </div>
      {!slots.length && <div className="provider-empty"><CalendarMonthRoundedIcon /><strong>No time slots yet</strong><span>{services.length ? "Add an available window to start receiving bookings." : "Add a service before adding availability."}</span></div>}
      <div className="provider-slot-list">
        {slots.map((slot) => <div className="provider-slot" key={slot.id}>
          <span className="provider-booking-icon"><CalendarMonthRoundedIcon fontSize="small" /></span>
          <div><strong>{services.find((service) => service.id === slot.serviceId)?.name || "Shared availability"}</strong><span>{formatTime(slot.startsAt)} – {formatTime(slot.endsAt)}</span></div>
          <Chip size="small" label={slot.status} sx={{ ml: "auto", textTransform: "capitalize", bgcolor: "#e5f3ea", color: "#37856f" }} />
        </div>)}
      </div>
      <Dialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: "22px" } } }}>
        <Box component="form" onSubmit={submit}>
          <DialogTitle sx={{ fontWeight: 800 }}>Add availability</DialogTitle>
          <DialogContent sx={{ display: "grid", gap: 2, pt: "12px!important" }}>
            {(localError || error) && <Alert severity="error" sx={{ borderRadius: 2 }}>{localError || error}</Alert>}
            <TextField select label="Service" required value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
              {services.map((service) => <MenuItem key={service.id} value={service.id}>{service.name} · {service.durationMinutes} min</MenuItem>)}
            </TextField>
            <TextField label="Starts" type="datetime-local" required value={start} onChange={(event) => setStart(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Ends" type="datetime-local" required value={end} onChange={(event) => setEnd(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            <Typography sx={{ color: "#869990", fontSize: 11 }}>Times use your device&apos;s time zone. Each window can last up to 24 hours.</Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}><Button onClick={() => setOpen(false)} disabled={saving}>Cancel</Button><Button type="submit" variant="contained" disabled={saving}>Add time</Button></DialogActions>
        </Box>
      </Dialog>
    </section>
  );
}
