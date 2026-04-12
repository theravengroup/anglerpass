import Link from 'next/link';

import {
  sectionClass,
  headingClass,
  subHeadingClass,
  textClass,
  listClass,
  listItemClass,
} from './policy-styles';

export default function ServicePolicies() {
  return (
    <>
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
          dues and initiation fees are set and received by the club, with a 5% AnglerPass
          platform fee applied at checkout, paid by the member.
        </p>
        <p className={textClass}>
          Clubs can upgrade or downgrade their plan at any time. Downgrades take effect
          at the end of the current billing period.
        </p>
      </div>

      {/* SMS Terms */}
      <div id="sms-terms" className={sectionClass}>
        <h2 className={headingClass}>SMS Terms &amp; Conditions</h2>
        <p className={textClass}>
          By opting in to SMS notifications on AnglerPass, you consent to receive
          automated text messages at the mobile number you provide. SMS is entirely
          optional and is not required to use the platform.
        </p>

        <h3 className={subHeadingClass}>What messages you&rsquo;ll receive</h3>
        <ul className={listClass}>
          <li className={listItemClass}>Booking confirmations and updates</li>
          <li className={listItemClass}>Trip reminders (24 hours before your fishing date)</li>
          <li className={listItemClass}>Access details and gate codes on the morning of your trip</li>
          <li className={listItemClass}>Post-trip review prompts</li>
          <li className={listItemClass}>Account and membership notifications</li>
        </ul>

        <h3 className={subHeadingClass}>Message frequency</h3>
        <p className={textClass}>
          Message frequency varies based on your booking activity. You will typically
          receive 2&ndash;5 messages per booking (confirmation, reminder, access details,
          thank you). If you are not actively booking, you will not receive messages.
        </p>

        <h3 className={subHeadingClass}>How to opt out</h3>
        <p className={textClass}>
          You may opt out of SMS notifications at any time by:
        </p>
        <ul className={listClass}>
          <li className={listItemClass}>Replying <strong>STOP</strong> to any message from AnglerPass</li>
          <li className={listItemClass}>
            Turning off SMS notifications in your{' '}
            <a href="/dashboard/settings" className="text-river underline">account settings</a>
          </li>
        </ul>
        <p className={textClass}>
          Opting out of SMS does not affect email notifications or in-app notifications.
        </p>

        <h3 className={subHeadingClass}>Supported carriers</h3>
        <p className={textClass}>
          SMS messages are delivered via standard carrier networks. Major US carriers
          are supported, including AT&amp;T, Verizon, T-Mobile, and Sprint. Carrier
          message and data rates may apply.
        </p>

        <h3 className={subHeadingClass}>Message and data rates</h3>
        <p className={textClass}>
          Message and data rates may apply depending on your mobile plan. AnglerPass
          does not charge for SMS messages, but your carrier may charge standard
          messaging fees.
        </p>

        <h3 className={subHeadingClass}>Privacy</h3>
        <p className={textClass}>
          Your phone number is stored securely and used only for delivering SMS
          notifications you have opted in to. We do not share your phone number with
          third parties for marketing purposes. See our{' '}
          <Link href="/privacy" className="text-river underline">
            Privacy Policy
          </Link>{' '}
          for full details on how we handle your data.
        </p>

        <h3 className={subHeadingClass}>Help</h3>
        <p className={textClass}>
          For help with SMS notifications, reply <strong>HELP</strong> to any message
          or contact{' '}
          <a href="mailto:support@anglerpass.com" className="text-river underline">
            support@anglerpass.com
          </a>.
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
    </>
  );
}
