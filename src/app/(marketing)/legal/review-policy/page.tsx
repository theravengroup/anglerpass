import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Review Moderation Policy — AnglerPass",
  description:
    "How AnglerPass moderates verified trip reviews: what gets removed, what stays, flagging process, and response commitments.",
  openGraph: {
    title: "Review Moderation Policy — AnglerPass",
    description:
      "How AnglerPass moderates verified trip reviews: what gets removed, what stays, and our response commitments.",
  },
};

const sectionHeadingClass =
  "font-heading text-[24px] font-semibold text-forest mb-5 tracking-[-0.2px]";
const subHeadingClass = "text-[15px] font-semibold text-forest mb-2 mt-6";
const textClass = "text-[14.5px] leading-[1.75] text-text-secondary mb-3";

export default function ReviewPolicyPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest-deep pt-[160px] pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(154,115,64,0.1),_transparent_60%)]" />
        <div className="relative mx-auto max-w-[800px] px-8 text-center">
          <span className="mb-5 inline-block font-mono text-[11px] uppercase tracking-[0.2em] text-bronze-light">
            Trust &amp; Safety
          </span>
          <h1 className="mb-6 font-heading text-[clamp(38px,5vw,58px)] font-medium leading-[1.1] tracking-[-0.5px] text-parchment">
            Review Moderation Policy
          </h1>
          <p className="mx-auto max-w-[560px] text-[17px] leading-[1.7] text-parchment/60">
            How we protect the integrity of verified trip reviews on
            AnglerPass. Last updated April 2026.
          </p>
        </div>
      </section>

      {/* Table of contents */}
      <section className="bg-offwhite pt-[60px]">
        <div className="mx-auto max-w-[760px] px-8">
          <nav className="rounded-[14px] border border-parchment bg-white px-7 py-6">
            <h2 className="mb-3 text-[14px] font-semibold text-forest">
              On this page
            </h2>
            <ul className="m-0 list-none p-0">
              {[
                { href: "#overview", label: "Overview" },
                { href: "#what-gets-removed", label: "What Gets Removed" },
                {
                  href: "#what-we-do-not-remove",
                  label: "What We Do Not Remove",
                },
                { href: "#who-can-flag", label: "Who Can Flag a Review" },
                {
                  href: "#response-commitment",
                  label: "Our Response Commitment",
                },
                { href: "#responses", label: "Landowner & Club Responses" },
                { href: "#appeals", label: "Appeals" },
              ].map((item) => (
                <li key={item.href} className="mb-[6px]">
                  <a
                    href={item.href}
                    className="text-[14px] text-river no-underline"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      {/* Policy content */}
      <section className="bg-offwhite pt-[60px] pb-[120px]">
        <div className="mx-auto max-w-[760px] px-8">
          {/* Overview */}
          <div id="overview" className="mb-16 scroll-mt-[120px]">
            <h2 className={sectionHeadingClass}>Overview</h2>
            <p className={textClass}>
              Verified trip reviews are the foundation of trust on AnglerPass.
              Our moderation policy exists to protect the integrity of that
              system&nbsp;&mdash; not to manage anyone&rsquo;s reputation.
            </p>
          </div>

          {/* What gets removed */}
          <div id="what-gets-removed" className="mb-16 scroll-mt-[120px]">
            <h2 className={sectionHeadingClass}>What Gets Removed</h2>
            <p className={textClass}>We remove reviews that contain:</p>
            <ul className={`${textClass} pl-5`}>
              <li className="mb-[6px]">
                Threats or threatening language directed at any individual or
                property
              </li>
              <li className="mb-[6px]">Hate speech of any kind</li>
              <li className="mb-[6px]">
                Personal identifying information about any individual (doxxing)
              </li>
              <li className="mb-[6px]">
                Admissions of trespass, poaching, or illegal conduct on the
                property
              </li>
              <li className="mb-[6px]">
                Content that is purely political or entirely unrelated to the
                trip or property
              </li>
              <li className="mb-[6px]">
                Extortion attempts, including implied threats to post negative
                reviews unless a refund is issued
              </li>
              <li className="mb-[6px]">
                Content that is factually impossible based on the verified
                booking record
              </li>
            </ul>
          </div>

          {/* What we do not remove */}
          <div id="what-we-do-not-remove" className="mb-16 scroll-mt-[120px]">
            <h2 className={sectionHeadingClass}>What We Do Not Remove</h2>
            <p className={textClass}>
              We do not remove reviews because:
            </p>
            <ul className={`${textClass} pl-5`}>
              <li className="mb-[6px]">
                A landowner or club finds the review unflattering
              </li>
              <li className="mb-[6px]">
                A review is negative but honest and relevant
              </li>
              <li className="mb-[6px]">
                A review is critical of access, water conditions, or
                communication from the property
              </li>
            </ul>
            <p className={textClass}>
              Negative reviews that reflect real experiences are exactly what
              the system is for.
            </p>
          </div>

          {/* Who can flag */}
          <div id="who-can-flag" className="mb-16 scroll-mt-[120px]">
            <h2 className={sectionHeadingClass}>Who Can Flag a Review</h2>
            <p className={textClass}>
              Landowners and club administrators associated with a property may
              flag any review on that property. Flagging places a review in our
              moderation queue. It does not suppress or remove the review.
            </p>
          </div>

          {/* Response commitment */}
          <div id="response-commitment" className="mb-16 scroll-mt-[120px]">
            <h2 className={sectionHeadingClass}>
              Our Response Commitment
            </h2>
            <p className={textClass}>
              Every flagged review will be acknowledged within 24 hours. A
              final decision will be issued within 72 hours of the flag being
              submitted.
            </p>
          </div>

          {/* Landowner and club responses */}
          <div id="responses" className="mb-16 scroll-mt-[120px]">
            <h2 className={sectionHeadingClass}>
              Landowner &amp; Club Responses
            </h2>
            <p className={textClass}>
              Landowners and club administrators may post one public response
              to any review on their property. Responses may be edited for up
              to 24 hours after posting. After that, they are locked.
            </p>
          </div>

          {/* Appeals */}
          <div id="appeals" className="mb-16 scroll-mt-[120px]">
            <h2 className={sectionHeadingClass}>Appeals</h2>
            <p className={textClass}>
              If you believe a moderation decision was made in error, contact{" "}
              <a
                href="mailto:support@anglerpass.com"
                className="text-river no-underline"
              >
                support@anglerpass.com
              </a>{" "}
              with the subject line:{" "}
              <strong>Review Moderation Appeal</strong>.
            </p>
          </div>

          {/* Back link */}
          <div className="border-t border-parchment pt-8">
            <Link
              href="/policies"
              className="text-[14px] text-river no-underline"
            >
              &larr; Back to Platform Policies
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
