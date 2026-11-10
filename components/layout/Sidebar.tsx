import { Avatar, Button, IconButton, Typography } from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import { SessionList, type SessionListProps } from "@/components/chat/SessionList";

type Props = {
  email?: string;
  sessionList: SessionListProps;
  onNewChat: () => void;
  onLogin: () => void;
  onLogout: () => void;
  mobile?: boolean;
};

export function Sidebar({ email, sessionList, onNewChat, onLogin, onLogout, mobile }: Props) {
  return (
    <aside className={mobile ? "sidebar mobile-sidebar" : "sidebar"}>
      <div className="brand"><span className="brand-mark"><AutoAwesomeRoundedIcon fontSize="small" /></span>homie<span style={{ color: "#91b7a9" }}>.</span></div>
      <div className="sidebar-section-label">YOUR SPACE</div>
      <nav className="sidebar-nav" aria-label="Chat navigation">
        <Button className={"sidebar-link" + (!sessionList.activeId ? " active" : "")} onClick={onNewChat} disabled={sessionList.busy} startIcon={<AddRoundedIcon />}>New conversation</Button>
        <Button className="sidebar-link" href="/provide" startIcon={<WorkOutlineRoundedIcon />}>Provider workspace</Button>
      </nav>
      {email && <SessionList {...sessionList} />}
      <div className="sidebar-tip">
        <span className="sidebar-tip-icon"><LightbulbOutlinedIcon fontSize="small" /></span>
        <Typography sx={{ fontSize: 12, fontWeight: 800, mb: .5 }}>A little help goes a long way</Typography>
        <Typography sx={{ fontSize: 11, lineHeight: 1.7, color: "#6e9286" }}>
          Tell Homie what you need, where you need it, and when works for you.
        </Typography>
      </div>
      <div className="sidebar-user">
        <Avatar sx={{ width: 34, height: 34, bgcolor: email ? "#c5e5d7" : "#dce8e1", color: "#39816f", fontSize: 12, fontWeight: 800 }}>
          {email ? email[0].toUpperCase() : "G"}
        </Avatar>
        <div className="sidebar-user-text">
          <strong>{email ? "Your account" : "Guest"}</strong>
          <span>{email || "Sign in to start chatting"}</span>
        </div>
        <IconButton aria-label={email ? "Sign out" : "Sign in"} onClick={email ? onLogout : onLogin} size="small" sx={{ color: "#63887b" }}>
          {email ? <LogoutRoundedIcon fontSize="small" /> : <LoginRoundedIcon fontSize="small" />}
        </IconButton>
      </div>
    </aside>
  );
}
