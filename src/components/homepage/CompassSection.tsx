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
    description: 'Natural language in, ranked recommendations out. No filters, no friction.',
  },
  {
    icon: '⚡',
    title: 'Dynamic Recommendations',
    description: 'Adjusts in real time as weather shifts, availability changes, and conditions evolve.',
  },
  {
    icon: '🎣',
    title: 'Full Trip Awareness',
    description: 'Considers the whole picture — water, guide, timing, and conditions together.',
  },
  {
    icon: '📈',
    title: 'Continuous Learning',
    description: 'Improves with every search and booking. Gets sharper the more you use it.',
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
    <section className="compass-section" id="compass">
      <div className="compass-overlay" />
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <div className="compass-header reveal">
          <span className="eyebrow" style={{ color: 'var(--sand)' }}>
            Introducing AnglerPass Compass &middot; The First AI-Powered Private Water Platform
          </span>
          <h2 className="compass-headline">
            You don&apos;t search.
            <br />
            <em>You ask.</em>
          </h2>
          <p className="compass-subhead">
            AnglerPass Compass is the intelligent matching engine built into the
            platform. Tell it what you&apos;re looking for — it handles the rest.
            Conditions, availability, species, timing, guide fit — evaluated in
            real time, ranked for you.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="compass-grid">
          {/* Left — feature cards */}
          <div className="compass-features">
            {FEATURES.map((feature, i) => (
              <div key={feature.title} className={`compass-feature-card reveal d${i + 1}`}>
                <div className="compass-feature-icon">{feature.icon}</div>
                <div>
                  <h4 className="compass-feature-title">{feature.title}</h4>
                  <p className="compass-feature-desc">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right — UI mockup */}
          <div className="compass-mockup-wrap reveal-right">
            <div className="compass-mockup">
              {/* Top bar */}
              <div className="compass-topbar">
                <div className="compass-dots">
                  <span className="compass-dot compass-dot-red" />
                  <span className="compass-dot compass-dot-yellow" />
                  <span className="compass-dot compass-dot-green" />
                </div>
                <span className="compass-topbar-title">AnglerPass Compass</span>
                <span className="compass-topbar-badge">AI · Beta</span>
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
                    <span className="compass-input-btn-arrow">↑</span> Find Water
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
                <div className="compass-results-label">Top Matches — This Weekend</div>
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
                        <span>🌡 {r.temp}°F</span>
                        <span>🎣 {r.species}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conditions strip */}
              <div className="compass-conditions">
                <span>☀️ Clear, 61°F Sat</span>
                <span className="compass-conditions-sep">|</span>
                <span>💧 Flows Stable</span>
                <span className="compass-conditions-sep">|</span>
                <span>🪰 Hatch: PMD Likely</span>
                <span className="compass-conditions-sep">|</span>
                <span>🌙 Moon: 55% Waning</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="compass-tagline reveal">
          Powered by AnglerPass Compass — Intelligent trip matching for modern anglers.
        </p>
      </div>
    </section>
  );
}
