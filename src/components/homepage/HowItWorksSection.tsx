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
            <div className="how-card-body" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="how-card-icon">
                <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
              </div>
              <h3>Landowners</h3>
              <div className="how-card-for">Property Management</div>
              <ul style={{ flex: 1 }}>
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
                  justifyContent: 'center',
                  gap: 6,
                  marginTop: 24,
                  padding: '10px 24px',
                  borderRadius: 100,
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '.3px',
                  color: '#fff',
                  background: 'var(--color-forest)',
                  textDecoration: 'none',
                  transition: 'all .3s',
                  alignSelf: 'flex-start',
                }}
              >
                For Landowners &rarr;
              </a>
            </div>
          </div>
          <div className="how-card reveal d2">
            <div className="how-card-accent"></div>
            <div className="how-card-body" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="how-card-icon">
                <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              </div>
              <h3>Fly Fishing Clubs</h3>
              <div className="how-card-for">Trust &amp; Vetting</div>
              <ul style={{ flex: 1 }}>
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
                  justifyContent: 'center',
                  gap: 6,
                  marginTop: 24,
                  padding: '10px 24px',
                  borderRadius: 100,
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '.3px',
                  color: '#fff',
                  background: 'var(--color-river)',
                  textDecoration: 'none',
                  transition: 'all .3s',
                  alignSelf: 'flex-start',
                }}
              >
                For Clubs &rarr;
              </a>
            </div>
          </div>
          <div className="how-card reveal d3">
            <div className="how-card-accent"></div>
            <div className="how-card-body" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="how-card-icon">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
              </div>
              <h3>Individual Anglers</h3>
              <div className="how-card-for">Club-Based Access</div>
              <ul style={{ flex: 1 }}>
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
                  justifyContent: 'center',
                  gap: 6,
                  marginTop: 24,
                  padding: '10px 24px',
                  borderRadius: 100,
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '.3px',
                  color: '#fff',
                  background: 'var(--color-bronze)',
                  textDecoration: 'none',
                  transition: 'all .3s',
                  alignSelf: 'flex-start',
                }}
              >
                For Anglers &rarr;
              </a>
            </div>
          </div>
        </div>
        {/* Cross-Club Network — elevated showcase */}
        <div className="cross-club-banner reveal">
          <div className="cross-club-bg" />
          <div className="cross-club-inner">
            <div className="cross-club-header">
              <span className="cross-club-eyebrow">Network Effect</span>
              <h3 className="cross-club-title">The Cross-Club Network</h3>
              <p className="cross-club-lead">
                One membership. An expanding network of private water. Clubs on AnglerPass
                opt in to reciprocal access agreements &mdash; your members fish water managed
                by partner clubs, and theirs fish yours.
              </p>
            </div>

            {/* Network visualization */}
            <div className="cross-club-visual" aria-hidden="true">
              <svg viewBox="0 0 400 120" fill="none" className="cross-club-diagram">
                {/* Connection lines */}
                <line x1="80" y1="60" x2="200" y2="60" stroke="rgba(255,255,255,.2)" strokeWidth="1.5" strokeDasharray="6 4" />
                <line x1="200" y1="60" x2="320" y2="60" stroke="rgba(255,255,255,.2)" strokeWidth="1.5" strokeDasharray="6 4" />
                <line x1="80" y1="60" x2="200" y2="25" stroke="rgba(255,255,255,.12)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="320" y1="60" x2="200" y2="25" stroke="rgba(255,255,255,.12)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="80" y1="60" x2="200" y2="95" stroke="rgba(255,255,255,.12)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="320" y1="60" x2="200" y2="95" stroke="rgba(255,255,255,.12)" strokeWidth="1" strokeDasharray="4 4" />

                {/* Outer nodes */}
                <circle cx="200" cy="25" r="6" fill="rgba(154,115,64,.5)" stroke="var(--bronze)" strokeWidth="1.5" />
                <circle cx="200" cy="95" r="6" fill="rgba(154,115,64,.5)" stroke="var(--bronze)" strokeWidth="1.5" />

                {/* Main club nodes */}
                <circle cx="80" cy="60" r="18" fill="rgba(58,107,124,.3)" stroke="var(--river)" strokeWidth="2" />
                <circle cx="200" cy="60" r="22" fill="rgba(58,107,124,.4)" stroke="var(--river)" strokeWidth="2" />
                <circle cx="320" cy="60" r="18" fill="rgba(58,107,124,.3)" stroke="var(--river)" strokeWidth="2" />

                {/* Labels */}
                <text x="80" y="64" textAnchor="middle" fill="white" fontSize="9" fontWeight="600">A</text>
                <text x="200" y="64" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">AP</text>
                <text x="320" y="64" textAnchor="middle" fill="white" fontSize="9" fontWeight="600">B</text>

                {/* Pulse rings on center */}
                <circle cx="200" cy="60" r="22" fill="none" stroke="var(--river)" strokeWidth="1" opacity=".4" className="cross-club-pulse" />
              </svg>
            </div>

            <div className="cross-club-benefits">
              <div className="cross-club-benefit">
                <div className="cross-club-benefit-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h4>Reciprocal Access</h4>
                <p>Clubs choose their partners and set their own terms. Full control over who fishes your water and when.</p>
              </div>
              <div className="cross-club-benefit">
                <div className="cross-club-benefit-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <h4>Growing Network</h4>
                <p>Every club that joins expands the water available to every member. The network compounds with scale.</p>
              </div>
              <div className="cross-club-benefit">
                <div className="cross-club-benefit-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h4>Trust Built In</h4>
                <p>Every angler is club-vetted. Landowners and partner clubs know exactly who&rsquo;s on the water.</p>
              </div>
            </div>

            <div className="cross-club-cta">
              <a href="/clubs" className="btn btn-river">
                Learn How It Works
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
