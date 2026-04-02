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

export default function ClubFaqSection() {
  const [migrationOpen, setMigrationOpen] = useState(false);

  return (
    <section className="bg-parchment-light py-24">
      <div className="mx-auto max-w-[700px] px-8">
        {/* Eyebrow + Heading */}
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-river">
            Questions
          </span>
          <h2 className="font-[family-name:var(--font-heading)] text-[clamp(28px,3.5vw,40px)] font-medium leading-tight tracking-tight text-forest">
            Common Questions
          </h2>
        </div>

        {/* Accordion */}
        <Accordion type="single" collapsible className="w-full">
          {/* FAQ 1 — Pricing */}
          <AccordionItem
            value="pricing"
            className="border-b border-stone-light/30"
          >
            <AccordionTrigger className="text-base font-medium text-text-primary hover:no-underline">
              How does club pricing work?
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-text-secondary">
              Your monthly subscription covers the platform. You set your own
              initiation fees and annual dues &mdash; we add a 3.5% processing
              fee at checkout, paid by the member, to cover payment processing.
              Your club receives 100% of your stated fees.
            </AccordionContent>
          </AccordionItem>

          {/* FAQ 2 — Migration */}
          <AccordionItem
            value="migration"
            className="border-b border-stone-light/30"
          >
            <AccordionTrigger className="text-base font-medium text-text-primary hover:no-underline">
              How do I get my existing members onto AnglerPass?
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-text-secondary">
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

          {/* FAQ 3 — Member vetting */}
          <AccordionItem
            value="vetting"
            className="border-b border-stone-light/30"
          >
            <AccordionTrigger className="text-base font-medium text-text-primary hover:no-underline">
              How does the member vetting process work?
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-text-secondary">
              You control your own membership criteria. When someone applies
              to join your club, you review their application and decide
              whether to approve, decline, or request more information.
              AnglerPass provides the tools &mdash; your club sets the
              standards. This vetting is what earns landowner trust and
              unlocks access to private water for your members.
            </AccordionContent>
          </AccordionItem>

          {/* FAQ 4 — Property access */}
          <AccordionItem
            value="property-access"
            className="border-b border-stone-light/30"
          >
            <AccordionTrigger className="text-base font-medium text-text-primary hover:no-underline">
              How do we get access to private water for our members?
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-text-secondary">
              Landowners list their properties on AnglerPass and choose which
              clubs can offer their water. You can browse available properties
              and request access on behalf of your club. Once a landowner
              approves your club, your members can view and book fishing days
              on that property. The more properties you secure, the more
              value your membership offers.
            </AccordionContent>
          </AccordionItem>

          {/* FAQ 5 — Cross-club */}
          <AccordionItem
            value="cross-club"
            className="border-b border-stone-light/30"
          >
            <AccordionTrigger className="text-base font-medium text-text-primary hover:no-underline">
              What is cross-club access and how does it work?
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-text-secondary">
              Clubs on the Standard or Pro tier can opt in to reciprocal
              access agreements with other clubs. When two clubs agree, their
              members can book water managed by either club. This expands
              your members&rsquo; options without you needing to negotiate
              directly with additional landowners. You choose which clubs to
              partner with and can revoke agreements at any time.
            </AccordionContent>
          </AccordionItem>

          {/* FAQ 6 — Corporate memberships */}
          <AccordionItem
            value="corporate"
            className="border-b border-stone-light/30"
          >
            <AccordionTrigger className="text-base font-medium text-text-primary hover:no-underline">
              Can we offer corporate memberships?
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-text-secondary">
              Yes. Clubs can enable corporate memberships and set a separate
              initiation fee for corporate partners. Companies pay the
              corporate initiation fee, and their employees can then join
              your club as corporate employee members &mdash; typically with
              no individual initiation fee. It&rsquo;s a great way to grow
              your membership and offer a unique benefit to local businesses.
            </AccordionContent>
          </AccordionItem>

          {/* FAQ 7 — Staff and permissions */}
          <AccordionItem
            value="staff"
            className="border-b border-stone-light/30"
          >
            <AccordionTrigger className="text-base font-medium text-text-primary hover:no-underline">
              Can I add staff to help manage the club?
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-text-secondary">
              Yes. Club owners can invite staff members who get access to the
              management dashboard. Staff can review member applications,
              manage bookings, and handle day-to-day operations. Only the
              club owner can manage billing, subscription tier, and staff
              permissions.
            </AccordionContent>
          </AccordionItem>

          {/* FAQ 8 — Subscription tiers */}
          <AccordionItem
            value="tiers"
            className="border-b border-stone-light/30"
          >
            <AccordionTrigger className="text-base font-medium text-text-primary hover:no-underline">
              What are the differences between subscription tiers?
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-text-secondary">
              AnglerPass offers three tiers: Starter, Standard, and Pro.
              Higher tiers unlock features like cross-club access agreements,
              corporate memberships, priority support, and higher member
              limits. All tiers include the core club management tools,
              member vetting, and property access requests. You can upgrade
              your tier at any time as your club grows.
            </AccordionContent>
          </AccordionItem>

          {/* FAQ 9 — Guides */}
          <AccordionItem
            value="guides"
            className="border-b border-stone-light/30"
          >
            <AccordionTrigger className="text-base font-medium text-text-primary hover:no-underline">
              How do guides work with our club?
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-text-secondary">
              Guides on AnglerPass are independent professionals who request
              access to specific properties. You can approve or deny guide
              access to any water your club manages. When your members book a
              trip, they can optionally add an approved guide. Guides set
              their own rates and are paid directly &mdash; the club is not
              involved in guide compensation.
            </AccordionContent>
          </AccordionItem>

          {/* FAQ 10 — Getting started */}
          <AccordionItem
            value="getting-started"
            className="border-b border-stone-light/30"
          >
            <AccordionTrigger className="text-base font-medium text-text-primary hover:no-underline">
              How do I get my club set up on AnglerPass?
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-text-secondary">
              Sign up, choose your subscription tier, and fill out your
              club profile with a name, description, location, and rules.
              From there you can start inviting members, requesting property
              access, and customizing your initiation fees and dues. Most
              clubs are fully operational within a day or two of signing up.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}
