'use client';

import { useEffect, useState, useRef } from 'react';

const QUERIES = [
  'A quiet stretch of private water within 3 hours, prime conditions for trout this weekend',
  'Best beginner-friendly guided trip on a Colorado spring creek this month',
  'Peak dry fly water near Denver — cutthroat or brown trout, morning slot Saturday',
  'Private river access in South Park, low pressure, no crowds — just good water',
];

const TYPE_SPEED = 38;
const DELETE_SPEED = 16;
const HOLD_TIME = 2800;
const PAUSE_TIME = 480;

function useTypewriter(queries: string[]) {
  const [text, setText] = useState('');
  const [queryIndex, setQueryIndex] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'holding' | 'deleting' | 'pausing'>('typing');
  const charIndex = useRef(0);

  useEffect(() => {
    const current = queries[queryIndex];
    let timer: ReturnType<typeof setTimeout>;

    if (phase === 'typing') {
      if (charIndex.current < current.length) {
        timer = setTimeout(() => {
          charIndex.current += 1;
          setText(current.slice(0, charIndex.current));
        }, TYPE_SPEED);
      } else {
        timer = setTimeout(() => setPhase('holding'), 0);
      }
    } else if (phase === 'holding') {
      timer = setTimeout(() => setPhase('deleting'), HOLD_TIME);
    } else if (phase === 'deleting') {
      if (charIndex.current > 0) {
        timer = setTimeout(() => {
          charIndex.current -= 1;
          setText(current.slice(0, charIndex.current));
        }, DELETE_SPEED);
      } else {
        timer = setTimeout(() => setPhase('pausing'), 0);
      }
    } else if (phase === 'pausing') {
      timer = setTimeout(() => {
        setQueryIndex((prev) => (prev + 1) % queries.length);
        setPhase('typing');
      }, PAUSE_TIME);
    }

    return () => clearTimeout(timer);
  }, [text, phase, queryIndex, queries]);

  return text;
}

const FEATURES = [
  {
    icon: '🧭',
    title: 'Smart Trip Matching',
    description: 'Describe what you want in plain language. Compass evaluates conditions, availability, species, and timing — then ranks the best options for you.',
  },
  {
    icon: '⚡',
    title: 'Real-Time Awareness',
    description: 'Adjusts as weather shifts, flows change, and availability moves. Every recommendation reflects what\'s happening right now.',
  },
  {
    icon: '🎒',
    title: 'Trip Preparation',
    description: 'Know what to bring, when to arrive, and what to expect — gear, flies, access details, and conditions tailored to your specific booking.',
  },
  {
    icon: '🎣',
    title: 'On-Water Guidance',
    description: 'Make better decisions in the moment. Adjust based on changing conditions, time of day, hatches, and local patterns.',
  },
  {
    icon: '📋',
    title: 'Post-Trip Intelligence',
    description: 'Revisit what worked, get suggestions for similar waters, and plan your next trip with more confidence each time.',
  },
  {
    icon: '📈',
    title: 'Continuous Learning',
    description: 'Gets sharper with every search, booking, and trip. The more you use it, the better it knows what you\'re looking for.',
  },
];

const RESULTS = [
  {
    name: 'Abell River Ranch',
    river: 'South Platte',
    location: 'Lake George, CO',
    drive: '1h 45m',
    match: 97,
    badge: 'Prime',
    badgeClass: 'compass-badge-prime',
    cfs: 410,
    temp: 52,
    species: 'Brown, Cutbow',
  },
  {
    name: 'Santa Maria Ranch',
    river: '',
    location: 'South Park, CO',
    drive: '2h 10m',
    match: 92,
    badge: 'Available',
    badgeClass: 'compass-badge-available',
    cfs: 195,
    temp: 49,
    species: 'Brown, Brook',
  },
  {
    name: 'Puma Hills River Ranch',
    river: '',
    location: 'Tarryall Valley, CO',
    drive: '2h 25m',
    match: 88,
    badge: 'Guide Available',
    badgeClass: 'compass-badge-guide',
    cfs: 260,
    temp: 51,
    species: 'Cutthroat',
  },
  {
    name: 'Spring Creeks Ranch',
    river: '',
    location: 'Roaring Fork Valley, CO',
    drive: '3h 05m',
    match: 83,
    badge: '1 Slot Left',
    badgeClass: 'compass-badge-slot',
    cfs: 310,
    temp: 48,
    species: 'Rainbow, Brown',
  },
];

