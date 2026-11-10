export const AUTH_STORAGE_KEY = "homie.auth.v1";

export type StoredIdentity = {
  token: string;
  email: string;
  expiresAt: number;
  userId?: string;
  role?: "customer" | "service_provider";
};

export function readStoredIdentity(): StoredIdentity | null {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (
      value &&
      typeof value === "object" &&
      "token" in value && typeof value.token === "string" && value.token.length > 0 &&
      "email" in value && typeof value.email === "string" &&
      "expiresAt" in value && typeof value.expiresAt === "number" &&
      Number.isFinite(value.expiresAt) && value.expiresAt > Date.now()
    ) {
      return value as StoredIdentity;
    }
  } catch {
    // Storage can be unavailable or contain invalid data.
  }
  clearStoredIdentity();
  return null;
}

export function saveStoredIdentity(identity: StoredIdentity) {
  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(identity));
  } catch {
    // The current tab can still use the in-memory session.
  }
}

export function clearStoredIdentity() {
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Storage may be disabled by the browser.
  }
}
