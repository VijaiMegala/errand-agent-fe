import { KeyboardEvent } from "react";
import { IconButton } from "@mui/material";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";

export function Composer({ value, onChange, onSend, busy, disabled = false }: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  busy: boolean;
  disabled?: boolean;
}) {
  const keyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!busy && !disabled) onSend();
    }
  };
  return (
    <div className="composer-wrap">
      <div className="composer">
        <textarea id="chat-composer" rows={1} maxLength={8000} aria-label="Message Homie"
          placeholder={disabled ? "Loading conversation..." : "Ask me anything about your home..."} value={value}
          onChange={(event) => onChange(event.target.value)} onKeyDown={keyDown} />
        <IconButton aria-label={busy ? "Waiting for response" : "Send message"} disabled={busy || disabled || !value.trim()} onClick={onSend}
          sx={{ bgcolor: "#2e8e8e", color: "#fff", borderRadius: "14px", width: 38, height: 38, "&:hover": { bgcolor: "#207776" }, "&.Mui-disabled": { bgcolor: "#e8efeb", color: "#a2b2aa" } }}>
          {busy ? <StopRoundedIcon fontSize="small" /> : <ArrowUpwardRoundedIcon fontSize="small" />}
        </IconButton>
      </div>
      <div className="composer-caption">Press Enter to send · Shift + Enter for a new line</div>
    </div>
  );
}
