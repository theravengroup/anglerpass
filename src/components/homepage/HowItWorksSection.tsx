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
              <svg viewBox="0 0 480 140" fill="none" className="cross-club-diagram">
                {/* Glow defs */}
                <defs>
                  <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(58,107,124,.25)" />
                    <stop offset="100%" stopColor="rgba(58,107,124,0)" />
                  </radialGradient>
                  <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(154,115,64,.2)" />
                    <stop offset="100%" stopColor="rgba(154,115,64,0)" />
                  </radialGradient>
                </defs>

                {/* Background glow halos */}
                <circle cx="80" cy="65" r="42" fill="url(#nodeGlow)" />
                <circle cx="400" cy="65" r="42" fill="url(#nodeGlow)" />
                <circle cx="240" cy="65" r="50" fill="url(#centerGlow)" />

                {/* Connection lines — main horizontal */}
                <line x1="108" y1="65" x2="212" y2="65" stroke="rgba(255,255,255,.18)" strokeWidth="1.5" strokeDasharray="6 4" />
                <line x1="268" y1="65" x2="372" y2="65" stroke="rgba(255,255,255,.18)" strokeWidth="1.5" strokeDasharray="6 4" />

                {/* Connection lines — diagonals to angler nodes */}
                <line x1="100" y1="50" x2="220" y2="25" stroke="rgba(255,255,255,.1)" strokeWidth="1" strokeDasharray="4 3" />
                <line x1="380" y1="50" x2="260" y2="25" stroke="rgba(255,255,255,.1)" strokeWidth="1" strokeDasharray="4 3" />
                <line x1="100" y1="80" x2="220" y2="110" stroke="rgba(255,255,255,.1)" strokeWidth="1" strokeDasharray="4 3" />
                <line x1="380" y1="80" x2="260" y2="110" stroke="rgba(255,255,255,.1)" strokeWidth="1" strokeDasharray="4 3" />

                {/* Angler nodes (bronze dots) */}
                <circle cx="240" cy="22" r="7" fill="rgba(154,115,64,.4)" stroke="var(--bronze)" strokeWidth="1.5" />
                <circle cx="240" cy="112" r="7" fill="rgba(154,115,64,.4)" stroke="var(--bronze)" strokeWidth="1.5" />
                {/* Angler icon inside dots */}
                <path d="M237.5 21a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0z" fill="var(--bronze)" opacity=".7" />
                <path d="M237.5 111a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0z" fill="var(--bronze)" opacity=".7" />

                {/* Angler labels */}
                <text x="255" y="26" fill="var(--bronze)" fontSize="7" fontWeight="500" opacity=".7">ANGLER</text>
                <text x="255" y="116" fill="var(--bronze)" fontSize="7" fontWeight="500" opacity=".7">ANGLER</text>

                {/* Club A node */}
                <circle cx="80" cy="65" r="26" fill="rgba(58,107,124,.2)" stroke="var(--river)" strokeWidth="2" />
                <circle cx="80" cy="65" r="20" fill="rgba(58,107,124,.15)" stroke="rgba(255,255,255,.08)" strokeWidth="1" />
                <text x="80" y="62" textAnchor="middle" fill="rgba(255,255,255,.45)" fontSize="7" fontWeight="600" letterSpacing=".5">CLUB</text>
                <text x="80" y="73" textAnchor="middle" fill="white" fontSize="12" fontWeight="700">A</text>

                {/* Club B node */}
                <circle cx="400" cy="65" r="26" fill="rgba(58,107,124,.2)" stroke="var(--river)" strokeWidth="2" />
                <circle cx="400" cy="65" r="20" fill="rgba(58,107,124,.15)" stroke="rgba(255,255,255,.08)" strokeWidth="1" />
                <text x="400" y="62" textAnchor="middle" fill="rgba(255,255,255,.45)" fontSize="7" fontWeight="600" letterSpacing=".5">CLUB</text>
                <text x="400" y="73" textAnchor="middle" fill="white" fontSize="12" fontWeight="700">B</text>

                {/* Center AnglerPass node — outer ring */}
                <circle cx="240" cy="65" r="28" fill="rgba(58,107,124,.3)" stroke="var(--river)" strokeWidth="2" />

                {/* AnglerPass logo */}
                <image href="/images/anglerpass-noword-logo.svg" x="218" y="43" width="44" height="44" />

                {/* Pulse rings on center */}
                <circle cx="240" cy="65" r="28" fill="none" stroke="var(--river)" strokeWidth="1" opacity=".4" className="cross-club-pulse" />
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
