import InvestorForm from './InvestorForm';

export default function InvestorsSection() {
  return (
    <section className="investors" id="investors">
      <div className="container">
        <div className="investors-header reveal">
          <span className="eyebrow">For Investors</span>
          <h2>The Infrastructure Layer for Private Water Access</h2>
          <p>AnglerPass is building the first purpose-built software platform for the private fly fishing ecosystem — a fragmented, high-value market with no incumbent technology and strong willingness to pay.</p>
        </div>

        <div className="investors-grid">
          <div className="investor-metric reveal d1">
            <div className="investor-metric-value">$2.8B</div>
            <div className="investor-metric-label">Addressable Market</div>
            <p>The U.S. fly fishing market generates billions annually, with private water access, club memberships, and guided experiences representing the highest-value segments.</p>
          </div>
          <div className="investor-metric reveal d2">
            <div className="investor-metric-value">3-Sided</div>
            <div className="investor-metric-label">Platform Model</div>
            <p>Landowners, clubs, and anglers each have distinct needs that converge on one platform — creating network effects and natural retention as adoption grows.</p>
          </div>
          <div className="investor-metric reveal d3">
            <div className="investor-metric-value">Zero</div>
            <div className="investor-metric-label">Direct Competitors</div>
            <p>No existing SaaS platform serves this vertical. Current solutions are spreadsheets, phone calls, and informal networks — leaving a wide-open lane for purpose-built software.</p>
          </div>
        </div>

        <div className="investors-columns">
          <div className="reveal-left">
            <h3>The Business Model</h3>
            <div className="investors-detail">
              <h4>SaaS Subscriptions</h4>
              <p>Tiered monthly plans for landowners and clubs based on properties managed, members served, and feature access. Predictable, recurring revenue from day one.</p>
            </div>
            <div className="investors-detail">
              <h4>Booking Transaction Fees</h4>
              <p>A percentage on private water bookings processed through the platform. As the marketplace grows, transaction revenue scales alongside subscription revenue.</p>
            </div>
            <div className="investors-detail">
              <h4>Premium Access Tiers</h4>
              <p>Individual anglers pay for enhanced discovery, priority booking, and access to exclusive or high-demand properties — a consumer revenue layer on top of B2B SaaS.</p>
            </div>
            <div className="investors-detail">
              <h4>Early Traction</h4>
              <p>Waitlist open. Conversations underway with landowners in Colorado, Montana, and Virginia. Club partnerships in active discussion. Platform MVP in development.</p>
            </div>
          </div>

          <InvestorForm />
        </div>

        <p className="investors-note">This section is for informational purposes only and does not constitute an offer to sell or a solicitation of an offer to buy any securities.</p>
      </div>
    </section>
  );
}
