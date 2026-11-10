import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";

export function RightRail() {
  return (
    <aside className="right-rail" aria-label="How Homie works">
      <h2 className="rail-heading">A little extra help</h2>
      <div className="rail-card feature">
        <span className="feature-badge"><AutoAwesomeRoundedIcon fontSize="small" /></span>
        <h3>Good things start at home.</h3>
        <p>From finding a pro to finding a time, just say what is on your mind.</p>
      </div>
      <div className="rail-card">
        <h3 style={{ marginTop: 0 }}>How it works</h3>
        <p>Simple steps to get it sorted.</p>
        <div className="rail-list">
          <div className="rail-step"><span className="rail-number">1</span><div><strong>Tell us what you need</strong><span>Describe the job and your location.</span></div></div>
          <div className="rail-step"><span className="rail-number">2</span><div><strong>Explore your options</strong><span>Compare available professionals and times.</span></div></div>
          <div className="rail-step"><span className="rail-number">3</span><div><strong>Confirm with confidence</strong><span>Review every detail before booking.</span></div></div>
        </div>
      </div>
      <div className="rail-note">Your booking, cancellation, or reschedule only happens after you confirm the details in chat.</div>
    </aside>
  );
}
