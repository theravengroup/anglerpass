import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — AnglerPass',
  description:
    'How AnglerPass collects, uses, and protects your personal information. Privacy policy for landowners, clubs, anglers, and guides.',
  openGraph: {
    title: 'Privacy Policy — AnglerPass',
    description:
      'How AnglerPass collects, uses, and protects your personal information.',
  },
};

const sectionClass = 'mb-12 scroll-mt-28';
const headingClass = 'font-heading text-[clamp(20px,2.5vw,24px)] font-semibold leading-[1.2] text-forest mb-4 tracking-[-0.2px]';
const textClass = 'text-[14.5px] leading-[1.8] text-text-secondary mb-3';
const listClass = `${textClass} ap-list`;
const listItemClass = 'mb-2.5';

export default function PrivacyPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest-deep pt-[160px] pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(154,115,64,0.1),_transparent_60%)]" />
        <div className="relative mx-auto max-w-[800px] px-8 text-center">
          <span className="mb-5 inline-block font-mono text-[11px] uppercase tracking-[0.2em] text-bronze-light">
            Legal
          </span>
          <h1 className="mb-6 font-heading text-[clamp(38px,5vw,58px)] font-medium leading-[1.1] tracking-[-0.5px] text-parchment">
            Privacy Policy
          </h1>
          <p className="mx-auto max-w-[560px] text-[17px] leading-[1.7] text-parchment/60">
            How AnglerPass collects, uses, and protects your personal
            information. Last updated April 2026.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-offwhite py-16 lg:py-20">
        <div className="mx-auto max-w-[760px] px-8">
          <p className={textClass}>
            AnglerPass is operated by Angler Pass, LLC (&ldquo;we,&rdquo;
            &ldquo;us,&rdquo; &ldquo;our&rdquo;). We take your privacy
            seriously. This policy explains what data we collect, how we use
            it, and your rights regarding that data.
          </p>

          {/* Information we collect */}
          <div className={sectionClass}>
            <h2 className={headingClass}>Information we collect</h2>

            <p className={textClass}>
              <strong>Account information.</strong>{' '}When you create an account,
              we collect your name, email address, password, and role (angler,
              landowner, club manager, or guide). You may also provide a display
              name, bio, location, fishing experience level, and favorite species.
            </p>

            <p className={textClass}>
              <strong>Profile photos and media.</strong>{' '}You may upload a profile
              photo, club logo, or property photos. Uploaded images are
              automatically resized and converted to WebP format for performance.
              Images are stored in our cloud infrastructure.
            </p>

            <p className={textClass}>
              <strong>Guide verification data.</strong>{' '}Guides who apply for
              verification provide professional credentials including state guide
              licenses, liability insurance certificates, first aid
              certifications, and USCG licenses where applicable. As part of the
              mandatory background check, personal information &mdash; including
              legal name, date of birth, Social Security number, and address
              &mdash; is collected directly by our background check provider
              (Checkr) through their secure hosted flow. AnglerPass does not
              directly collect or store Social Security numbers. We receive only
              the verification result (clear, consider, or suspended) and a
              candidate identifier.
            </p>

            <p className={textClass}>
              <strong>Financial information.</strong>{' '}Payment processing and
              payouts are handled entirely by Stripe. When you pay a verification
              fee, booking fee, club dues, or any other charge, your payment
              details are collected directly by Stripe. Landowners, clubs, and
              guides who receive payouts connect a bank account through Stripe
              Connect. AnglerPass does not store credit card numbers or bank
              account details on our servers.
            </p>

            <p className={textClass}>
              <strong>Booking and trip data.</strong>{' '}We collect information about
              bookings you make or receive, including dates, locations,
              participants, rod fees, and guide rates. After a trip, anglers may
              submit reviews that are stored and displayed on the platform.
            </p>

            <p className={textClass}>
              <strong>Property and listing data.</strong>{' '}Landowners provide
              property details including name, description, location, water types,
              photos, availability calendars, and pricing. Clubs provide club
              profiles, membership rules, dues structures, and property access
              configurations.
            </p>

            <p className={textClass}>
              <strong>Phone number.</strong>{' '}If you opt in to SMS notifications,
              we collect your mobile phone number. Your phone number is used
              solely for sending platform-related text messages and is never
              shared with third parties for marketing purposes.
            </p>

            <p className={textClass}>
              <strong>Communications and preferences.</strong>{' '}We store your
              notification preferences (which email and SMS notifications you opt
              into or out of) and any messages sent through the platform.
            </p>
          </div>

          {/* How we use your data */}
          <div className={sectionClass}>
            <h2 className={headingClass}>How we use your data</h2>
            <p className={textClass}>
              We use your information to operate the AnglerPass platform,
              including: authenticating your identity, displaying your profile to
              other users, processing bookings and payments, verifying guide
              credentials, sending transactional emails and SMS messages (booking
              confirmations, trip reminders, credential expiry warnings, payout
              notifications), and enforcing platform policies. We do not sell,
              rent, or share your personal information with third parties for
              marketing purposes.
            </p>
          </div>

          {/* Automated processing */}
          <div className={sectionClass}>
            <h2 className={headingClass}>Automated processing</h2>
            <p className={textClass}>
              AnglerPass uses automated systems to monitor guide credential
              expiration dates. When a credential approaches expiry, we send
              reminder notifications at 60, 30, and 7 days. If a credential
              expires, the guide&rsquo;s profile is automatically suspended until
              renewed credentials are uploaded. Guides whose credentials are
              renewed are automatically reinstated. These automated actions are
              logged and can be reviewed by our team.
            </p>
          </div>

          {/* Background checks */}
          <div className={sectionClass}>
            <h2 className={headingClass}>
              Background checks &amp; FCRA compliance
            </h2>
            <p className={textClass}>
              Guide background checks are conducted by Checkr, Inc. in compliance
              with the Fair Credit Reporting Act (FCRA). Checkr&rsquo;s hosted
              flow handles all required disclosures, consent collection, and
              adverse action procedures. Guides have the right to dispute
              background check results directly with Checkr. AnglerPass receives
              only summary results, not the underlying report details. For more
              information, see{' '}
              <a
                href="https://checkr.com/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-river underline"
              >
                Checkr&rsquo;s Privacy Policy
              </a>
              .
            </p>
          </div>

          {/* Analytics & cookies */}
          <div className={sectionClass}>
            <h2 className={headingClass}>Analytics &amp; cookies</h2>
            <p className={textClass}>
              We use privacy-respecting analytics to understand how visitors use
              AnglerPass. We use minimal cookies required for site functionality
              and authentication. We do not use advertising cookies, tracking
              pixels, or third-party marketing tools. We do not build advertising
              profiles.
            </p>
          </div>

          {/* SMS communications */}
          <div className={sectionClass}>
            <h2 className={headingClass}>SMS communications</h2>
            <p className={textClass}>
              AnglerPass offers optional SMS (text message) notifications for
              booking confirmations, trip reminders, gate code delivery, review
              prompts, and account alerts. SMS is strictly opt-in &mdash; we will
              never send text messages unless you have expressly consented.
            </p>
            <p className={textClass}>
              <strong>Consent.</strong>{' '}By providing your phone number and
              checking the SMS consent box, you agree to receive text messages
              from AnglerPass at the number provided. Consent is not a condition
              of using the platform or making a purchase.
            </p>
            <p className={textClass}>
              <strong>Message frequency.</strong>{' '}Message frequency varies based
              on your booking activity. You may receive messages for booking
              confirmations, pre-trip reminders, morning-of access details,
              post-trip review prompts, and account notifications.
            </p>
            <p className={textClass}>
              <strong>Opting out.</strong>{' '}You may opt out at any time by
              replying STOP to any message, or by toggling off SMS notifications
              in your{' '}
              <a href="/dashboard/settings" className="text-river underline">
                account settings
              </a>
              . After opting out, you will receive one final confirmation message
              and no further texts.
            </p>
            <p className={textClass}>
              <strong>Message and data rates.</strong>{' '}Standard message and data
              rates from your wireless carrier may apply. AnglerPass does not
              charge for SMS messages.
            </p>
            <p className={textClass}>
              <strong>Supported carriers.</strong>{' '}SMS is supported on all major
              U.S. carriers including AT&amp;T, T-Mobile, Verizon, and US
              Cellular. Carriers are not liable for delayed or undelivered
              messages.
            </p>
            <p className={textClass}>
              <strong>Consent records.</strong>{' '}We retain a record of your SMS
              consent, including the date and time of opt-in, the disclosure text
              you agreed to, and your IP address at the time of consent, as
              required by the Telephone Consumer Protection Act (TCPA). These
              records are retained even after you opt out.
            </p>
            <p className={textClass}>
              For questions about SMS, contact{' '}
              <a
                href="mailto:support@anglerpass.com"
                className="text-river underline"
              >
                support@anglerpass.com
              </a>
              .
            </p>
          </div>

          {/* Third-party services */}
          <div className={sectionClass}>
            <h2 className={headingClass}>Third-party services</h2>
            <p className={textClass}>
              AnglerPass relies on the following third-party services, each with
              its own privacy policy:
            </p>
            <ul className={listClass}>
              <li className={listItemClass}>
                <strong>Vercel</strong> &mdash; hosting and deployment
              </li>
              <li className={listItemClass}>
                <strong>Supabase</strong> &mdash; authentication, database, and
                file storage
              </li>
              <li className={listItemClass}>
                <strong>Stripe</strong> &mdash; payment processing, payouts via
                Stripe Connect
              </li>
              <li className={listItemClass}>
                <strong>Checkr</strong> &mdash; background checks for guide
                verification
              </li>
              <li className={listItemClass}>
                <strong>Twilio</strong> &mdash; SMS message delivery (if you opt
                in to text notifications)
              </li>
              <li className={listItemClass}>
                <strong>Resend</strong> &mdash; transactional email delivery
              </li>
            </ul>
          </div>

          {/* Data retention */}
          <div className={sectionClass}>
            <h2 className={headingClass}>Data retention</h2>
            <p className={textClass}>
              Account data is retained for as long as your account is active.
              Booking records, reviews, and financial transaction logs are
              retained for 7 years for legal and tax compliance. Background check
              results are retained for the duration of a guide&rsquo;s active
              status plus 1 year. Uploaded credentials and photos are deleted when
              you remove them or delete your account, subject to any legal
              retention requirements.
            </p>
          </div>

          {/* Your data rights */}
          <div className={sectionClass}>
            <h2 className={headingClass}>Your data rights</h2>
            <p className={textClass}>
              You may request access to, correction of, or deletion of your
              personal information by contacting us at{' '}
              <a
                href="mailto:privacy@anglerpass.com"
                className="text-river underline"
              >
                privacy@anglerpass.com
              </a>
              . We will respond within 30 days. Note that some data may be
              retained as required by law (e.g., financial records, background
              check logs). If you are a California resident, you have additional
              rights under the CCPA, including the right to know what data we
              collect and the right to opt out of data sales (we do not sell
              data).
            </p>
          </div>

          {/* Changes */}
          <div className={sectionClass}>
            <h2 className={headingClass}>Changes to this policy</h2>
            <p className={textClass}>
              If we make material changes to this policy, we&rsquo;ll notify
              registered users by email and update the date at the top. We will
              never introduce advertising or sell user data &mdash; that is a core
              commitment of the AnglerPass platform.
            </p>
          </div>

          {/* Footer links */}
          <div className="border-t border-parchment pt-8">
            <p className="text-[14px] text-text-light">
              See also our{' '}
              <a href="/terms" className="text-river underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/policies" className="text-river underline">
                Platform Policies
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
