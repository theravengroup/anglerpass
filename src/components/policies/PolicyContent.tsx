import Link from 'next/link';

const sectionClass = 'mb-16 scroll-mt-28';
const headingClass = 'font-heading text-[clamp(22px,3vw,28px)] font-semibold leading-[1.15] text-forest mb-5 tracking-[-0.2px] pb-3 border-b border-parchment';
const subHeadingClass = 'text-[15px] font-semibold text-forest mb-2 mt-7';
const textClass = 'text-[14.5px] leading-[1.8] text-text-secondary mb-3';
const listClass = `${textClass} pl-5`;
const listItemClass = 'mb-2';

export default function PolicyContent() {
  return (
    <div>
      {/* Membership & Applications */}
      <div id="membership" className={sectionClass}>
        <h2 className={headingClass}>Membership &amp; Applications</h2>
        <p className={textClass}>
          Clubs on AnglerPass manage their own membership. Each club sets its own
          initiation fee and annual dues. Membership is not open enrollment &mdash;
          prospective members submit an application, and the club&rsquo;s administrators
          review and approve or decline each application.
        </p>

        <h3 className={subHeadingClass}>Application process</h3>
        <ol className={listClass}>
          <li className={listItemClass}>Angler submits a membership application through AnglerPass.</li>
          <li className={listItemClass}>Club administrators review the application and may request additional information.</li>
          <li className={listItemClass}>Club approves or declines the application.</li>
          <li className={listItemClass}>If approved, the applicant is prompted to pay the initiation fee (if any) and first year&rsquo;s dues.</li>
          <li className={listItemClass}>Once payment is confirmed, the membership becomes active.</li>
        </ol>

        <h3 className={subHeadingClass}>Withdrawal</h3>
        <p className={textClass}>
          Applicants may withdraw a pending application at any time before it is approved.
          Once approved and paid, the membership is subject to the club&rsquo;s policies.
        </p>

        <h3 className={subHeadingClass}>Initiation fees</h3>
        <p className={textClass}>
          Initiation fees are one-time, non-refundable payments made when joining a club.
          The amount is set entirely by the club. Initiation fees are not prorated.
        </p>
      </div>

      {/* Dues & Renewals */}
      <div id="dues" className={sectionClass}>
        <h2 className={headingClass}>Dues &amp; Renewals</h2>
        <p className={textClass}>
          Annual dues are billed once per year from the date of your initial membership
          payment. Dues auto-renew via the payment method on file.
        </p>

        <h3 className={subHeadingClass}>Renewal process</h3>
        <p className={textClass}>
          You will receive an email reminder before your annual renewal date. On the
          renewal date, we will charge the payment method on file for the current
          year&rsquo;s dues amount (plus the 3.5% processing fee).
        </p>

        <h3 className={subHeadingClass}>Grace period</h3>
        <p className={textClass}>
          If your payment fails on the renewal date, you have a <strong>7-day grace period</strong> to
          update your payment method. During the grace period, your membership remains
          active and you can continue to make bookings. If payment is not resolved within
          7 days, your membership will be marked as lapsed and booking access will be
          suspended until dues are paid.
        </p>

        <h3 className={subHeadingClass}>Updating payment methods</h3>
        <p className={textClass}>
          You can update your credit card or bank account information at any time through
          your account settings. We recommend keeping your payment information current
          to avoid interruptions to your membership.
        </p>

        <h3 className={subHeadingClass}>Cancelling membership</h3>
        <p className={textClass}>
          See <a href="#cancellations" className="text-river underline">Membership Cancellations</a> below
          for full details on voluntary cancellations, the 14-day undo window, and what
          happens to your bookings.
        </p>
      </div>

      {/* Membership Cancellations */}
      <div id="cancellations" className={sectionClass}>
        <h2 className={headingClass}>Membership Cancellations</h2>
        <p className={textClass}>
          Members may cancel their club membership at any time from their account settings.
          Cancellation does not take immediate effect &mdash; your membership remains fully
          active through the end of your current paid period.
        </p>

        <h3 className={subHeadingClass}>What happens when you cancel</h3>
        <ul className={listClass}>
          <li className={listItemClass}>Your membership remains active through the end of your current paid period.</li>
          <li className={listItemClass}>Your annual dues subscription is cancelled &mdash; no further charges will be made.</li>
          <li className={listItemClass}>Dues already paid are not refunded for partial years.</li>
          <li className={listItemClass}>Any bookings scheduled after your membership end date will be automatically cancelled, and you will be notified.</li>
          <li className={listItemClass}>Bookings within your remaining active period are unaffected.</li>
        </ul>

        <h3 className={subHeadingClass}>14-day undo window</h3>
        <p className={textClass}>
          Changed your mind? You have <strong>14 days</strong> from the date you initiated
          cancellation to reverse it. During this window, you can reactivate your membership
          from your account settings at no cost. After 14 days, the cancellation is final
          and your membership will end at the close of your paid period.
        </p>

        <h3 className={subHeadingClass}>After cancellation takes effect</h3>
        <p className={textClass}>
          Once your paid period ends, your membership status changes to cancelled. You will
          no longer be able to make bookings through that club. If you wish to rejoin in
          the future, see <a href="#rejoining" className="text-river underline">Rejoining a Club</a> below.
        </p>
      </div>

      {/* Club-Initiated Removal */}
      <div id="removals" className={sectionClass}>
        <h2 className={headingClass}>Club-Initiated Removal</h2>
        <p className={textClass}>
          Clubs may remove a member for cause at the discretion of the club&rsquo;s
          administrators. Removal is immediate and does not follow the same timeline as
          voluntary cancellation.
        </p>

        <h3 className={subHeadingClass}>Grounds for removal</h3>
        <p className={textClass}>
          Each club sets its own standards for member conduct. Common grounds for removal
          include violation of club rules, property rules, or fishing regulations;
          disrespectful behavior toward landowners, staff, or other members; damage to
          property; or any conduct that compromises the trust the club has built with its
          landowner partners.
        </p>

        <h3 className={subHeadingClass}>Effect of removal</h3>
        <ul className={listClass}>
          <li className={listItemClass}>Removal takes effect immediately. Access is revoked upon removal.</li>
          <li className={listItemClass}>All future bookings are automatically cancelled and you will be notified.</li>
          <li className={listItemClass}>There are no refunds or prorations of initiation fees or annual dues.</li>
          <li className={listItemClass}>The annual dues subscription is cancelled immediately &mdash; no further charges will be made.</li>
          <li className={listItemClass}>You will receive a notification with the reason for removal provided by the club.</li>
        </ul>

        <h3 className={subHeadingClass}>Disputes</h3>
        <p className={textClass}>
          If you believe you were removed in error, you may contact the club directly.
          AnglerPass does not adjudicate disputes between clubs and their members &mdash;
          clubs have full authority over their membership decisions.
        </p>
      </div>

      {/* Rejoining a Club */}
      <div id="rejoining" className={sectionClass}>
        <h2 className={headingClass}>Rejoining a Club</h2>
        <p className={textClass}>
          If you previously cancelled your membership and wish to rejoin the same club,
          you may do so without submitting a new application (you have already been vetted).
          However, a rejoin fee applies.
        </p>

        <h3 className={subHeadingClass}>Rejoin fee</h3>
        <p className={textClass}>
          The rejoin fee is <strong>50% of the club&rsquo;s current initiation fee</strong>. This
          is a one-time payment made at the time of rejoining, in addition to the current
          annual dues. The 3.5% processing fee applies to both the rejoin fee and the dues.
        </p>

        <h3 className={subHeadingClass}>Example</h3>
        <p className={textClass}>
          If a club&rsquo;s current initiation fee is $350 and annual dues are $175:
        </p>
        <ul className={listClass}>
          <li className={listItemClass}>Rejoin fee: $175 (50% of $350) + $6.13 processing</li>
          <li className={listItemClass}>Annual dues: $175 + $6.13 processing</li>
          <li className={listItemClass}><strong>Total to rejoin: $362.26</strong></li>
        </ul>

        <h3 className={subHeadingClass}>Removed members</h3>
        <p className={textClass}>
          Members who were removed for cause by a club are not eligible to rejoin through
          AnglerPass. They must contact the club directly to discuss reinstatement. If the
          club agrees, they may facilitate the process through the platform.
        </p>
      </div>

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
              {[
                { window: '48+ hours before fishing date', refund: '100% refund' },
                { window: '24\u201348 hours before fishing date', refund: '50% refund' },
                { window: 'Less than 24 hours', refund: 'No refund' },
              ].map((row) => (
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

      {/* Guide Services */}
      <div id="guide-services" className={sectionClass}>
        <h2 className={headingClass}>Guide Services</h2>
        <p className={textClass}>
          Professional fly fishing guides can apply to join the AnglerPass platform
          as independent service providers. Guides are not employees of AnglerPass
          or any club on the platform.
        </p>

        <h3 className={subHeadingClass}>Guide requirements</h3>
        <p className={textClass}>
          All guides must submit credentials for verification before being approved
          to offer services on the platform. Required credentials include a valid
          state guide license, professional liability insurance, and current first
          aid certification. AnglerPass reviews all applications and may request
          additional documentation.
        </p>

        <h3 className={subHeadingClass}>Water access approvals</h3>
        <p className={textClass}>
          Approved guides may request access to guide on specific properties. Each
          request is reviewed by the club or landowner managing that water. Approval
          is at the sole discretion of the managing entity and may be revoked at any
          time.
        </p>

        <h3 className={subHeadingClass}>Guide fees &amp; payouts</h3>
        <p className={textClass}>
          There is no subscription or listing fee for guides. Guides set their own
          full-day and half-day rates. A 10% service fee is added on top of the
          guide&rsquo;s rate at checkout, paid by the angler. The guide receives 100%
          of their stated rate for each completed trip. Payouts are processed through
          Stripe Connect.
        </p>

        <h3 className={subHeadingClass}>Cancellation &amp; guide payouts</h3>
        <p className={textClass}>
          When an angler cancels a booking that includes a guide, the guide payout
          follows the same tiered refund schedule as the booking itself. Cancellations
          within 48 hours of the trip date result in a full guide payout. The guide&rsquo;s
          availability is automatically released upon cancellation.
        </p>

        <h3 className={subHeadingClass}>Reviews</h3>
        <p className={textClass}>
          After a guided trip, both the angler and guide may submit reviews within
          14 days. Reviews are revealed simultaneously once both parties have submitted,
          or after the 14-day window closes &mdash; whichever comes first. This mutual
          reveal system ensures honest, unbiased feedback.
        </p>
      </div>

      {/* Guest Policy */}
      <div id="guest-policy" className={sectionClass}>
        <h2 className={headingClass}>Guest Policy</h2>
        <p className={textClass}>
          Members may bring non-fishing guests to properties, subject to the property&rsquo;s
          guest capacity limits. Non-fishing guests do not pay rod fees, but they count
          toward the property&rsquo;s total guest capacity.
        </p>
        <p className={textClass}>
          Only the booking member needs to be a club member. Additional fishing anglers
          in the party pay the per-rod fee but do not need individual memberships.
        </p>
        <p className={textClass}>
          Properties set two capacity limits: maximum rods (fishing anglers) and maximum
          total guests (anglers + non-fishing companions). Both limits are enforced at
          booking time.
        </p>
      </div>

      {/* Club Subscriptions */}
      <div id="club-subscriptions" className={sectionClass}>
        <h2 className={headingClass}>Club Subscriptions</h2>
        <p className={textClass}>
          Club platform subscriptions (Starter, Standard, Pro) are billed monthly and
          cover access to the AnglerPass platform tools. Subscriptions include a 30-day
          free trial with no credit card required.
        </p>
        <p className={textClass}>
          Club subscriptions are separate from member dues. The subscription covers
          platform access (scheduling, roster management, communication tools). Member
          dues and initiation fees are set and received by the club, with only the 3.5%
          processing fee deducted to cover payment processing.
        </p>
        <p className={textClass}>
          Clubs can upgrade or downgrade their plan at any time. Downgrades take effect
          at the end of the current billing period.
        </p>
      </div>

      {/* Review Moderation */}
      <div id="review-moderation" className={sectionClass}>
        <h2 className={headingClass}>Review Moderation</h2>
        <p className={textClass}>
          Verified trip reviews are the foundation of trust on AnglerPass.
          Our moderation policy exists to protect the integrity of that
          system&nbsp;&mdash; not to manage anyone&rsquo;s reputation.
        </p>

        <h3 className={subHeadingClass}>What gets removed</h3>
        <p className={textClass}>We remove reviews that contain:</p>
        <ul className={listClass}>
          <li className={listItemClass}>
            Threats or threatening language directed at any individual or property
          </li>
          <li className={listItemClass}>Hate speech of any kind</li>
          <li className={listItemClass}>
            Personal identifying information about any individual (doxxing)
          </li>
          <li className={listItemClass}>
            Admissions of trespass, poaching, or illegal conduct on the property
          </li>
          <li className={listItemClass}>
            Content that is purely political or entirely unrelated to the trip or property
          </li>
          <li className={listItemClass}>
            Extortion attempts, including implied threats to post negative reviews unless
            a refund is issued
          </li>
          <li className={listItemClass}>
            Content that is factually impossible based on the verified booking record
          </li>
        </ul>

        <h3 className={subHeadingClass}>What we do not remove</h3>
        <p className={textClass}>We do not remove reviews because:</p>
        <ul className={listClass}>
          <li className={listItemClass}>
            A landowner or club finds the review unflattering
          </li>
          <li className={listItemClass}>
            A review is negative but honest and relevant
          </li>
          <li className={listItemClass}>
            A review is critical of access, water conditions, or communication from the
            property
          </li>
        </ul>
        <p className={textClass}>
          Negative reviews that reflect real experiences are exactly what the system is for.
        </p>

        <h3 className={subHeadingClass}>Who can flag a review</h3>
        <p className={textClass}>
          Landowners and club administrators associated with a property may flag any review
          on that property. Flagging places a review in our moderation queue. It does not
          suppress or remove the review.
        </p>

        <h3 className={subHeadingClass}>Our response commitment</h3>
        <p className={textClass}>
          Every flagged review will be acknowledged within 24 hours. A final decision will
          be issued within 72 hours of the flag being submitted.
        </p>

        <h3 className={subHeadingClass}>Landowner &amp; club responses</h3>
        <p className={textClass}>
          Landowners and club administrators may post one public response to any review on
          their property. Responses may be edited for up to 24 hours after posting. After
          that, they are locked.
        </p>

        <h3 className={subHeadingClass}>Appeals</h3>
        <p className={textClass}>
          If you believe a moderation decision was made in error, contact{' '}
          <a href="mailto:support@anglerpass.com" className="text-river underline">
            support@anglerpass.com
          </a>{' '}
          with the subject line: <strong>Review Moderation Appeal</strong>.
        </p>
      </div>
    </div>
  );
}
