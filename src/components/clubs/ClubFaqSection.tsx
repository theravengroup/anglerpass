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
        </Accordion>
      </div>
    </section>
  );
}
