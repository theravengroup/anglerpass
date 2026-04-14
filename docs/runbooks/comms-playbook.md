# Incident Communications Playbook

Templates for telling users what's going on. The #1 rule: **tell them something, even if it's "we don't know yet"**. Silence is worse than any message.

---

## Channels (in order of speed)

1. **`/status` page + `/admin/incidents`** — updates in ~1 second. Always post here first. Even a one-liner.
2. **Email blast** via Resend — takes 2–5 minutes for prep, sends in seconds. Use for Sev 1 affecting a wide audience.
3. **Support inbox auto-responder** (support@anglerpass.com) — update the auto-reply text via Resend dashboard when you expect a flood of tickets.
4. **Social (X / Instagram)** — only for wide outages. Anglers don't follow us on social for status; customers do check the site.

---

## Template: initial post (within 5 min of detection)

Keep it short. Factual. No apologies yet — that's for the resolved update.

```
Title: [Surface] [brief description]
Severity: [minor | major | critical]
Status: investigating
Body:
We are investigating reports of [X]. [Y] may not work while we look into this.
[What still works, if anything.]
We'll update this page as soon as we know more.
```

**Example:**
```
Title: Payments temporarily unavailable
Severity: major
Status: investigating
Body:
We're investigating elevated error rates on payment processing. New bookings
can be saved as drafts and completed once payments recover. Existing bookings
are unaffected.
We'll update within 15 minutes.
```

---

## Template: update (every 15–30 min until resolved)

Users check `/status` obsessively during an outage. Give them a reason to refresh.

```
Status: [identified | monitoring | resolved]
Body:
UPDATE [HH:MM UTC]: [What we've learned since last update, in one sentence.]
[What users should do, if anything.]
Next update by [HH:MM UTC].
```

Always include a "next update by" time, even if you don't have new info. Missing a promised update is the single biggest trust-destroyer.

---

## Template: resolved

```
Status: resolved
Body:
UPDATE [HH:MM UTC]: Resolved. [What the fix was, in plain English — not a
git SHA.]
Duration: [start] — [end] UTC.
Impact: [Who was affected and what they saw.]
[If any user data needs re-entry or any bookings need retry: spell it out
here.]
We're sorry for the disruption.
```

---

## Email blast template (Sev 1 only)

Only send a mass email when the incident affects >25% of active users and is likely to generate support tickets. Otherwise, the status page is enough.

**Subject**: AnglerPass update — service disruption — [resolved | ongoing]

**Body**:
```
Hi [first name],

We want to let you know about a service disruption that [affected | is
currently affecting] AnglerPass.

What happened:
[One plain-English sentence.]

What it means for you:
- [Concrete impact on this user's workflow.]
- [Any action needed from them, if any.]

Current status:
[Resolved at HH:MM UTC | Ongoing — we expect resolution by HH:MM UTC.
Live updates at anglerpass.com/status.]

If you hit any residual issues, reply to this email and we'll sort it.

— The AnglerPass team
```

---

## Do's and don'ts

### Do

- Post within 5 minutes of detection, even if you have nothing to say yet.
- Use UTC timestamps (the marketing copy can be folksy; incident posts must be boring and precise).
- Name specific surfaces ("payments", "guide verification") not internal systems ("Stripe PaymentIntent create endpoint").
- Acknowledge what users are losing, not just what's broken. ("Bookings from the last 15 minutes may need to be re-submitted" is more useful than "Event processing delayed".)
- Say what works, not just what doesn't. Anxious users want to know they can still use the parts you haven't broken.

### Don't

- Don't apologize in the first post. Apologies are for the resolved post. Early apologies sound like you know more than you're saying.
- Don't speculate on cause before you know. "We suspect X" becomes "They blamed X" on Twitter within 20 minutes.
- Don't use engineering jargon. "The Checkr webhook signature verification is rejecting valid signatures" → "Background checks are temporarily stalled".
- Don't promise an ETA you aren't confident in. "Within the hour" means within the hour.
- Don't delete incident posts after resolution. The history is trust-building.

---

## After-action comms (within 48h of any Sev 1)

After a serious incident, write a public postmortem. Post to the `/status` page as a resolved incident with an expanded body, OR publish to a dedicated "incidents" section of the blog when launched.

Template lives at `docs/runbooks/postmortem-template.md` (TODO — write this when the first one happens).

---

## Support ticket templates

When the support inbox floods during an incident, use these canned replies.

### "Is the site down?"

```
Thanks for reaching out. We're aware of [issue] and actively working on it.
Live updates at anglerpass.com/status. We'll post here again once it's
resolved.
```

### "My booking didn't go through"

```
Sorry about that. During [date window] we had a [brief cause] affecting
[surface]. Your booking [status — lost/pending/completed]. [If lost: please
re-submit at <link>.] [If pending: it should complete automatically within
<timeframe>.]
If it still isn't resolved in 30 minutes, reply here with your booking ID
and we'll complete it manually.
```

### "I got charged but don't have a booking"

```
Thanks for flagging — that's the inverse of what happened during our outage
and we take it seriously. Can you reply with the Stripe receipt (the email
from payments@anglerpass.com, or the charge ID)? We'll refund or rebuild
the booking within one business day.
```
