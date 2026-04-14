# AnglerPass User Journey Flows

> Generated 2026-04-14 by site crawler

## Angler: Discovery → Waitlist → Join

```mermaid
flowchart TD
    angler0[/"Book Private Water Fly Fishing<br/><small>📝 2 form(s)</small>"/]
    angler1[/"Private Fly Fishing Access for Anglers<br/><small>💬 Modal: Contact</small>"/]
    angler2[/"Explore Private Waters<br/><small>📝 1 form(s)</small>"/]
    angler3[/"Fly Fishing Guides & Resources<br/><small>💬 Modal: Contact</small>"/]
    angler4[/"Pricing<br/><small>💬 Modal: Contact</small>"/]
    angler5[/"Sign Up<br/><small>📝 1 form(s)</small>"/]
    angler6[/"Log In<br/><small>📝 1 form(s)</small>"/]
    angler0 -->|""| angler1
    angler0 -.-> angler2
    angler0 -.-> angler6
    angler0 -.-> angler4
    angler0 -.-> angler3
    angler1 -->|"Explore Waters"| angler2
    angler1 -.-> angler6
    angler1 -.-> angler4
    angler1 -.-> angler3
    angler2 -->|""| angler3
    angler2 -.-> angler0
    angler2 -.-> angler6
    angler2 -.-> angler4
    angler3 -->|""| angler4
    angler3 -.-> angler0
    angler3 -.-> angler6
    angler3 -.-> angler1
    angler4 -->|""| angler5
    angler4 -.-> angler0
    angler4 -.-> angler2
    angler4 -.-> angler6
    angler4 -.-> angler1
    angler5 -->|""| angler6
    angler5 -.-> angler0
    angler5 -.-> angler2
    angler5 -.-> angler1
    angler5 -.-> angler3
    angler6 -.-> angler0
    angler6 -.-> angler2
    angler6 -.-> angler1
    angler6 -.-> angler4
    angler6 -.-> angler3

    classDef formNode fill:#2d5a7c,stroke:#5a9aad,color:#f5f0e0
    classDef authNode fill:#7c2d2d,stroke:#a05050,color:#f5f0e0
    classDef modalNode fill:#5a2d7c,stroke:#7c5a9a,color:#f5f0e0
    class angler0,angler2,angler5,angler6 formNode
    class angler0,angler1,angler2,angler3,angler4,angler5,angler6 modalNode
```

### Angler: Discovery → Waitlist → Join — Step Details