export default function CompassSection() {
  const typedText = useTypewriter(QUERIES);

  return (
    <section className="compass-section" id="ai">
      <div className="compass-overlay" />

      {/* Cinematic hero background */}
      <div className="compass-hero">
        <div className="compass-hero-bg" />
        <div className="compass-hero-overlay" />
        <div className="container compass-hero-content">
          <div className="ai-intro reveal">
            <span className="eyebrow" style={{ color: 'var(--bronze-light)' }}>
              AnglerPass Compass &middot; AI-Powered
            </span>
            <h2 className="ai-headline">
              You don&apos;t search.
              <br />
              <em>You ask.</em>
            </h2>
            <p className="ai-subhead">
              AnglerPass Compass is the intelligent engine built into the platform.
              It finds your water, prepares your trip, and guides your day &mdash;
              all from a single conversation. Tell it what you&apos;re looking for.
              It handles the rest.
            </p>
          </div>
        </div>
      </div>

      <div className="container compass-offerings-wrap" style={{ position: 'relative', zIndex: 2 }}>

        {/* Main Compass offering */}
        <div className="ai-offering" id="compass">
          <div className="compass-header reveal">
            <span className="eyebrow" style={{ color: 'var(--sand)' }}>
              The First AI-Powered Private Water Platform
            </span>
            <h2 className="compass-headline">
              Find your water.
              <br />
              <em>Plan your trip. Fish smarter.</em>
            </h2>
            <p className="compass-subhead">
              From discovery to post-trip &mdash; Compass understands what
              you&apos;re after and gives you clear, contextual guidance at every
              step. Conditions, gear, timing, access &mdash; evaluated in real
              time, personalized for you.
            </p>
          </div>

          {/* Two-column: features + search mockup */}
          <div className="compass-grid">
            {/* Left — feature cards */}
            <div className="compass-features">
              {FEATURES.map((feature, i) => (
                <div key={feature.title} className={`compass-feature-card reveal d${(i % 4) + 1}`}>
                  <div className="compass-feature-icon">{feature.icon}</div>
                  <div>
                    <h4 className="compass-feature-title">{feature.title}</h4>
                    <p className="compass-feature-desc">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right — stacked mockups */}
            <div className="compass-mockup-wrap reveal-right">
              {/* Search Mockup */}
              <div className="compass-mockup">
                {/* Top bar */}
                <div className="compass-topbar">
                  <div className="compass-dots">
                    <span className="compass-dot compass-dot-red" />
                    <span className="compass-dot compass-dot-yellow" />
                    <span className="compass-dot compass-dot-green" />
                  </div>
                  <span className="compass-topbar-title">AnglerPass Compass</span>
                  <span className="compass-topbar-badge">AI &middot; Beta</span>
                </div>

                {/* Query input */}
                <div className="compass-input-area">
                  <div className="compass-input-label">Ask Compass</div>
                  <div className="compass-input-box">
                    <svg className="compass-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
                    </svg>
                    <div className="compass-input-text">
                      {typedText}
                      <span className="compass-cursor" />
                    </div>
                    <button className="compass-input-btn" aria-label="Find Water">
                      <span className="compass-input-btn-arrow">&uarr;</span> Find Water
                    </button>
                  </div>
                </div>

                {/* Processing bar */}
                <div className="compass-processing">
                  <div className="compass-processing-top">
                    <div className="compass-loading-dots">
                      <span /><span /><span />
                    </div>
                    <span className="compass-processing-text">
                      Evaluating conditions, availability &amp; match score
                    </span>
                  </div>
                  <div className="compass-processing-tags">
                    <span>Proximity</span>
                    <span>Species</span>
                    <span>Weather</span>
                    <span>Flow</span>
                  </div>
                </div>

                {/* Results */}
                <div className="compass-results">
                  <div className="compass-results-label">Top Matches &mdash; This Weekend</div>
                  <div className="compass-results-grid">
                    {RESULTS.map((r) => (
                      <div key={r.name} className="compass-result-card">
                        <div className="compass-result-header">
                          <span className="compass-result-name">{r.name}</span>
                          <span className="compass-result-match">{r.match}%</span>
                        </div>
                        <div className="compass-result-location">
                          {r.river ? `${r.river} · ` : ''}{r.location} · {r.drive}
                        </div>
                        <div className="compass-result-badge-row">
                          <span className={`compass-result-badge ${r.badgeClass}`}>{r.badge}</span>
                        </div>
                        <div className="compass-result-stats">
                          <span>🌊 {r.cfs} cfs</span>
                          <span>🌡 {r.temp}&deg;F</span>
                          <span>🎣 {r.species}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conditions strip */}
                <div className="compass-conditions">
                  <span>☀️ Clear, 61&deg;F Sat</span>
                  <span className="compass-conditions-sep">|</span>
                  <span>💧 Flows Stable</span>
                  <span className="compass-conditions-sep">|</span>
                  <span>🪰 Hatch: PMD Likely</span>
                  <span className="compass-conditions-sep">|</span>
                  <span>🌙 Moon: 55% Waning</span>
                </div>
              </div>

              {/* Trip Planning Chat Mockup */}
              <div className="concierge-mockup" style={{ marginTop: '16px' }}>
                {/* Top bar */}
                <div className="concierge-topbar">
                  <div className="concierge-dots">
                    <span className="concierge-dot concierge-dot-red" />
                    <span className="concierge-dot concierge-dot-yellow" />
                    <span className="concierge-dot concierge-dot-green" />
                  </div>
                  <span className="concierge-topbar-title">
                    AnglerPass Compass &middot; Trip Assistant
                  </span>
                  <span className="concierge-topbar-badge">AI</span>
                </div>

                {/* Trip context bar */}
                <div className="concierge-context-bar">
                  <span className="concierge-context-icon">📍</span>
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
                    <div className="concierge-msg-label">Compass</div>
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

          {/* Bottom tagline */}
          <p className="compass-tagline reveal">
            One AI. Every step of the journey &mdash; from finding your water to fishing it.
          </p>
        </div>
      </div>
    </section>
  );
}
