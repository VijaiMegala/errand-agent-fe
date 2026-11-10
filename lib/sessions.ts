import { apiRequest } from "./api";
import type { ChatMessage } from "./chat";

export type AgentSession = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type StoredMessage = {
  seq: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

const pageSize = 50;
const messagePageSize = 100;

export async function listSessions(token: string, offset = 0) {
  return apiRequest<{ data: AgentSession[] }>(
    "agent/sessions?limit=" + pageSize + "&offset=" + offset, token,
  ).then((result) => result.data);
}

export async function listSessionMessages(token: string, sessionId: string): Promise<ChatMessage[]> {
  const messages: ChatMessage[] = [];
  let offset = 0;
  while (true) {
    const result = await apiRequest<{ data: StoredMessage[] }>(
      "agent/sessions/" + sessionId + "/messages?limit=" + messagePageSize + "&offset=" + offset,
      token,
    );
    messages.push(...result.data.map((item) => ({
      id: sessionId + ":" + item.seq,
      role: item.role,
      text: item.content,
    })));
    if (result.data.length < messagePageSize) break;
    offset += result.data.length;
  }
  return messages;
}

export async function renameSession(token: string, sessionId: string, title: string) {
  const result = await apiRequest<{ data: AgentSession }>(
    "agent/sessions/" + sessionId, token, { method: "PATCH", body: { title } },
  );
  return result.data;
}

export async function deleteSession(token: string, sessionId: string) {
  await apiRequest<void>("agent/sessions/" + sessionId, token, { method: "DELETE" });
}

export { pageSize as sessionPageSize };
