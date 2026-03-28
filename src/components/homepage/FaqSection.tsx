'use client';

import { useState, useRef, useCallback } from 'react';

const faqItems = [
  {
    question: 'What is AnglerPass?',
    answer: 'AnglerPass is a software platform built for the private fly fishing ecosystem. It connects landowners, fly fishing clubs, and individual anglers through tools for property management, membership operations, reservations, and access coordination \u2014 all in one place.',
  },
  {
    question: 'Who is AnglerPass for?',
    answer: 'AnglerPass serves three core audiences: private landowners who want to manage water access professionally, fly fishing clubs that need membership and scheduling tools, and individual anglers looking to discover and book private fly fishing experiences.',
  },
  {
    question: 'Is the platform available yet?',
    answer: 'Not yet. AnglerPass is currently under active development. We\u2019re building the platform with direct input from landowners, clubs, and experienced anglers. You can join the waitlist to get priority access and development updates as we approach launch.',
  },
  {
    question: 'Can landowners list private waters?',
    answer: 'Yes. AnglerPass will include full property registration and listing tools. Landowners will be able to create professional profiles for their waters, define access rules, manage availability calendars, and control who can see and request access to their properties.',
  },
  {
    question: 'Can clubs manage memberships through AnglerPass?',
    answer: 'Absolutely. The platform is being designed with clubs as a core user group. Membership management, digital rosters, access scheduling, reservation coordination, and member communication tools are all part of the product roadmap.',
  },
  {
    question: 'Will individual anglers be able to book directly?',
    answer: 'That\u2019s the plan. AnglerPass will give anglers the ability to browse available private waters, view property details, and submit booking or access requests. The specifics of the booking flow will depend on each landowner or club\u2019s preferences and access rules.',
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

  const toggle = useCallback((index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  }, []);

  return (
    <section className="faq" id="faq">
      <div className="container">
        <div className="faq-header reveal">
          <span className="eyebrow">Questions</span>
          <h2 className="section-heading">Frequently Asked</h2>
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
