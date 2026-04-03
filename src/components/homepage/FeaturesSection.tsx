export default function FeaturesSection() {
  return (
    <section className="features" id="features">
      <div className="container">
        <div className="features-header reveal">
          <span className="eyebrow">Platform Capabilities</span>
          <h2 className="section-heading">Core Platform Features</h2>
          <p className="section-subhead" style={{ margin: '0 auto' }}>Every tool designed to make private water management, membership operations, and angler access work together.</p>
        </div>
        <div className="features-grid">
          <div className="feature-item reveal">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            </div>
            <h4>Property Registration</h4>
            <p>List and manage private waters with detailed profiles, maps, and access parameters. Define what's available, when, and to whom.</p>
          </div>
          <div className="feature-item reveal d1">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </div>
            <h4>Membership Tools</h4>
            <p>Run club memberships with structured tiers, renewals, and digital roster management. Keep your member base organized without the spreadsheets.</p>
          </div>
          <div className="feature-item reveal d2">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            </div>
            <h4>Reservations &amp; Booking</h4>
            <p>A clean workflow for scheduling fishing days. Handle requests, confirmations, and calendar management from a single dashboard.</p>
          </div>
          <div className="feature-item reveal">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
            </div>
            <h4>Availability Calendars</h4>
            <p>Visual, real-time calendars that sync across properties and members. No more double bookings or outdated schedules.</p>
          </div>
          <div className="feature-item reveal d1">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            </div>
            <h4>Access Controls</h4>
            <p>Fine-grained permissions for who can see, request, and book specific waters. Maintain privacy while opening controlled access.</p>
          </div>
          <div className="feature-item reveal d2">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </div>
            <h4>Guest Management</h4>
            <p>Manage fishing guests and non-fishing companions for every booking. Track who&rsquo;s on the water and when, with clear records for every visit.</p>
          </div>
          <div className="feature-item reveal">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            </div>
            <h4>Admin Dashboard</h4>
            <p>A centralized operations view for landowners and club managers. See activity, manage requests, and monitor access from one screen.</p>
          </div>
          <div className="feature-item reveal d1">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            </div>
            <h4>Inquiry Handling</h4>
            <p>Receive and respond to access requests from qualified anglers. Pre-screen, approve, or decline with structured communication tools.</p>
          </div>
          <div className="feature-item reveal d2">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            </div>
            <h4>Private Water Listings</h4>
            <p>Curated, searchable listings for private waters. Each property gets a professional profile with photos, rules, species info, and access terms.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
