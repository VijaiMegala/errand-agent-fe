# Homie frontend

A responsive MUI application for customers and service providers. Customers chat with the errand agent and explicitly confirm booking actions. Providers have a separate workspace for requests, services, and availability.

## Run locally

1. Start the backend API as described in [../backend/README.md](../backend/README.md), including its database and MCP service.
2. In this directory, run `npm install` and `npm run dev`.
3. Open http://localhost:3000 for customer chat or http://localhost:3000/provide for the provider workspace. Each screen offers the matching account registration flow.

The Next.js API route forwards login, registration, chat, provider, and notification requests to `BACKEND_URL` (default: `http://127.0.0.1:8000`). Set `BACKEND_URL` in `.env.local` when the backend runs elsewhere. The chat stream is forwarded without buffering.

Access tokens and their expiry are saved in browser local storage after login. A valid token is restored on reload and cleared on sign out or expiry. Tokens expire after 15 minutes, as defined by the backend. Customer conversations are listed in the sidebar. Opening one places its ID in the URL as `?sessionId=<uuid>`; loading that URL fetches that exact conversation. The root URL starts a new chat and gains a session ID after the backend creates it. You can switch, rename, or delete conversations in the sidebar. Booking actions always require confirmation from the proposal card. Pending approval cards cannot be restored after reload because the session message API returns only message text.

The notification bell is in the top right of both workspaces. It loads the latest 100 notifications, refreshes every 20 seconds while the tab is visible, and lets users mark items as read. Start the backend notification worker so booking events reach the inbox.

## Check

Run `npm run build` for a production build.
