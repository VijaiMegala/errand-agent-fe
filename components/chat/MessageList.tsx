import { useEffect, useRef } from "react";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import type { Approval, ChatMessage } from "@/lib/chat";
import { ApprovalCard } from "./ApprovalCard";
import { ChatMarkdown } from "./ChatMarkdown";

export function MessageList({ messages, busy, onConfirm }: {
  messages: ChatMessage[];
  busy: boolean;
  onConfirm: (approval: Approval) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages]);

  return (
    <div className="message-list" role="log" aria-live="polite" aria-relevant="additions text">
      {messages.map((message, index) => {
        const typing = busy && index === messages.length - 1 && message.role === "assistant" && !message.text && !message.approval;
        return (
          <div className={"message-row " + message.role} key={message.id}>
            <span className="message-avatar" aria-hidden="true">
              {message.role === "assistant" ? <AutoAwesomeRoundedIcon sx={{ fontSize: 17 }} /> : <PersonOutlineRoundedIcon sx={{ fontSize: 18 }} />}
            </span>
            <div className="message-body">
              <div className="message-meta">{message.role === "assistant" ? "Homie" : "You"}</div>
              {(message.text || typing) && <div className={"message-bubble" + (message.error ? " error" : "")}>
                {typing ? <span className="typing" aria-label="Homie is responding"><span /><span /><span /></span> :
                  message.role === "assistant" ? <ChatMarkdown text={message.text} /> : message.text}
              </div>}
              {message.approval && <ApprovalCard approval={message.approval} busy={busy} onConfirm={onConfirm} />}
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
