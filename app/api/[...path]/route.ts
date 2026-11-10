import type { NextRequest } from "next/server";

type Context = { params: Promise<{ path: string[] }> };

async function forward(request: NextRequest, context: Context) {
  const { path } = await context.params;
  const route = path.join("/");
  const uuid = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
  const allowed = {
    POST: [
      /^auth\/login$/, /^users$/, /^agent\/chat$/,
      new RegExp("^providers/" + uuid + "/(?:services|slots)$"),
    ],
    GET: [
      /^auth\/introspect$/, /^notifications$/,
      /^agent\/sessions$/,
      new RegExp("^agent/sessions/" + uuid + "/messages$"),
      new RegExp("^users/" + uuid + "$"),
      new RegExp("^providers/" + uuid + "/(?:services|slots|bookings)$"),
      new RegExp("^providers/" + uuid + "/reschedule-requests$"),
    ],
    PATCH: [
      new RegExp("^agent/sessions/" + uuid + "$"),
      new RegExp("^users/" + uuid + "$"),
      /^notifications\/[1-9]\d*\/read$/,
      new RegExp("^providers/" + uuid + "/bookings/" + uuid + "/(?:accept|reject)$"),
      new RegExp("^providers/" + uuid + "/reschedule-requests/" + uuid + "/(?:accept|reject)$"),
    ],
    DELETE: [new RegExp("^agent/sessions/" + uuid + "$")],
  };
  const method = request.method as keyof typeof allowed;
  if (!allowed[method]?.some((pattern) => pattern.test(route))) {
    return Response.json({ error: "Route not found" }, { status: 404 });
  }
  const base = process.env.BACKEND_URL || "http://127.0.0.1:8000";
  const url = new URL("/api/" + route, base);
  if (method === "GET" && (route === "agent/sessions" || route.endsWith("/messages"))) {
    url.search = request.nextUrl.search;
  }
  try {
    const body = method === "GET" || method === "DELETE" ? undefined : await request.text();
    const upstream = await fetch(url, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(request.headers.get("authorization")
          ? { Authorization: request.headers.get("authorization") as string }
          : {}),
      },
      body: body || undefined,
      cache: "no-store",
      signal: request.signal,
    });
    if (upstream.status === 204) {
      return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
    }
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/json",
        "Cache-Control": "no-store",
        ...(route === "agent/chat" ? { "X-Accel-Buffering": "no" } : {}),
      },
    });
  } catch {
    return Response.json(
      { error: "Cannot reach the backend. Check that the API is running." },
      { status: 502 },
    );
  }
}

export { forward as POST, forward as GET, forward as PATCH, forward as DELETE };
