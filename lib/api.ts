import type { ChatEvent, ChatPayload } from "./chat";

async function readError(response: Response): Promise<Error> {
  const body = await response.json().catch(() => null);
  return new Error(body?.error || "Request failed. Please try again.");
}

export async function apiRequest<T>(
  path: string,
  token: string,
  options: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown } = {},
): Promise<T> {
  const response = await fetch("/api/" + path, {
    method: options.method || "GET",
    headers: {
      Authorization: "Bearer " + token,
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });
  if (!response.ok) throw await readError(response);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export type AuthRole = "customer" | "service_provider" | "admin";
export async function introspect(token: string) {
  return apiRequest<{ active: true; userId: string; role: AuthRole }>("auth/introspect", token);
}

export async function login(email: string, password: string) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw await readError(response);
  return response.json() as Promise<{ accessToken: string; expiresIn: number }>;
}

export async function register(fullName: string, email: string, password: string, role: "customer" | "service_provider" = "customer") {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, fullName, email, password }),
  });
  if (!response.ok) throw await readError(response);
}

export async function streamChat(
  payload: ChatPayload,
  accessToken: string,
  onEvent: (event: ChatEvent) => void,
  signal?: AbortSignal,
) {
  const response = await fetch("/api/agent/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    },
    body: JSON.stringify(payload),
    signal,
  });
  if (!response.ok) throw await readError(response);
  if (!response.body) throw new Error("The response stream is unavailable.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let done = false;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const event = JSON.parse(line) as ChatEvent;
        if (event.type === "error") throw new Error(event.error);
        if (event.type === "done") done = true;
        onEvent(event);
      }
    }
    buffer += decoder.decode();
    if (buffer.trim()) {
      const event = JSON.parse(buffer) as ChatEvent;
      if (event.type === "error") throw new Error(event.error);
      if (event.type === "done") done = true;
      onEvent(event);
    }
    if (!done) throw new Error("The connection ended before the response completed.");
  } finally {
    reader.releaseLock();
  }
}
