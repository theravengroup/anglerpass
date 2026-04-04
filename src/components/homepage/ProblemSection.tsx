export default function ProblemSection() {
  return (
    <section className="problem" id="problem">
      <div className="container">
        <div className="problem-header reveal">
          <span className="eyebrow">The Problem</span>
          <h2 className="section-heading">A Premier Ecosystem,<br /> Running on Manual Systems</h2>
          <p className="section-subhead" style={{ margin: '0 auto' }}>Private fly fishing has an access problem.<br /> Not a lack of interest — a lack of infrastructure.</p>
        </div>
        <div className="problem-grid">
          <div className="problem-card reveal d1">
            <div className="problem-icon">
              <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 3v18" /></svg>
            </div>
            <h3>Scattered Management</h3>
            <p>Landowners manage private water access through phone calls, emails, and handshake agreements. There's no centralized system to organize properties, schedules, or inquiries.</p>
          </div>
          <div className="problem-card reveal d2">
            <div className="problem-icon">
              <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </div>
            <h3>Club Friction</h3>
            <p>Fly fishing clubs handle memberships, scheduling, and communications through spreadsheets and group texts. Administrative overhead eats into the time members should spend on the water.</p>
          </div>
          <div className="problem-card reveal d3">
            <div className="problem-icon">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            </div>
            <h3>Discovery Gaps</h3>
            <p>Individual anglers have limited ways to find and book legitimate private water experiences. Most access still depends on who you know, not what's available.</p>
          </div>
          <div className="problem-card reveal d4">
            <div className="problem-icon">
              <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            </div>
            <h3>Trust Deficit</h3>
            <p>Without a structured platform, trust between landowners, clubs, and anglers relies on informal networks. That limits growth and keeps the market fragmented.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
