'use client';

import { useState, useRef } from 'react';

const faqItems = [
  {
    question: 'What is AnglerPass?',
    answer: 'AnglerPass is a software platform built for the private fly fishing ecosystem. It connects landowners, fly fishing clubs, and individual anglers through tools for property management, membership operations, reservations, and access coordination \u2014 all in one place.',
  },
  {
    question: 'Who is AnglerPass for?',
    answer: 'AnglerPass serves three core audiences: private landowners who want to manage water access professionally, fly fishing clubs that need membership and scheduling tools, and individual anglers looking to discover and book private water fly fishing experiences. Every property listing shows its daily rod capacity so anglers know upfront how many rods may share the water on any given\u00a0day.',
  },
  {
    question: 'Is the platform available yet?',
    answer: 'Not yet. AnglerPass is currently under active development. We\u2019re building the platform with direct input from landowners, clubs, and experienced anglers. You can join the waitlist to get priority access and development updates as we approach launch.',
  },
  {
    question: 'Can landowners list private waters?',
    answer: 'Yes. Landowners can register properties, create professional profiles, define access rules, and manage availability calendars. Every property must be associated with at least one fly fishing club before it can be published \u2014 clubs serve as the trust and vetting layer for anglers who book access. If your club isn\u2019t on AnglerPass yet, you can invite them directly from the property registration flow.',
  },
  {
    question: 'Can clubs manage memberships through AnglerPass?',
    answer: 'Yes \u2014 and it\u2019s not an afterthought. AnglerPass gives clubs best-in-class member management software in the cloud, purpose-built for fly fishing. Digital rosters, member vetting and applications, access scheduling, reservation coordination, property management, and member communications \u2014 all available at launch. Most clubs run on spreadsheets, group texts, and handshake agreements. AnglerPass replaces all of that with a single platform designed around how clubs actually operate.',
  },
  {
    question: 'How do anglers book private water?',
    answer: 'All bookings on AnglerPass go through club membership. Anglers join a fly fishing club, get vetted as a member, and then book private water through their club\u2019s access agreements with landowners. A 15% platform fee is added to each booking. If your club participates in cross-club access, you can also book water managed by other clubs in the network.',
  },
  {
    question: 'How do I join the waitlist?',
    answer: 'You can sign up using the form on this page. Enter your name, email, and role (landowner, club, or angler), and we\u2019ll add you to our priority list. You\u2019ll receive updates on our development progress and an early invitation when we\u2019re ready to launch.',
  },
  {
    question: 'Can I request early access or become a pilot user?',
    answer: 'Yes. If you\u2019re a landowner with private water to manage, a club looking for better operations tools, or an angler interested in helping shape the platform, we\u2019d welcome the conversation. Reach out through the early access link on the waitlist form or contact us directly.',
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const answerRefs = useRef<(HTMLDivElement | null)[]>([]);

  function toggle(index: number) {
    setOpenIndex((prev) => (prev === index ? null : index));
  }

  return (
    <section className="faq" id="faq">
      <div className="container">
        <div className="faq-header reveal">
          <span className="eyebrow">FAQ</span>
          <h2 className="section-heading">Common questions</h2>
        </div>
        <div className="faq-list reveal d1">
          {faqItems.map((item, i) => (
            <div key={i} className={`faq-item${openIndex === i ? ' open' : ''}`}>
              <button className="faq-question" onClick={() => toggle(i)}>
                {item.question}
                <svg className="faq-chevron" viewBox="0 0 20 20">
                  <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div
                className="faq-answer"
                ref={(el) => { answerRefs.current[i] = el; }}
                style={{
                  maxHeight: openIndex === i ? `${answerRefs.current[i]?.scrollHeight ?? 0}px` : '0',
                }}
              >
                <div className="faq-answer-inner">{item.answer}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
