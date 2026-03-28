'use client';

import { useEffect, useRef } from 'react';

export default function HeroMockup() {
  const mockupRef = useRef<HTMLDivElement>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (animatedRef.current) return;
    animatedRef.current = true;

    // Counter animation
    const statValues = mockupRef.current?.querySelectorAll('.mockup-stat-value');
    if (statValues) {
      statValues.forEach((el) => {
        const target = parseInt(el.getAttribute('data-count') || '0', 10);
        const duration = 1200;
        let start: number | null = null;

        const step = (timestamp: number) => {
          if (!start) start = timestamp;
          const elapsed = timestamp - start;
          const p = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = String(Math.round(target * eased));
          if (p < 1) {
            requestAnimationFrame(step);
          }
        };

        requestAnimationFrame(step);
      });
    }

    // Floating cards
    const floatCard1 = document.getElementById('floatCard1');
    const floatCard2 = document.getElementById('floatCard2');
    const timer = setTimeout(() => {
      floatCard1?.classList.add('floating');
      floatCard2?.classList.add('floating');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="hero-visual">
      <div className="hero-mockup" ref={mockupRef}>
        <div className="mockup-topbar">
          <div className="mockup-dot"></div>
          <div className="mockup-dot"></div>
          <div className="mockup-dot"></div>
          <div className="mockup-url">app.anglerpass.com</div>
        </div>
        <div className="mockup-body">
          <div className="mockup-sidebar">
            <div className="mockup-sidebar-icon active"></div>
            <div className="mockup-sidebar-icon"></div>
            <div className="mockup-sidebar-icon"></div>
            <div className="mockup-sidebar-icon"></div>
            <div className="mockup-sidebar-icon"></div>
          </div>
          <div className="mockup-content">
            <div className="mockup-greeting">Welcome back, James</div>
            <div className="mockup-sub">
              Silver Creek Ranch &middot; Property Dashboard
            </div>
            <div className="mockup-stats">
              <div className="mockup-stat">
                <div className="mockup-stat-label">Active Bookings</div>
                <div className="mockup-stat-value" data-count="14">
                  0
                </div>
                <div className="mockup-stat-change">+3 this week</div>
              </div>
              <div className="mockup-stat">
                <div className="mockup-stat-label">Members</div>
                <div className="mockup-stat-value" data-count="86">
                  0
                </div>
                <div className="mockup-stat-change">+12 this month</div>
              </div>
              <div className="mockup-stat">
                <div className="mockup-stat-label">Properties</div>
                <div className="mockup-stat-value" data-count="3">
                  0
                </div>
                <div className="mockup-stat-change">All active</div>
              </div>
            </div>
            <div className="mockup-table">
              <div className="mockup-table-header">
                <span>Property</span>
                <span>Type</span>
                <span>Availability</span>
                <span>Status</span>
              </div>
              <div className="mockup-table-row">
                <span>Silver Creek — East Fork</span>
                <span>River</span>
                <span>Mar 26–28</span>
                <span>
                  <span className="status-badge status-active">Active</span>
                </span>
              </div>
              <div className="mockup-table-row">
                <span>Elk Meadow Spring</span>
                <span>Spring Creek</span>
                <span>Apr 1–5</span>
                <span>
                  <span className="status-badge status-active">Active</span>
                </span>
              </div>
              <div className="mockup-table-row">
                <span>Columbine Reservoir</span>
                <span>Stillwater</span>
                <span>Pending</span>
                <span>
                  <span className="status-badge status-pending">Review</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="float-card float-card-1" id="floatCard1">
        <div className="float-card-inner">
          <div className="float-icon green">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M15 4.5L7 12.5L3 8.5"
                stroke="#1a3a2a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <div className="float-card-label">Reservation Confirmed</div>
            <div className="float-card-sub">Silver Creek &middot; Mar 26</div>
          </div>
        </div>
      </div>
      <div className="float-card float-card-2" id="floatCard2">
        <div className="float-card-inner">
          <div className="float-icon blue">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 2v14M2 9h14"
                stroke="#3a6b7c"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <div className="float-card-label">New Member Request</div>
            <div className="float-card-sub">Trout Valley Anglers Club</div>
          </div>
        </div>
      </div>
    </div>
  );
}
