const COMMUNICATIONS = [
  'Club broadcast messaging',
  'Targeted messaging by tier, status, or activity',
  'Event & season notice templates',
  'Scheduled announcements',
  'Auto-generated newsletter digest',
  'Custom member groups',
  'Member communication preferences',
  'Communication analytics',
];

const OPERATIONS = [
  'Event management with RSVPs & waitlists',
  'Member activity dashboard',
  'Data export suite (CSV/PDF)',
  'Club tier limit enforcement',
  'Waitlist management',
];

export default function ClubOsSection() {
  return (
    <section className="clubos" id="clubos">
      <div className="container">
        <div className="clubos-header reveal">
          <span className="eyebrow">Introducing ClubOS</span>
          <h2 className="section-heading">
            ClubOS &mdash; Your Club&rsquo;s{' '}
            <br />
            Operating System
          </h2>
          <p className="section-subhead" style={{ margin: '0 auto' }}>
            13 features designed to replace your spreadsheets, group texts,
            and&nbsp;email chains with a single platform built for how clubs
            actually&nbsp;run.
          </p>
        </div>

        <div className="clubos-intro reveal">
          <p className="clubos-intro-text">
            Most club software stops at membership lists and payment processing.
            ClubOS goes further &mdash; broadcast and targeted communications,
            event management with RSVPs and waitlists, member engagement
            tracking, automated newsletters, and real-time analytics.
            It&rsquo;s not an add-on. It&rsquo;s built into AnglerPass,
            included with every club plan, and designed to make your club
            impossible to run&nbsp;without.
          </p>
        </div>

        <div className="clubos-grid">
          <div className="clubos-card reveal">
            <div className="clubos-card-icon">
              <svg viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className="clubos-card-title">Communications</h3>
            <ul className="clubos-list">
              {COMMUNICATIONS.map((item) => (
                <li key={item}>
                  <svg className="clubos-check" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="clubos-card reveal d1">
            <div className="clubos-card-icon">
              <svg viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </div>
            <h3 className="clubos-card-title">Operations</h3>
            <ul className="clubos-list">
              {OPERATIONS.map((item) => (
                <li key={item}>
                  <svg className="clubos-check" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="clubos-footer reveal">
          <p className="clubos-footer-note">
            ClubOS is live and included with every AnglerPass club&nbsp;plan.
          </p>
          <a href="/clubs" className="btn btn-river">
            See All Club Features &rarr;
          </a>
        </div>
      </div>
    </section>
  );
}
