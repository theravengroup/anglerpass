const PHASES = [
  {
    icon: '\u{1F50D}',
    title: 'Before You Book',
    description:
      'Understand whether a property is the right fit \u2014 skill level, seasonal timing, guide recommendations, and what kind of experience to expect.',
  },
  {
    icon: '\u{1F392}',
    title: 'Before You Arrive',
    description:
      'Arrive prepared, not guessing. Get guidance on gear, packing, timing, terrain, access, and weather expectations.',
  },
  {
    icon: '\u{1F30A}',
    title: 'During Your Trip',
    description:
      'Make better decisions in the moment. Adjust based on changing conditions, time of day, and local patterns.',
  },
  {
    icon: '\u{1F4CB}',
    title: 'After Your Trip',
    description:
      'Keep the momentum going. Revisit what worked, get suggestions for similar waters, and plan your next trip with more confidence.',
  },
];

const CONTEXT_SOURCES = [
  { icon: '\u{1F4CD}', label: 'The specific property you\u2019re viewing' },
  { icon: '\u{1F4C5}', label: 'Your actual booking details' },
  { icon: '\u{1FA80}', label: 'Your preferences and experience level' },
  { icon: '\u{1F324}\uFE0F', label: 'Available weather and conditions data' },
];

export default function ConciergeSection() {
  return (
    <section className="concierge-section">
      <div className="concierge-overlay" />
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <div className="concierge-header reveal">
          <span className="eyebrow" style={{ color: 'var(--bronze-light)' }}>
            Introducing AnglerPass Concierge &middot; Your Context-Aware Trip
            Assistant
          </span>
          <h2 className="concierge-headline">
            Know what to expect
            <br />
            <em>before you ever step in the water.</em>
          </h2>
          <p className="concierge-subhead">
            Planning a fly fishing trip usually means piecing together scattered
            information &mdash; conditions, gear, timing, access, and local
            knowledge. Concierge brings all of that into one place. It
            understands your trip &mdash; where you&apos;re going, when
            you&apos;re going, and what kind of angler you are &mdash; and gives
            you clear, relevant guidance at every step.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="concierge-grid">
          {/* Left — journey phases */}
          <div className="concierge-phases">
            {PHASES.map((phase, i) => (
              <div
                key={phase.title}
                className={`concierge-phase-card reveal d${i + 1}`}
              >
                <div className="concierge-phase-icon">{phase.icon}</div>
                <div>
                  <h4 className="concierge-phase-title">{phase.title}</h4>
                  <p className="concierge-phase-desc">{phase.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right — chat mockup */}
          <div className="concierge-mockup-wrap reveal-right">
            <div className="concierge-mockup">
              {/* Top bar */}
              <div className="concierge-topbar">
                <div className="concierge-dots">
                  <span className="concierge-dot concierge-dot-red" />
                  <span className="concierge-dot concierge-dot-yellow" />
                  <span className="concierge-dot concierge-dot-green" />
                </div>
                <span className="concierge-topbar-title">
                  AnglerPass Concierge
                </span>
                <span className="concierge-topbar-badge">AI</span>
              </div>

              {/* Trip context bar */}
              <div className="concierge-context-bar">
                <span className="concierge-context-icon">
                  {'\u{1F4CD}'}
                </span>
                <span>
                  Abell River Ranch &middot; South Platte &middot; Apr 12
                  &middot; Half Day AM
                </span>
              </div>

              {/* Chat messages */}
              <div className="concierge-chat">
                <div className="concierge-msg concierge-msg-user">
                  <div className="concierge-msg-label">You</div>
                  <div className="concierge-msg-bubble concierge-msg-bubble-user">
                    What should I bring for this trip?
                  </div>
                </div>

                <div className="concierge-msg concierge-msg-assistant">
                  <div className="concierge-msg-label">Concierge</div>
                  <div className="concierge-msg-bubble concierge-msg-bubble-assistant">
                    <p className="concierge-msg-intro">
                      Based on current conditions at Abell River Ranch:
                    </p>
                    <ul className="concierge-msg-list">
                      <li>Waders recommended &mdash; water temp around 52&deg;F</li>
                      <li>4&ndash;5wt rod, 9ft leaders, 5x tippet</li>
                      <li>PMD and BWO patterns, size 16&ndash;20</li>
                      <li>
                        Layers for morning &mdash; temps near 38&deg;F at the
                        put-in
                      </li>
                      <li>Felt-sole wading boots &mdash; rocky substrate</li>
                    </ul>
                    <p className="concierge-msg-outro">
                      Conditions look favorable for dry fly activity in the late
                      morning window.
                    </p>
                  </div>
                </div>
              </div>

              {/* Suggestion chips */}
              <div className="concierge-suggestions">
                <span>Do I need a guide?</span>
                <span>Best time of day?</span>
                <span>Good for beginners?</span>
              </div>
            </div>
          </div>
        </div>

        {/* Built on Real Context */}
        <div className="concierge-real-context reveal">
          <h4 className="concierge-real-context-title">
            Built on Real Context, Not Generic Advice
          </h4>
          <div className="concierge-context-sources">
            {CONTEXT_SOURCES.map((source) => (
              <div key={source.label} className="concierge-source">
                <span className="concierge-source-icon">{source.icon}</span>
                <span>{source.label}</span>
              </div>
            ))}
          </div>
          <p className="concierge-real-context-note">
            When information is limited, it tells you. When it knows,
            it&apos;s specific.
          </p>
        </div>

        {/* Bottom tagline */}
        <p className="concierge-tagline reveal">
          Less guesswork. Better days on the water. Just ask.
        </p>
      </div>
    </section>
  );
}
