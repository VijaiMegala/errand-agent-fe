import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import PlumbingRoundedIcon from "@mui/icons-material/PlumbingRounded";
import CleaningServicesRoundedIcon from "@mui/icons-material/CleaningServicesRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";

const prompts = [
  { icon: <PlumbingRoundedIcon fontSize="small" />, title: "Find a plumber near me", prompt: "Find a plumber in my area this week." },
  { icon: <CleaningServicesRoundedIcon fontSize="small" />, title: "Book a home cleaning", prompt: "Help me book a home cleaning this week." },
  { icon: <CalendarMonthRoundedIcon fontSize="small" />, title: "Check my bookings", prompt: "Show me my upcoming bookings." },
];

export function Welcome({ onPrompt }: { onPrompt: (prompt: string) => void }) {
  return (
    <div className="empty-state">
      <div className="hero-art" aria-hidden="true">
        <span className="orb" />
        <span className="chat-dot one"><ChatBubbleRoundedIcon sx={{ fontSize: 31 }} /></span>
        <span className="chat-dot two"><BoltRoundedIcon fontSize="small" /></span>
        <span className="chat-dot three"><AutoAwesomeRoundedIcon sx={{ fontSize: 16 }} /></span>
      </div>
      <span className="eyebrow"><AutoAwesomeRoundedIcon sx={{ fontSize: 13 }} /> YOUR HOME, HANDLED</span>
      <h1>What can I help you <em>take care of?</em></h1>
      <p>Need a hand around the house? Tell me what is going on. I can find a local professional, explore available times, and help you book.</p>
      <div className="suggestions-label">NEED A PLACE TO START?</div>
      <div className="suggestion-grid">
        {prompts.map((item) => (
          <button className="suggestion-card" key={item.title} onClick={() => onPrompt(item.prompt)}>
            <span className="suggestion-icon">{item.icon}</span><span>{item.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
