export default function HowItWorksSection() {
  return (
    <section className="how-it-works" id="how">
      <div className="container">
        <div className="how-header reveal">
          <span className="eyebrow">How It Works</span>
          <h2 className="section-heading">One Platform. Three Distinct Roles.</h2>
          <p className="section-subhead" style={{ margin: '0 auto' }}>AnglerPass connects the private water ecosystem through a shared platform designed for every stakeholder.</p>
        </div>
        <div className="how-grid">
          <div className="how-card reveal d1">
            <div className="how-card-accent"></div>
            <div className="how-card-body">
              <div className="how-card-icon">
                <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
              </div>
              <h3>Landowners</h3>
              <div className="how-card-for">Property Management</div>
              <ul>
                <li>Register and showcase private waters</li>
                <li>Control access, visibility, and availability</li>
                <li>Manage inquiries and booking requests</li>
                <li>Participate in a vetted, trusted network</li>
                <li>Present properties with a professional profile</li>
              </ul>
              <a
                href="/landowners"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 20,
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: '.3px',
                  color: 'var(--color-forest)',
                  textDecoration: 'none',
                  transition: 'opacity .3s',
                }}
              >
                Learn more &rarr;
              </a>
            </div>
          </div>
          <div className="how-card reveal d2">
            <div className="how-card-accent"></div>
            <div className="how-card-body">
              <div className="how-card-icon">
                <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              </div>
              <h3>Fly Fishing Clubs</h3>
              <div className="how-card-for">Trust &amp; Vetting</div>
              <ul>
                <li>Vet members and vouch for their access</li>
                <li>Serve as the trust layer for landowners</li>
                <li>Manage memberships and schedules digitally</li>
                <li>Opt in to cross-club access agreements</li>
                <li>Reduce administrative overhead</li>
              </ul>
              <a
                href="/clubs"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 20,
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: '.3px',
                  color: 'var(--color-river)',
                  textDecoration: 'none',
                  transition: 'opacity .3s',
                }}
              >
                Learn more &rarr;
              </a>
            </div>
          </div>
          <div className="how-card reveal d3">
            <div className="how-card-accent"></div>
            <div className="how-card-body">
              <div className="how-card-icon">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
              </div>
              <h3>Individual Anglers</h3>
              <div className="how-card-for">Club-Based Access</div>
              <ul>
                <li>Join a club and get vetted as a member</li>
                <li>Book private fly fishing days through your club</li>
                <li>Access trusted, vetted properties</li>
                <li>View real-time availability and details</li>
                <li>Unlock cross-club water through the network</li>
              </ul>
              <a
                href="/anglers"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 20,
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: '.3px',
                  color: 'var(--color-bronze)',
                  textDecoration: 'none',
                  transition: 'opacity .3s',
                }}
              >
                Learn more &rarr;
              </a>
            </div>
          </div>
        </div>
        {/* Cross-club network banner */}
        <div
          className="reveal"
          style={{
            marginTop: 48,
            padding: '36px 40px',
            background: 'rgba(58,107,124,.06)',
            border: '1px solid rgba(58,107,124,.12)',
            borderRadius: 14,
            textAlign: 'center',
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 22,
              fontWeight: 600,
              color: 'var(--color-forest)',
              marginBottom: 10,
              letterSpacing: '-.2px',
            }}
          >
            The Cross-Club Network
          </h3>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: 'var(--color-text-secondary)',
              maxWidth: 600,
              margin: '0 auto',
            }}
          >
            Clubs on AnglerPass can opt in to reciprocal access agreements. Your members
            fish water managed by other clubs. Their members fish yours. One membership,
            an expanding network of private water.
          </p>
        </div>
      </div>
    </section>
  );
}
