import Link from 'next/link';

import {
  sectionClass,
  headingClass,
  subHeadingClass,
  textClass,
  listClass,
  listItemClass,
} from './policy-styles';

const cancellationRows = [
  { window: 'More than 7 days before fishing date', refund: '100% refund' },
  { window: '3\u20137 days before fishing date', refund: '75% refund' },
  { window: '24 hours \u2013 3 days before fishing date', refund: '50% refund' },
  { window: 'Less than 24 hours before fishing date', refund: 'No refund' },
];

export default function PaymentPolicies() {
  return (
    <>
      {/* Payment Processing */}
      <div id="payments" className={sectionClass}>
        <h2 className={headingClass}>Payment Processing</h2>
        <p className={textClass}>
          All payments on AnglerPass are processed securely through Stripe. AnglerPass
          does not store credit card numbers or bank account details directly.
        </p>

        <h3 className={subHeadingClass}>Processing fee</h3>
        <p className={textClass}>
          A <strong>3.5% processing fee</strong> is added to all membership payments (initiation
          fees and annual dues). This fee covers credit card and payment processing costs
          and is paid by the member at checkout. The club receives 100% of its stated
          initiation fee and annual dues.
        </p>

        <h3 className={subHeadingClass}>Booking fees</h3>
        <p className={textClass}>
          Fishing access bookings have a separate fee structure: a 15% platform fee on
          rod fees, plus a $25/rod cross-club access fee when booking outside your home club
          ($20 to AnglerPass, $5 to your home club).
          When a guide is added to a booking, a 10% service fee is applied to the guide&rsquo;s
          rate, paid by the angler. The guide receives 100% of their stated rate.
          See our{' '}
          <Link href="/pricing" className="text-river underline">
            pricing page
          </Link>{' '}
          for full details.
        </p>

        <h3 className={subHeadingClass}>Payouts</h3>
        <p className={textClass}>
          All payouts are processed through Stripe Connect directly to each
          participant&rsquo;s bank account. Payout schedules vary by role &mdash;
          see <a href="#payouts" className="text-river underline">Payout Schedules</a> for
          full details.
        </p>
      </div>

      {/* Booking Cancellations & Refunds */}
      <div id="bookings" className={sectionClass}>
        <h2 className={headingClass}>Booking Cancellations &amp; Refunds</h2>
        <p className={textClass}>
          Cancellation refunds for fishing access bookings follow a tiered schedule
          based on how far in advance the booking is cancelled.
        </p>

        <div className="rounded-lg border border-parchment overflow-hidden mt-4 mb-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-parchment-light">
                <th className="text-left p-3 px-5 text-[13px] font-semibold text-forest">
                  Cancellation window
                </th>
                <th className="text-left p-3 px-5 text-[13px] font-semibold text-forest">
                  Refund
                </th>
              </tr>
            </thead>
            <tbody>
              {cancellationRows.map((row) => (
                <tr key={row.window} className="border-t border-parchment">
                  <td className="p-3 px-5 text-[14px] text-text-secondary">
                    {row.window}
                  </td>
                  <td className="p-3 px-5 text-[14px] text-text-secondary">
                    {row.refund}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className={textClass}>
          A <strong>$15 late cancellation processing fee</strong> applies to all
          cancellations made within 72 hours of the reservation date. This fee is
          tracked on your account and reflected in your financial summary.
        </p>

        <p className={textClass}>
          Refunds are processed back to the original payment method. Platform fees
          are refunded proportionally to the booking refund amount.
        </p>
      </div>

      {/* Payout Schedules */}
      <div id="payouts" className={sectionClass}>
        <h2 className={headingClass}>Payout Schedules</h2>
        <p className={textClass}>
          All payouts are processed through Stripe Connect directly to your bank
          account. Each role on AnglerPass has a payout schedule designed for how
          that role operates. All booking-related payouts are subject to a
          <strong> 7-day hold period</strong> after the trip date for dispute
          resolution before entering the payout cycle.
        </p>

        <div className="rounded-lg border border-parchment overflow-hidden mt-4 mb-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-parchment-light">
                <th className="text-left p-3 px-5 text-[13px] font-semibold text-forest">
                  Role
                </th>
                <th className="text-left p-3 px-5 text-[13px] font-semibold text-forest">
                  Payout schedule
                </th>
                <th className="text-left p-3 px-5 text-[13px] font-semibold text-forest">
                  What&rsquo;s included
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-parchment">
                <td className="p-3 px-5 text-[14px] text-text-secondary font-medium">
                  Guides
                </td>
                <td className="p-3 px-5 text-[14px] text-text-secondary">
                  24&ndash;48 hours after trip date + 7-day hold
                </td>
                <td className="p-3 px-5 text-[14px] text-text-secondary">
                  100% of your stated guide rate
                </td>
              </tr>
              <tr className="border-t border-parchment">
                <td className="p-3 px-5 text-[14px] text-text-secondary font-medium">
                  Landowners
                </td>
                <td className="p-3 px-5 text-[14px] text-text-secondary">
                  Weekly (every Monday) after 7-day hold
                </td>
                <td className="p-3 px-5 text-[14px] text-text-secondary">
                  100% of rod fees, minus $5/rod club commission
                </td>
              </tr>
              <tr className="border-t border-parchment">
                <td className="p-3 px-5 text-[14px] text-text-secondary font-medium">
                  Clubs
                </td>
                <td className="p-3 px-5 text-[14px] text-text-secondary">
                  Monthly (1st of each month) after 7-day hold
                </td>
                <td className="p-3 px-5 text-[14px] text-text-secondary">
                  $5/rod booking commission
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className={subHeadingClass}>7-day hold period</h3>
        <p className={textClass}>
          After each trip, there is a 7-day hold period before funds enter the
          payout cycle. This hold allows time for dispute resolution between
          anglers and service providers. If no dispute is raised within the
          7-day window, funds are released to the next scheduled payout.
        </p>

        <h3 className={subHeadingClass}>Guide payouts</h3>
        <p className={textClass}>
          Guides receive the fastest payouts on the platform. After the 7-day
          hold clears, your guide rate is paid out within 24&ndash;48 hours.
          For example, if you guide a trip on Saturday April 5, the 7-day hold
          clears on Saturday April 12, and your payout initiates by Monday April
          14 &mdash; typically arriving in your bank account within 2 business days.
        </p>

        <h3 className={subHeadingClass}>Landowner payouts</h3>
        <p className={textClass}>
          Landowner rod fees are aggregated into a single weekly payout every
          Monday. This batching reduces transaction overhead and simplifies
          accounting. Once the 7-day hold clears for each booking, the rod fees
          are included in the next Monday payout.
        </p>

        <h3 className={subHeadingClass}>Club payouts</h3>
        <p className={textClass}>
          Club commissions ($5 per rod per booking) are paid out monthly on the
          1st of each month. Monthly batching aligns with how most clubs handle
          their accounting and reduces noise from small individual commission
          amounts. Membership dues and initiation fees are transferred separately
          as they are collected.
        </p>

        <h3 className={subHeadingClass}>Stripe Connect setup</h3>
        <p className={textClass}>
          To receive payouts, you must complete Stripe Connect onboarding through
          your dashboard. This is a one-time process that links your bank account
          for direct deposits. AnglerPass does not hold funds &mdash; all payouts
          flow through Stripe.
        </p>
      </div>
    </>
  );
}