| Step | Page | Forms | CTAs | Modals |
|------|------|-------|------|--------|
| 1 | [Book Private Water Fly Fishing](https://anglerpass.com/) | 7 fields, 6 fields | Explore Waters, Join the Waitlist, Join as a Guide | Contact Us Directly, Contact |
| 2 | [Private Fly Fishing Access for Anglers](https://anglerpass.com/anglers) | — | Explore Waters, How do I find and join a club? | Contact |
| 3 | [Explore Private Waters](https://anglerpass.com/explore) | 4 fields | Explore Waters | Contact |
| 4 | [Fly Fishing Guides & Resources](https://anglerpass.com/learn) | — | Explore Waters | Contact |
| 5 | [Pricing](https://anglerpass.com/pricing) | — | Explore Waters | Contact |
| 6 | [Sign Up](https://anglerpass.com/signup) | 6 fields | Explore Waters | Contact |
| 7 | [Log In](https://anglerpass.com/login) | 3 fields | Explore Waters | Contact |

---

## Landowner: Discovery → Registration

```mermaid
flowchart TD
    landowner0[/"Book Private Water Fly Fishing<br/><small>📝 2 form(s)</small>"/]
    landowner1[/"List Your Private Water for Fly Fishing<br/><small>📝 1 form(s)</small>"/]
    landowner2[/"Pricing<br/><small>💬 Modal: Contact</small>"/]
    landowner3[/"Sign Up<br/><small>📝 1 form(s)</small>"/]
    landowner4[/"Log In<br/><small>📝 1 form(s)</small>"/]
    landowner0 -->|"Register Your Property"| landowner1
    landowner0 -.-> landowner4
    landowner0 -.-> landowner2
    landowner1 -->|""| landowner2
    landowner1 -.-> landowner4
    landowner2 -->|""| landowner3
    landowner2 -.-> landowner0
    landowner2 -.-> landowner4
    landowner3 -->|""| landowner4
    landowner3 -.-> landowner0
    landowner3 -.-> landowner1
    landowner4 -.-> landowner0
    landowner4 -.-> landowner1
    landowner4 -.-> landowner2

    classDef formNode fill:#2d5a7c,stroke:#5a9aad,color:#f5f0e0
    classDef authNode fill:#7c2d2d,stroke:#a05050,color:#f5f0e0
    classDef modalNode fill:#5a2d7c,stroke:#7c5a9a,color:#f5f0e0
    class landowner0,landowner1,landowner3,landowner4 formNode
    class landowner0,landowner1,landowner2,landowner3,landowner4 modalNode
```

### Landowner: Discovery → Registration — Step Details

| Step | Page | Forms | CTAs | Modals |
|------|------|-------|------|--------|
| 1 | [Book Private Water Fly Fishing](https://anglerpass.com/) | 7 fields, 6 fields | Join the Waitlist, Register Your Property, Join the Waitlist | Contact Us Directly, Contact |
| 2 | [List Your Private Water for Fly Fishing](https://anglerpass.com/landowners) | 1 fields | How does AnglerPass protect my property and privacy?, What does it cost me as a landowner?, How do I control who accesses my property? | Contact |
| 3 | [Pricing](https://anglerpass.com/pricing) | — | — | Contact |
| 4 | [Sign Up](https://anglerpass.com/signup) | 6 fields | — | Contact |
| 5 | [Log In](https://anglerpass.com/login) | 3 fields | — | Contact |

---

## Club: Discovery → Onboarding

```mermaid
flowchart TD
    club0[/"Book Private Water Fly Fishing<br/><small>📝 2 form(s)</small>"/]
    club1[/"Fly Fishing Club Management Software<br/><small>💬 Modal: Contact</small>"/]
    club2[/"Pricing<br/><small>💬 Modal: Contact</small>"/]
    club3[/"Sign Up<br/><small>📝 1 form(s)</small>"/]
    club4[/"Log In<br/><small>📝 1 form(s)</small>"/]
    club0 -->|"See All Club Features →"| club1
    club0 -.-> club4
    club0 -.-> club2
    club1 -->|""| club2
    club1 -.-> club4
    club2 -->|""| club3
    club2 -.-> club0
    club2 -.-> club4
    club3 -->|""| club4
    club3 -.-> club0
    club3 -.-> club1
    club4 -.-> club0
    club4 -.-> club1
    club4 -.-> club2

    classDef formNode fill:#2d5a7c,stroke:#5a9aad,color:#f5f0e0
    classDef authNode fill:#7c2d2d,stroke:#a05050,color:#f5f0e0
    classDef modalNode fill:#5a2d7c,stroke:#7c5a9a,color:#f5f0e0
    class club0,club3,club4 formNode
    class club0,club1,club2,club3,club4 modalNode
```

### Club: Discovery → Onboarding — Step Details

| Step | Page | Forms | CTAs | Modals |
|------|------|-------|------|--------|
| 1 | [Book Private Water Fly Fishing](https://anglerpass.com/) | 7 fields, 6 fields | Join the Waitlist, See All Club Features →, Streamline Your Club | Contact Us Directly, Contact |
| 2 | [Fly Fishing Club Management Software](https://anglerpass.com/clubs) | — | How does club pricing work?, What is cross-club access and how does it work?, Can I add staff to help manage the club? | Contact |
| 3 | [Pricing](https://anglerpass.com/pricing) | — | — | Contact |
| 4 | [Sign Up](https://anglerpass.com/signup) | 6 fields | — | Contact |
| 5 | [Log In](https://anglerpass.com/login) | 3 fields | — | Contact |

---

## Guide: Discovery → Verification

```mermaid
flowchart TD
    guide0[/"Book Private Water Fly Fishing<br/><small>📝 2 form(s)</small>"/]
    guide1[/"For Guides<br/><small>💬 Modal: Contact</small>"/]
    guide2[/"Pricing<br/><small>💬 Modal: Contact</small>"/]
    guide3[/"Sign Up<br/><small>📝 1 form(s)</small>"/]
    guide4[/"Log In<br/><small>📝 1 form(s)</small>"/]
    guide0 -->|"Join as a Guide"| guide1
    guide0 -.-> guide4
    guide0 -.-> guide2
    guide1 -->|""| guide2
    guide1 -.-> guide4
    guide2 -->|""| guide3
    guide2 -.-> guide0
    guide2 -.-> guide4
    guide3 -->|""| guide4
    guide3 -.-> guide0
    guide3 -.-> guide1
    guide4 -.-> guide0
    guide4 -.-> guide1
    guide4 -.-> guide2

    classDef formNode fill:#2d5a7c,stroke:#5a9aad,color:#f5f0e0
    classDef authNode fill:#7c2d2d,stroke:#a05050,color:#f5f0e0
    classDef modalNode fill:#5a2d7c,stroke:#7c5a9a,color:#f5f0e0
    class guide0,guide3,guide4 formNode
    class guide0,guide1,guide2,guide3,guide4 modalNode
```

### Guide: Discovery → Verification — Step Details

| Step | Page | Forms | CTAs | Modals |
|------|------|-------|------|--------|
| 1 | [Book Private Water Fly Fishing](https://anglerpass.com/) | 7 fields, 6 fields | Join the Waitlist, Join as a Guide, Join the Waitlist | Contact Us Directly, Contact |
| 2 | [For Guides](https://anglerpass.com/guides) | — | How much does it cost to join as a guide?, Can I guide on multiple properties and for multiple clubs?, Do anglers have to book a guide for their trip? | Contact |
| 3 | [Pricing](https://anglerpass.com/pricing) | — | — | Contact |
| 4 | [Sign Up](https://anglerpass.com/signup) | 6 fields | — | Contact |
| 5 | [Log In](https://anglerpass.com/login) | 3 fields | — | Contact |

---

## Investor: Discovery → Snapshot Request

```mermaid
flowchart TD
    investor0[/"Book Private Water Fly Fishing<br/><small>📝 2 form(s)</small>"/]
    investor1[/"About AnglerPass<br/><small>💬 Modal: Contact</small>"/]
    investor2[/"Our Team<br/><small>💬 Modal: Contact</small>"/]
    investor3[/"Press<br/><small>💬 Modal: Contact</small>"/]
    investor0 -->|""| investor1
    investor0 -.-> investor2
    investor0 -.-> investor3
    investor1 -->|""| investor2
    investor1 -.-> investor3
    investor2 -->|""| investor3
    investor2 -.-> investor0
    investor3 -.-> investor0
    investor3 -.-> investor1

    classDef formNode fill:#2d5a7c,stroke:#5a9aad,color:#f5f0e0
    classDef authNode fill:#7c2d2d,stroke:#a05050,color:#f5f0e0
    classDef modalNode fill:#5a2d7c,stroke:#7c5a9a,color:#f5f0e0
    class investor0 formNode
    class investor0,investor1,investor2,investor3 modalNode
```

### Investor: Discovery → Snapshot Request — Step Details

| Step | Page | Forms | CTAs | Modals |
|------|------|-------|------|--------|
| 1 | [Book Private Water Fly Fishing](https://anglerpass.com/) | 7 fields, 6 fields | Can I request early access or become a pilot user?, Request the Snapshot, Contact Us Directly | Contact Us Directly, Contact |
| 2 | [About AnglerPass](https://anglerpass.com/about) | — | — | Contact |
| 3 | [Our Team](https://anglerpass.com/team) | — | — | Contact |
| 4 | [Press](https://anglerpass.com/press) | — | — | Contact |

---

## Corporate Members: Discovery → Membership Inquiry

```mermaid
flowchart TD
    corporate0[/"Book Private Water Fly Fishing<br/><small>📝 2 form(s)</small>"/]
    corporate1[/"Corporate Fly Fishing Memberships<br/><small>💬 Modal: Contact</small>"/]
    corporate2[/"Fly Fishing Club Management Software<br/><small>💬 Modal: Contact</small>"/]
    corporate3[/"Pricing<br/><small>💬 Modal: Contact</small>"/]
    corporate4[/"About AnglerPass<br/><small>💬 Modal: Contact</small>"/]
    corporate5[/"Sign Up<br/><small>📝 1 form(s)</small>"/]
    corporate6[/"Log In<br/><small>📝 1 form(s)</small>"/]
    corporate0 -->|""| corporate1
    corporate0 -.-> corporate6
    corporate0 -.-> corporate2
    corporate0 -.-> corporate3
    corporate0 -.-> corporate4
    corporate1 -->|""| corporate2
    corporate1 -.-> corporate6
    corporate1 -.-> corporate3
    corporate1 -.-> corporate4
    corporate2 -->|""| corporate3
    corporate2 -.-> corporate0
    corporate2 -.-> corporate6
    corporate2 -.-> corporate4
    corporate3 -->|""| corporate4
    corporate3 -.-> corporate0
    corporate3 -.-> corporate6
    corporate3 -.-> corporate1
    corporate4 -->|""| corporate5
    corporate4 -.-> corporate0
    corporate4 -.-> corporate6
    corporate4 -.-> corporate2
    corporate4 -.-> corporate1
    corporate5 -->|""| corporate6
    corporate5 -.-> corporate0
    corporate5 -.-> corporate2
    corporate5 -.-> corporate1
    corporate5 -.-> corporate3
    corporate6 -.-> corporate0
    corporate6 -.-> corporate2
    corporate6 -.-> corporate1
    corporate6 -.-> corporate3
    corporate6 -.-> corporate4

    classDef formNode fill:#2d5a7c,stroke:#5a9aad,color:#f5f0e0
    classDef authNode fill:#7c2d2d,stroke:#a05050,color:#f5f0e0
    classDef modalNode fill:#5a2d7c,stroke:#7c5a9a,color:#f5f0e0
    class corporate0,corporate5,corporate6 formNode
    class corporate0,corporate1,corporate2,corporate3,corporate4,corporate5,corporate6 modalNode
```

### Corporate Members: Discovery → Membership Inquiry — Step Details

| Step | Page | Forms | CTAs | Modals |
|------|------|-------|------|--------|
| 1 | [Book Private Water Fly Fishing](https://anglerpass.com/) | 7 fields, 6 fields | Can clubs manage memberships through AnglerPass?, How do anglers book private water?, Contact Us Directly | Contact Us Directly, Contact |
| 2 | [Corporate Fly Fishing Memberships](https://anglerpass.com/corporates) | — | What is a corporate membership on AnglerPass?, How do employees get access?, What can corporate employees do on the platform? | Contact |
| 3 | [Fly Fishing Club Management Software](https://anglerpass.com/clubs) | — | How do I get my existing members onto AnglerPass?, How does the member vetting process work?, How do we get access to private water for our members? | Contact |
| 4 | [Pricing](https://anglerpass.com/pricing) | — | — | Contact |
| 5 | [About AnglerPass](https://anglerpass.com/about) | — | — | Contact |
| 6 | [Sign Up](https://anglerpass.com/signup) | 6 fields | — | Contact |
| 7 | [Log In](https://anglerpass.com/login) | 3 fields | — | Contact |

---

## Complete Page Inventory

| Path | Title | Category | Auth | Forms | CTAs | Modals |
|------|-------|----------|------|-------|------|--------|
| `/` | Book Private Water Fly Fishing | homepage | ✅ | 2 | 25 | 2 |
| `/about` | About AnglerPass | audience | ✅ | 0 | 3 | 1 |
| `/admin` | /admin | dashboard | 🔒 | 0 | 0 | 0 |
| `/anglers` | Private Fly Fishing Access for Anglers | dashboard | ✅ | 0 | 13 | 1 |
| `/clubs` | Fly Fishing Club Management Software | dashboard | ✅ | 0 | 14 | 1 |
| `/conservation` | Conservation | audience | ✅ | 0 | 3 | 1 |
| `/corporates` | Corporate Fly Fishing Memberships | dashboard | ✅ | 0 | 11 | 1 |
| `/dashboard` | /dashboard | dashboard | 🔒 | 0 | 0 | 0 |
| `/dashboard/settings` | /dashboard/settings | dashboard | 🔒 | 0 | 0 | 0 |
| `/downloads/anglerpass-media-kit.zip` | /downloads/anglerpass-media-kit.zip | other | ✅ | 0 | 0 | 0 |
| `/email-preferences` | AnglerPass | legal | ✅ | 0 | 3 | 1 |
| `/explore` | Explore Private Waters | audience | ✅ | 1 | 8 | 1 |
| `/fly-fishing/colorado` | Private Water Fly Fishing in Colorado | state-seo | ✅ | 0 | 3 | 1 |
| `/fly-fishing/idaho` | Private Water Fly Fishing in Idaho | state-seo | ✅ | 0 | 3 | 1 |
| `/fly-fishing/montana` | Private Water Fly Fishing in Montana | state-seo | ✅ | 0 | 3 | 1 |
| `/fly-fishing/new-york` | Private Water Fly Fishing in New York | state-seo | ✅ | 0 | 3 | 1 |
| `/fly-fishing/north-carolina` | Private Water Fly Fishing in North Carol | state-seo | ✅ | 0 | 3 | 1 |
| `/fly-fishing/oregon` | Private Water Fly Fishing in Oregon | state-seo | ✅ | 0 | 3 | 1 |
| `/fly-fishing/pennsylvania` | Private Water Fly Fishing in Pennsylvani | state-seo | ✅ | 0 | 3 | 1 |
| `/fly-fishing/tennessee` | Private Water Fly Fishing in Tennessee | state-seo | ✅ | 0 | 3 | 1 |
| `/fly-fishing/utah` | Private Water Fly Fishing in Utah | state-seo | ✅ | 0 | 3 | 1 |
| `/fly-fishing/virginia` | Private Water Fly Fishing in Virginia | state-seo | ✅ | 0 | 3 | 1 |
| `/fly-fishing/washington` | Private Water Fly Fishing in Washington | state-seo | ✅ | 0 | 3 | 1 |
| `/fly-fishing/wyoming` | Private Water Fly Fishing in Wyoming | state-seo | ✅ | 0 | 3 | 1 |
| `/forgot-password` | Forgot Password | auth | ✅ | 1 | 4 | 1 |
| `/guides` | For Guides | dashboard | ✅ | 0 | 13 | 1 |
| `/landowners` | List Your Private Water for Fly Fishing | dashboard | ✅ | 1 | 14 | 1 |
| `/learn` | Fly Fishing Guides & Resources | learn | ✅ | 0 | 4 | 1 |
| `/learn/best-private-trout-streams-american-west` | The Best Private Trout Streams in the Am | learn | ✅ | 0 | 3 | 1 |
| `/learn/digital-gap-in-fly-fishing-club-management` | AnglerPass | learn | ✅ | 0 | 3 | 1 |
| `/learn/etiquette-of-private-water` | The Etiquette of Private Water: Rules Ev | learn | ✅ | 0 | 3 | 1 |
| `/learn/hidden-economics-of-running-a-fly-fishing-club` | The Hidden Economics of Running a Fly Fi | learn | ✅ | 0 | 3 | 1 |
| `/learn/how-fly-fishing-clubs-manage-private-water-access` | How Fly Fishing Clubs Manage Private Wat | learn | ✅ | 0 | 3 | 1 |
| `/learn/how-landowners-can-earn-income-from-fly-fishing-access` | How Landowners Can Earn Income from Fly  | learn | ✅ | 0 | 3 | 1 |
| `/learn/how-to-evaluate-a-fly-fishing-club-before-you-join` | How to Evaluate a Fly Fishing Club Befor | learn | ✅ | 0 | 3 | 1 |
| `/learn/how-to-get-access-to-private-fly-fishing-water` | How to Get Access to Private Fly Fishing | learn | ✅ | 0 | 3 | 1 |
| `/learn/how-to-start-a-fly-fishing-club` | How to Start a Fly Fishing Club | learn | ✅ | 0 | 3 | 1 |
| `/learn/planning-your-first-private-water-trip` | AnglerPass | learn | ✅ | 0 | 3 | 1 |
| `/learn/private-vs-public-water-fly-fishing` | Private vs. Public Water Fly Fishing: Wh | learn | ✅ | 0 | 3 | 1 |
| `/learn/stewardship-as-infrastructure-how-managed-access-protects-the-fishery` | AnglerPass | learn | ✅ | 0 | 3 | 1 |
| `/learn/what-corporate-fly-fishing-retreats-get-wrong` | What Corporate Fly Fishing Retreats Get  | learn | ✅ | 0 | 3 | 1 |
| `/learn/what-fly-fishing-guides-need-to-know-about-private-water` | What Fly Fishing Guides Need to Know Abo | learn | ✅ | 0 | 3 | 1 |
| `/learn/what-is-a-fly-fishing-club` | What Is a Fly Fishing Club and How Do Th | learn | ✅ | 0 | 3 | 1 |
| `/learn/what-is-cross-club-fly-fishing-access` | What Is Cross-Club Fly Fishing Access? | learn | ✅ | 0 | 3 | 1 |
| `/learn/what-to-expect-fishing-with-a-guide-first-time` | AnglerPass | learn | ✅ | 0 | 3 | 1 |
| `/learn/why-catch-and-release-matters-more-on-private-water` | Why Catch-and-Release Matters More on Pr | learn | ✅ | 0 | 3 | 1 |
| `/learn/why-landowners-should-require-club-based-access` | Why Landowners Should Require Club-Based | learn | ✅ | 0 | 3 | 1 |
| `/learn/why-the-best-water-in-america-is-behind-a-gate` | AnglerPass | learn | ✅ | 0 | 3 | 1 |
| `/login` | Log In | auth | ✅ | 1 | 4 | 1 |
| `/policies` | Policies | legal | ✅ | 0 | 3 | 1 |
| `/press` | Press | audience | ✅ | 0 | 3 | 1 |
| `/pricing` | Pricing | audience | ✅ | 0 | 3 | 1 |
| `/privacy` | Privacy Policy | legal | ✅ | 0 | 3 | 1 |
| `/signup` | Sign Up | auth | ✅ | 1 | 5 | 1 |
| `/team` | Our Team | audience | ✅ | 0 | 4 | 1 |
| `/terms` | Terms of Service | legal | ✅ | 0 | 3 | 1 |
