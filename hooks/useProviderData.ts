"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Identity } from "./useIdentity";
import type { ProviderBooking, ProviderProfile, ProviderRescheduleRequest, ProviderSlot, ServiceOffering } from "@/lib/provider";

type Data = {
  profile: ProviderProfile;
  bookings: ProviderBooking[];
  reschedules: ProviderRescheduleRequest[];
  services: ServiceOffering[];
  slots: ProviderSlot[];
};

export function useProviderData(identity: Identity | null, onUnauthorized: () => void) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const token = identity?.token;
  const userId = identity?.userId;
  const currentToken = useRef(token);
  currentToken.current = token;

  const refresh = useCallback(async () => {
    if (!token || !userId) return;
    setLoading(true);
    try {
      const { data: profile } = await apiRequest<{ data: ProviderProfile }>("users/" + userId, token);
      if (currentToken.current !== token) return;
      if (!profile.providerDetails) {
        setData({ profile, bookings: [], reschedules: [], services: [], slots: [] });
      } else {
        const providerId = profile.providerDetails.id;
        const [bookings, reschedules, services, slots] = await Promise.all([
          apiRequest<{ data: ProviderBooking[] }>("providers/" + providerId + "/bookings", token),
          apiRequest<{ data: ProviderRescheduleRequest[] }>("providers/" + providerId + "/reschedule-requests", token),
          apiRequest<{ data: ServiceOffering[] }>("providers/" + providerId + "/services", token),
          apiRequest<{ data: ProviderSlot[] }>("providers/" + providerId + "/slots", token),
        ]);
        if (currentToken.current !== token) return;
        setData({ profile, bookings: bookings.data, reschedules: reschedules.data, services: services.data, slots: slots.data });
      }
      if (currentToken.current === token) setError("");
    } catch (reason) {
      if (currentToken.current !== token) return;
      const message = reason instanceof Error ? reason.message : "Could not load provider data.";
      if (/access token/i.test(message)) onUnauthorized();
      else setError(message);
    } finally {
      if (currentToken.current === token) setLoading(false);
    }
  }, [token, userId, onUnauthorized]);

  useEffect(() => {
    if (!token || !userId) { setData(null); return; }
    setData(null);
    void refresh();
    const interval = window.setInterval(() => { if (!document.hidden) void refresh(); }, 30_000);
    return () => window.clearInterval(interval);
  }, [token, userId, refresh]);

  return { data, loading, error, setError, refresh };
}
