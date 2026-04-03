"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronDown } from "lucide-react";
import MigrationForm from "./MigrationForm";

const faqs = [
  {
    value: "pricing",
    q: "How does club pricing work?",
    a: "Your monthly subscription covers the platform. You set your own initiation fees and annual dues \u2014 we add a 3.5% processing fee at checkout, paid by the member, to cover payment processing. Your club receives 100% of your stated fees.",
  },
  {
    value: "vetting",
    q: "How does the member vetting process work?",
    a: "You control your own membership criteria. When someone applies to join your club, you review their application and decide whether to approve, decline, or request more information. AnglerPass provides the tools \u2014 your club sets the standards. This vetting is what earns landowner trust and unlocks access to private water for your members.",
  },
  {
    value: "property-access",
    q: "How do we get access to private water for our members?",
    a: "Landowners list their properties on AnglerPass and choose which clubs can offer their water. You can browse available properties and request access on behalf of your club. Once a landowner approves your club, your members can view and book fishing days on that property. The more properties you secure, the more value your membership offers.",
  },
  {
    value: "cross-club",
    q: "What is cross-club access and how does it work?",
    a: "Clubs on the Standard or Pro tier can opt in to reciprocal access agreements with other clubs. When two clubs agree, their members can book water managed by either club. This expands your members\u2019 options without you needing to negotiate directly with additional landowners. You choose which clubs to partner with and can revoke agreements at any time.",
  },
  {
    value: "corporate",
    q: "Can we offer corporate memberships?",
    a: "Yes. Clubs can enable corporate memberships and set a separate initiation fee for corporate partners. Companies pay the corporate initiation fee, and their employees can then join your club as corporate employee members \u2014 typically with no individual initiation fee. It\u2019s a great way to grow your membership and offer a unique benefit to local businesses.",
  },
  {
    value: "staff",
    q: "Can I add staff to help manage the club?",
    a: "Yes. Club owners can invite staff members who get access to the management dashboard. Staff can review member applications, manage bookings, and handle day-to-day operations. Only the club owner can manage billing, subscription tier, and staff permissions.",
  },
  {
    value: "tiers",
    q: "What are the differences between subscription tiers?",
    a: "AnglerPass offers three tiers: Starter, Standard, and Pro. Higher tiers unlock features like cross-club access agreements, corporate memberships, priority support, and higher member limits. All tiers include the core club management tools, member vetting, and property access requests. You can upgrade your tier at any time as your club grows.",
  },
  {
    value: "payouts",
    q: "When does our club get paid?",
    a: "Club commissions ($5 per rod per booking) are paid out monthly on the 1st via Stripe Connect, after a 7-day post-trip hold period. This aligns with how most clubs already handle their accounting. Membership dues and initiation fees are transferred to your club\u2019s Stripe account as they are collected, minus the 3.5% processing fee.",
  },
  {
    value: "guides",
    q: "How do guides work with our club?",
    a: "Guides on AnglerPass are independent professionals who request access to specific properties. You can approve or deny guide access to any water your club manages. When your members book a trip, they can optionally add an approved guide. Guides set their own rates and are paid directly \u2014 the club is not involved in guide compensation.",
  },
  {
    value: "getting-started",
    q: "How do I get my club set up on AnglerPass?",
    a: "Once AnglerPass launches, you\u2019ll choose your subscription tier and fill out your club profile with a name, description, location, and rules. From there you can start inviting members, requesting property access, and customizing your initiation fees and dues. Most clubs will be fully operational within a day or two.",
  },
];

export default function ClubFaqSection() {
  const [migrationOpen, setMigrationOpen] = useState(false);

  return (
    <section className="bg-parchment-light py-[100px]">
      <div className="mx-auto max-w-[700px] px-8">
        {/* Eyebrow + Heading */}
        <div className="reveal mb-14 text-center">
          <span className="mb-3 inline-block font-mono text-[11px] uppercase tracking-[0.2em] text-river">
            FAQ
          </span>
          <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium tracking-[-0.3px] text-forest mb-4">
            Common questions
          </h2>
        </div>

        {/* Accordion */}
        <Accordion type="single" collapsible className="w-full">
          {/* FAQ 1 — Pricing */}
          <AccordionItem
            value="pricing"
            className="border-b border-parchment"
          >
            <AccordionTrigger className="py-6 font-heading text-[18px] font-semibold tracking-[-0.2px] text-forest hover:no-underline">
              {faqs[0].q}
            </AccordionTrigger>
            <AccordionContent className="text-[14.5px] leading-[1.7] text-text-secondary">
              {faqs[0].a}
            </AccordionContent>
          </AccordionItem>

          {/* FAQ 2 — Migration (special: nested toggle) */}
          <AccordionItem
            value="migration"
            className="border-b border-parchment"
          >
            <AccordionTrigger className="py-6 font-heading text-[18px] font-semibold tracking-[-0.2px] text-forest hover:no-underline">
              How do I get my existing members onto AnglerPass?
            </AccordionTrigger>
            <AccordionContent className="text-[14.5px] leading-[1.7] text-text-secondary">
              <p>
                Your members don&rsquo;t start from scratch &mdash; and neither
                do you. AnglerPass offers a hands-on migration service to move
                your existing membership data into the platform. Costs vary
                depending on where your data currently lives. Clubs committing
                to a 3-year AnglerPass plan may qualify for completely free
                migration if their data meets certain criteria.
              </p>

              <button
                type="button"
                onClick={() => setMigrationOpen((prev) => !prev)}
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-river transition-colors hover:text-river-light"
              >
                Learn more about migration
                <ChevronDown
                  className={`size-4 transition-transform duration-200 ${
                    migrationOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {migrationOpen && <MigrationForm />}
            </AccordionContent>
          </AccordionItem>

          {/* Remaining FAQs */}
          {faqs.slice(1).map((faq, i) => (
            <AccordionItem
              key={faq.value}
              value={faq.value}
              className={
                i < faqs.length - 2
                  ? "border-b border-parchment"
                  : "border-b-0"
              }
            >
              <AccordionTrigger className="py-6 font-heading text-[18px] font-semibold tracking-[-0.2px] text-forest hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-[14.5px] leading-[1.7] text-text-secondary">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
