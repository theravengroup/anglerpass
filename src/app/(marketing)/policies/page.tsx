import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Policies — AnglerPass',
  description:
    'Platform policies for AnglerPass: membership terms, cancellation policy, refund schedule, renewal grace periods, and booking rules.',
  openGraph: {
    title: 'Policies — AnglerPass',
    description:
      'Platform policies for membership, cancellations, refunds, and renewals on AnglerPass.',
  },
};

const sectionHeadingStyle = {
  fontFamily: 'var(--font-heading)',
  fontSize: 24,
  fontWeight: 600 as const,
  color: 'var(--color-forest)',
  marginBottom: 20,
  letterSpacing: '-.2px',
};

const subHeadingStyle = {
  fontSize: 15,
  fontWeight: 600 as const,
  color: 'var(--color-forest)',
  marginBottom: 8,
  marginTop: 24,
};

const textStyle = {
  fontSize: 14.5,
  lineHeight: 1.75,
  color: 'var(--color-text-secondary)',
  margin: '0 0 12px',
};

export default function PoliciesPage() {
  return (
    <>
      {/* Hero */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--color-forest-deep)',
          padding: '160px 0 80px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at bottom left, rgba(154,115,64,0.1), transparent 60%)',
          }}
        />
        <div style={{ position: 'relative', maxWidth: 800, margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
          <span
            style={{
              display: 'inline-block',
              marginBottom: 20,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: 'var(--color-bronze-light)',
            }}
          >
            Policies
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(38px, 5vw, 58px)',
              fontWeight: 500,
              lineHeight: 1.1,
              color: 'var(--color-parchment)',
              letterSpacing: '-.5px',
              margin: '0 0 24px',
            }}
          >
            Platform Policies
          </h1>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.7,
              color: 'rgba(240,234,214,.6)',
              maxWidth: 560,
              margin: '0 auto',
            }}
          >
            Clear rules for memberships, bookings, cancellations, and payments.
            Last updated March 2026.
          </p>
        </div>
      </section>

      {/* Table of contents */}
      <section style={{ padding: '60px 0 0', background: 'var(--color-offwhite)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 32px' }}>
          <nav
            style={{
              background: '#fff',
              border: '1px solid var(--color-parchment)',
              borderRadius: 14,
              padding: '24px 28px',
            }}
          >
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-forest)', marginBottom: 12 }}>
              On this page
            </h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {[
                { href: '#membership', label: 'Membership & Applications' },
                { href: '#dues', label: 'Dues & Renewals' },
                { href: '#cancellations', label: 'Membership Cancellations' },
                { href: '#removals', label: 'Club-Initiated Removal' },
                { href: '#rejoining', label: 'Rejoining a Club' },
                { href: '#payments', label: 'Payment Processing' },
                { href: '#bookings', label: 'Booking Cancellations & Refunds' },
                { href: '#guide-services', label: 'Guide Services' },
                { href: '#guest-policy', label: 'Guest Policy' },
                { href: '#club-subscriptions', label: 'Club Subscriptions' },
              ].map((item) => (
                <li key={item.href} style={{ marginBottom: 6 }}>
                  <a
                    href={item.href}
                    style={{
                      fontSize: 14,
                      color: 'var(--color-river)',
                      textDecoration: 'none',
                    }}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      {/* Policy sections */}
      <section style={{ padding: '60px 0 120px', background: 'var(--color-offwhite)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 32px' }}>

          {/* Membership & Applications */}
          <div id="membership" style={{ marginBottom: 64, scrollMarginTop: 120 }}>
            <h2 style={sectionHeadingStyle}>Membership &amp; Applications</h2>
            <p style={textStyle}>
              Clubs on AnglerPass manage their own membership. Each club sets its own
              initiation fee and annual dues. Membership is not open enrollment &mdash;
              prospective members submit an application, and the club&rsquo;s administrators
              review and approve or decline each application.
            </p>

            <h3 style={subHeadingStyle}>Application process</h3>
            <ol style={{ ...textStyle, paddingLeft: 20, margin: '0 0 12px' }}>
              <li style={{ marginBottom: 6 }}>Angler submits a membership application through AnglerPass.</li>
              <li style={{ marginBottom: 6 }}>Club administrators review the application and may request additional information.</li>
              <li style={{ marginBottom: 6 }}>Club approves or declines the application.</li>
              <li style={{ marginBottom: 6 }}>If approved, the applicant is prompted to pay the initiation fee (if any) and first year&rsquo;s dues.</li>
              <li style={{ marginBottom: 6 }}>Once payment is confirmed, the membership becomes active.</li>
            </ol>

            <h3 style={subHeadingStyle}>Withdrawal</h3>
            <p style={textStyle}>
              Applicants may withdraw a pending application at any time before it is approved.
              Once approved and paid, the membership is subject to the club&rsquo;s policies.
            </p>

            <h3 style={subHeadingStyle}>Initiation fees</h3>
            <p style={textStyle}>
              Initiation fees are one-time, non-refundable payments made when joining a club.
              The amount is set entirely by the club. Initiation fees are not prorated.
            </p>
          </div>

          {/* Dues & Renewals */}
          <div id="dues" style={{ marginBottom: 64, scrollMarginTop: 120 }}>
            <h2 style={sectionHeadingStyle}>Dues &amp; Renewals</h2>
            <p style={textStyle}>
              Annual dues are billed once per year from the date of your initial membership
              payment. Dues auto-renew via the payment method on file.
            </p>

            <h3 style={subHeadingStyle}>Renewal process</h3>
            <p style={textStyle}>
              You will receive an email reminder before your annual renewal date. On the
              renewal date, we will charge the payment method on file for the current
              year&rsquo;s dues amount (plus the 3.5% processing fee).
            </p>

            <h3 style={subHeadingStyle}>Grace period</h3>
            <p style={textStyle}>
              If your payment fails on the renewal date, you have a <strong>7-day grace period</strong> to
              update your payment method. During the grace period, your membership remains
              active and you can continue to make bookings. If payment is not resolved within
              7 days, your membership will be marked as lapsed and booking access will be
              suspended until dues are paid.
            </p>

            <h3 style={subHeadingStyle}>Updating payment methods</h3>
            <p style={textStyle}>
              You can update your credit card or bank account information at any time through
              your account settings. We recommend keeping your payment information current
              to avoid interruptions to your membership.
            </p>

            <h3 style={subHeadingStyle}>Cancelling membership</h3>
            <p style={textStyle}>
              See <a href="#cancellations" style={{ color: 'var(--color-river)', textDecoration: 'underline' }}>Membership Cancellations</a> below
              for full details on voluntary cancellations, the 14-day undo window, and what
              happens to your bookings.
            </p>
          </div>

          {/* Membership Cancellations */}
          <div id="cancellations" style={{ marginBottom: 64, scrollMarginTop: 120 }}>
            <h2 style={sectionHeadingStyle}>Membership Cancellations</h2>
            <p style={textStyle}>
              Members may cancel their club membership at any time from their account settings.
              Cancellation does not take immediate effect &mdash; your membership remains fully
              active through the end of your current paid period.
            </p>

            <h3 style={subHeadingStyle}>What happens when you cancel</h3>
            <ul style={{ ...textStyle, paddingLeft: 20, margin: '0 0 12px' }}>
              <li style={{ marginBottom: 6 }}>Your membership remains active through the end of your current paid period.</li>
              <li style={{ marginBottom: 6 }}>Your annual dues subscription is cancelled &mdash; no further charges will be made.</li>
              <li style={{ marginBottom: 6 }}>Dues already paid are not refunded for partial years.</li>
              <li style={{ marginBottom: 6 }}>Any bookings scheduled after your membership end date will be automatically cancelled, and you will be notified.</li>
              <li style={{ marginBottom: 6 }}>Bookings within your remaining active period are unaffected.</li>
            </ul>

            <h3 style={subHeadingStyle}>14-day undo window</h3>
            <p style={textStyle}>
              Changed your mind? You have <strong>14 days</strong> from the date you initiated
              cancellation to reverse it. During this window, you can reactivate your membership
              from your account settings at no cost. After 14 days, the cancellation is final
              and your membership will end at the close of your paid period.
            </p>

            <h3 style={subHeadingStyle}>After cancellation takes effect</h3>
            <p style={textStyle}>
              Once your paid period ends, your membership status changes to cancelled. You will
              no longer be able to make bookings through that club. If you wish to rejoin in
              the future, see <a href="#rejoining" style={{ color: 'var(--color-river)', textDecoration: 'underline' }}>Rejoining a Club</a> below.
            </p>
          </div>

          {/* Club-Initiated Removal */}
          <div id="removals" style={{ marginBottom: 64, scrollMarginTop: 120 }}>
            <h2 style={sectionHeadingStyle}>Club-Initiated Removal</h2>
            <p style={textStyle}>
              Clubs may remove a member for cause at the discretion of the club&rsquo;s
              administrators. Removal is immediate and does not follow the same timeline as
              voluntary cancellation.
            </p>

            <h3 style={subHeadingStyle}>Grounds for removal</h3>
            <p style={textStyle}>
              Each club sets its own standards for member conduct. Common grounds for removal
              include violation of club rules, property rules, or fishing regulations;
              disrespectful behavior toward landowners, staff, or other members; damage to
              property; or any conduct that compromises the trust the club has built with its
              landowner partners.
            </p>

            <h3 style={subHeadingStyle}>Effect of removal</h3>
            <ul style={{ ...textStyle, paddingLeft: 20, margin: '0 0 12px' }}>
              <li style={{ marginBottom: 6 }}>Removal takes effect immediately. Access is revoked upon removal.</li>
              <li style={{ marginBottom: 6 }}>All future bookings are automatically cancelled and you will be notified.</li>
              <li style={{ marginBottom: 6 }}>There are no refunds or prorations of initiation fees or annual dues.</li>
              <li style={{ marginBottom: 6 }}>The annual dues subscription is cancelled immediately &mdash; no further charges will be made.</li>
              <li style={{ marginBottom: 6 }}>You will receive a notification with the reason for removal provided by the club.</li>
            </ul>

            <h3 style={subHeadingStyle}>Disputes</h3>
            <p style={textStyle}>
              If you believe you were removed in error, you may contact the club directly.
              AnglerPass does not adjudicate disputes between clubs and their members &mdash;
              clubs have full authority over their membership decisions.
            </p>
          </div>

          {/* Rejoining a Club */}
          <div id="rejoining" style={{ marginBottom: 64, scrollMarginTop: 120 }}>
            <h2 style={sectionHeadingStyle}>Rejoining a Club</h2>
            <p style={textStyle}>
              If you previously cancelled your membership and wish to rejoin the same club,
              you may do so without submitting a new application (you have already been vetted).
              However, a rejoin fee applies.
            </p>

            <h3 style={subHeadingStyle}>Rejoin fee</h3>
            <p style={textStyle}>
              The rejoin fee is <strong>50% of the club&rsquo;s current initiation fee</strong>. This
              is a one-time payment made at the time of rejoining, in addition to the current
              annual dues. The 3.5% processing fee applies to both the rejoin fee and the dues.
            </p>

            <h3 style={subHeadingStyle}>Example</h3>
            <p style={textStyle}>
              If a club&rsquo;s current initiation fee is $350 and annual dues are $175:
            </p>
            <ul style={{ ...textStyle, paddingLeft: 20, margin: '0 0 12px' }}>
              <li style={{ marginBottom: 6 }}>Rejoin fee: $175 (50% of $350) + $6.13 processing</li>
              <li style={{ marginBottom: 6 }}>Annual dues: $175 + $6.13 processing</li>
              <li style={{ marginBottom: 6 }}><strong>Total to rejoin: $362.26</strong></li>
            </ul>

            <h3 style={subHeadingStyle}>Removed members</h3>
            <p style={textStyle}>
              Members who were removed for cause by a club are not eligible to rejoin through
              AnglerPass. They must contact the club directly to discuss reinstatement. If the
              club agrees, they may facilitate the process through the platform.
            </p>
          </div>

          {/* Payment Processing */}
          <div id="payments" style={{ marginBottom: 64, scrollMarginTop: 120 }}>
            <h2 style={sectionHeadingStyle}>Payment Processing</h2>
            <p style={textStyle}>
              All payments on AnglerPass are processed securely through Stripe. AnglerPass
              does not store credit card numbers or bank account details directly.
            </p>

            <h3 style={subHeadingStyle}>Processing fee</h3>
            <p style={textStyle}>
              A <strong>3.5% processing fee</strong> is added to all membership payments (initiation
              fees and annual dues). This fee covers credit card and payment processing costs
              and is paid by the member at checkout. The club receives 100% of its stated
              initiation fee and annual dues.
            </p>

            <h3 style={subHeadingStyle}>Booking fees</h3>
            <p style={textStyle}>
              Fishing access bookings have a separate fee structure: a 15% platform fee on
              rod fees, plus a $10/rod cross-club fee when booking outside your home club.
              When a guide is added to a booking, a 10% service fee is applied to the guide&rsquo;s
              rate, paid by the angler. The guide receives 100% of their stated rate.
              See our{' '}
              <Link href="/pricing" style={{ color: 'var(--color-river)', textDecoration: 'underline' }}>
                pricing page
              </Link>{' '}
              for full details.
            </p>

            <h3 style={subHeadingStyle}>Payouts</h3>
            <p style={textStyle}>
              Clubs and landowners receive payouts through Stripe Connect. Payout timing
              follows Stripe&rsquo;s standard schedule (typically 2&ndash;7 business days
              depending on your country and account setup).
            </p>
          </div>

          {/* Booking Cancellations & Refunds */}
          <div id="bookings" style={{ marginBottom: 64, scrollMarginTop: 120 }}>
            <h2 style={sectionHeadingStyle}>Booking Cancellations &amp; Refunds</h2>
            <p style={textStyle}>
              Cancellation refunds for fishing access bookings follow a tiered schedule
              based on how far in advance the booking is cancelled.
            </p>

            <div
              style={{
                background: '#fff',
                border: '1px solid var(--color-parchment)',
                borderRadius: 10,
                overflow: 'hidden',
                marginTop: 16,
                marginBottom: 16,
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--color-parchment-light)' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--color-forest)' }}>
                      Cancellation window
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--color-forest)' }}>
                      Refund
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { window: '48+ hours before fishing date', refund: '100% refund' },
                    { window: '24\u201348 hours before fishing date', refund: '50% refund' },
                    { window: 'Less than 24 hours', refund: 'No refund' },
                  ].map((row) => (
                    <tr key={row.window} style={{ borderTop: '1px solid var(--color-parchment)' }}>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--color-text-secondary)' }}>
                        {row.window}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--color-text-secondary)' }}>
                        {row.refund}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p style={textStyle}>
              Refunds are processed back to the original payment method. Platform fees
              are refunded proportionally to the booking refund amount.
            </p>
          </div>

          {/* Guide Services */}
          <div id="guide-services" style={{ marginBottom: 64, scrollMarginTop: 120 }}>
            <h2 style={sectionHeadingStyle}>Guide Services</h2>
            <p style={textStyle}>
              Professional fly fishing guides can apply to join the AnglerPass platform
              as independent service providers. Guides are not employees of AnglerPass
              or any club on the platform.
            </p>

            <h3 style={subHeadingStyle}>Guide requirements</h3>
            <p style={textStyle}>
              All guides must submit credentials for verification before being approved
              to offer services on the platform. Required credentials include a valid
              state guide license, professional liability insurance, and current first
              aid certification. AnglerPass reviews all applications and may request
              additional documentation.
            </p>

            <h3 style={subHeadingStyle}>Water access approvals</h3>
            <p style={textStyle}>
              Approved guides may request access to guide on specific properties. Each
              request is reviewed by the club or landowner managing that water. Approval
              is at the sole discretion of the managing entity and may be revoked at any
              time.
            </p>

            <h3 style={subHeadingStyle}>Guide fees &amp; payouts</h3>
            <p style={textStyle}>
              There is no subscription or listing fee for guides. Guides set their own
              full-day and half-day rates. A 10% service fee is added on top of the
              guide&rsquo;s rate at checkout, paid by the angler. The guide receives 100%
              of their stated rate for each completed trip. Payouts are processed through
              Stripe Connect.
            </p>

            <h3 style={subHeadingStyle}>Cancellation &amp; guide payouts</h3>
            <p style={textStyle}>
              When an angler cancels a booking that includes a guide, the guide payout
              follows the same tiered refund schedule as the booking itself. Cancellations
              within 24 hours of the trip date result in a full guide payout. The guide&rsquo;s
              availability is automatically released upon cancellation.
            </p>

            <h3 style={subHeadingStyle}>Reviews</h3>
            <p style={textStyle}>
              After a guided trip, both the angler and guide may submit reviews within
              14 days. Reviews are revealed simultaneously once both parties have submitted,
              or after the 14-day window closes &mdash; whichever comes first. This mutual
              reveal system ensures honest, unbiased feedback.
            </p>
          </div>

          {/* Guest Policy */}
          <div id="guest-policy" style={{ marginBottom: 64, scrollMarginTop: 120 }}>
            <h2 style={sectionHeadingStyle}>Guest Policy</h2>
            <p style={textStyle}>
              Members may bring non-fishing guests to properties, subject to the property&rsquo;s
              guest capacity limits. Non-fishing guests do not pay rod fees, but they count
              toward the property&rsquo;s total guest capacity.
            </p>
            <p style={textStyle}>
              Only the booking member needs to be a club member. Additional fishing anglers
              in the party pay the per-rod fee but do not need individual memberships.
            </p>
            <p style={textStyle}>
              Properties set two capacity limits: maximum rods (fishing anglers) and maximum
              total guests (anglers + non-fishing companions). Both limits are enforced at
              booking time.
            </p>
          </div>

          {/* Club Subscriptions */}
          <div id="club-subscriptions" style={{ scrollMarginTop: 120 }}>
            <h2 style={sectionHeadingStyle}>Club Subscriptions</h2>
            <p style={textStyle}>
              Club platform subscriptions (Starter, Standard, Pro) are billed monthly and
              cover access to the AnglerPass platform tools. Subscriptions include a 30-day
              free trial with no credit card required.
            </p>
            <p style={textStyle}>
              Club subscriptions are separate from member dues. The subscription covers
              platform access (scheduling, roster management, communication tools). Member
              dues and initiation fees are set and received by the club, with only the 3.5%
              processing fee deducted to cover payment processing.
            </p>
            <p style={textStyle}>
              Clubs can upgrade or downgrade their plan at any time. Downgrades take effect
              at the end of the current billing period.
            </p>
          </div>

          {/* Back to pricing link */}
          <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid var(--color-parchment)' }}>
            <p style={{ fontSize: 14, color: 'var(--color-text-light)' }}>
              For a breakdown of what each participant pays, see our{' '}
              <Link href="/pricing" style={{ color: 'var(--color-river)', textDecoration: 'underline' }}>
                pricing page
              </Link>.
              For legal terms, see our{' '}
              <Link href="/" style={{ color: 'var(--color-river)', textDecoration: 'underline' }}>
                terms of service
              </Link>{' '}
              in the site footer.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
