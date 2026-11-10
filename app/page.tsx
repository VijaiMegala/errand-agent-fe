import { Suspense } from "react";
import { ChatWorkspace } from "@/components/chat/ChatWorkspace";

export default function Home() {
  return <Suspense fallback={<div className="chat-loading">Loading chat...</div>}><ChatWorkspace /></Suspense>;
}
