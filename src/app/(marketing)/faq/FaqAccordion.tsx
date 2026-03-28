'use client';

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

const faqItems = [
  {
    question: 'What is AnglerPass?',
    answer:
      'AnglerPass is a software platform built for the private fly fishing ecosystem. It connects landowners, fly fishing clubs, and individual anglers through tools for property management, membership operations, reservations, and access coordination \u2014 all in one place.',
  },
  {
    question: 'Who is AnglerPass for?',
    answer:
      'AnglerPass serves three core audiences: private landowners who want to manage water access professionally, fly fishing clubs that need membership and scheduling tools, and individual anglers looking to discover and book private fly fishing experiences.',
  },
  {
    question: 'Is the platform available yet?',
    answer:
      'Not yet. AnglerPass is currently under active development. We\u2019re building the platform with direct input from landowners, clubs, and experienced anglers. You can join the waitlist to get priority access and development updates as we approach launch.',
  },
  {
    question: 'Can landowners list private waters?',
    answer:
      'Yes. AnglerPass will include full property registration and listing tools. Landowners will be able to create professional profiles for their waters, define access rules, manage availability calendars, and control who can see and request access to their properties.',
  },
  {
    question: 'Can clubs manage memberships through AnglerPass?',
    answer:
      'Absolutely. The platform is being designed with clubs as a core user group. Membership management, digital rosters, access scheduling, reservation coordination, and member communication tools are all part of the product roadmap.',
  },
  {
    question: 'Will individual anglers be able to book directly?',
    answer:
      'That\u2019s the plan. AnglerPass will give anglers the ability to browse available private waters, view property details, and submit booking or access requests. The specifics of the booking flow will depend on each landowner or club\u2019s preferences and access rules.',
  },
  {
    question: 'How do I join the waitlist?',
    answer:
      'You can sign up using the form on our homepage. Enter your name, email, and role (landowner, club, or angler), and we\u2019ll add you to our priority list. You\u2019ll receive updates on our development progress and an early invitation when we\u2019re ready to launch.',
  },
  {
    question: 'Can I request early access or become a pilot user?',
    answer:
      'Yes. If you\u2019re a landowner with private water to manage, a club looking for better operations tools, or an angler interested in helping shape the platform, we\u2019d welcome the conversation. Reach out through the contact page or email us directly.',
  },
  {
    question: 'How much will AnglerPass cost?',
    answer:
      'Pricing is still being finalized. We\u2019re designing a model that works for all three user groups \u2014 landowners, clubs, and anglers. Waitlist members will be the first to learn about pricing and may have access to early-adopter rates. Stay tuned for announcements.',
  },
  {
    question: 'How does AnglerPass handle my data and privacy?',
    answer:
      'We take data privacy seriously. Personal information is never shared with third parties without your explicit consent. Landowners control who can see their property details, and all communication is managed within the platform. Our full privacy policy will be published before launch.',
  },
  {
    question: 'Where will AnglerPass be available?',
    answer:
      'We\u2019re launching initially in the western United States, where private water access is most established. Expansion plans include the broader U.S. and eventually international markets. If you\u2019re outside our initial launch area, joining the waitlist helps us prioritize new regions.',
  },
];

export default function FaqAccordion() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {faqItems.map((item, i) => (
        <AccordionItem
          key={i}
          value={`faq-${i}`}
          className="border-parchment"
        >
          <AccordionTrigger className="py-5 text-left font-heading text-lg font-semibold text-forest hover:no-underline sm:text-xl">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-base leading-relaxed text-text-secondary">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
