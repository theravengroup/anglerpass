import {
  sectionClass,
  headingClass,
  subHeadingClass,
  textClass,
  listClass,
  listItemClass,
  orderedListClass,
} from './policy-styles';

export default function MembershipPolicies() {
  return (
    <>
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
        <ol className={orderedListClass}>
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
          year&rsquo;s dues amount (plus the 5% AnglerPass platform fee).
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
          annual dues. The 5% AnglerPass platform fee applies to both the rejoin fee and the&nbsp;dues.
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
    </>
  );
}
