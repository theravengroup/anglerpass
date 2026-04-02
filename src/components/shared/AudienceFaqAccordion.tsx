"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqItem {
  q: string;
  a: string;
}

interface AudienceFaqAccordionProps {
  faqs: FaqItem[];
}

/**
 * Accordion-style FAQ list for marketing audience pages.
 *
 * Matches the branded marketing look: Cormorant Garamond headings in forest,
 * DM Sans body text, parchment dividers. Used on landowners, clubs, anglers,
 * and guides pages.
 */
export default function AudienceFaqAccordion({
  faqs,
}: AudienceFaqAccordionProps) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((faq, i) => (
        <AccordionItem
          key={i}
          value={`faq-${i}`}
          className={i < faqs.length - 1 ? "border-b border-parchment" : "border-b-0"}
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
  );
}
