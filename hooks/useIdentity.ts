"use client";

import { useCallback, useEffect, useState } from "react";
import { introspect } from "@/lib/api";
import {
  AUTH_STORAGE_KEY, clearStoredIdentity, readStoredIdentity,
  saveStoredIdentity, type StoredIdentity,
} from "@/lib/authStorage";

export type Identity = StoredIdentity & {
  userId: string;
  role: "customer" | "service_provider";
};

function hasRole(value: StoredIdentity): value is Identity {
  return typeof value.userId === "string" &&
    (value.role === "customer" || value.role === "service_provider");
}

export function useIdentity() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [ready, setReady] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const expire = useCallback(() => {
    clearStoredIdentity();
    setIdentity(null);
    setAuthOpen(true);
  }, []);
  const logout = useCallback(() => {
    clearStoredIdentity();
    setIdentity(null);
  }, []);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      const saved = readStoredIdentity();
      if (!saved) {
        if (active) { setIdentity(null); setReady(true); }
        return;
      }
      if (hasRole(saved)) {
        if (active) { setIdentity(saved); setReady(true); }
        return;
      }
      try {
        const account = await introspect(saved.token);
        if (account.role !== "customer" && account.role !== "service_provider") throw new Error("Unsupported account role");
        const next: Identity = { ...saved, userId: account.userId, role: account.role };
        saveStoredIdentity(next);
        if (active) setIdentity(next);
      } catch {
        clearStoredIdentity();
        if (active) setIdentity(null);
      } finally {
        if (active) setReady(true);
      }
    };
    void restore();
    const sync = (event: StorageEvent) => {
      if (event.key !== AUTH_STORAGE_KEY) return;
      const saved = readStoredIdentity();
      if (saved && hasRole(saved)) setIdentity(saved);
      else if (!saved) setIdentity(null);
      else void restore();
    };
    window.addEventListener("storage", sync);
    return () => { active = false; window.removeEventListener("storage", sync); };
  }, []);

  useEffect(() => {
    if (!identity) return;
    const timeout = window.setTimeout(expire, Math.max(0, identity.expiresAt - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [identity, expire]);

  const loginWithToken = async (token: string, email: string, expiresIn: number) => {
    const account = await introspect(token);
    if (account.role !== "customer" && account.role !== "service_provider") {
      throw new Error("This account does not have a customer or provider workspace.");
    }
    const next: Identity = {
      token, email, expiresAt: Date.now() + expiresIn * 1000,
      userId: account.userId, role: account.role,
    };
    saveStoredIdentity(next);
    setIdentity(next);
    return next;
  };

  return { identity, ready, authOpen, setAuthOpen, expire, logout, loginWithToken };
}
