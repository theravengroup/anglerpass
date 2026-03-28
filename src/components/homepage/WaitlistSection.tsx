import WaitlistForm from './WaitlistForm';

export default function WaitlistSection() {
  return (
    <section className="waitlist" id="waitlist">
      <div className="container">
        <div className="waitlist-content reveal-left">
          <span className="eyebrow">Early Access</span>
          <h2 className="section-heading">Launching Soon</h2>
          <p className="waitlist-text">AnglerPass is currently under development. We&rsquo;re building the platform with input from landowners, club operators, and anglers — the people who understand this space best.</p>
          <p className="waitlist-text">Join the waitlist to stay informed about launch updates, pilot opportunities, and early access invitations.</p>
          <div className="waitlist-features">
            <div className="waitlist-feature"><div className="waitlist-feature-check"><svg viewBox="0 0 16 16"><path d="M13 4L6.5 10.5 3.5 7.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>Priority access when the platform goes live</div>
            <div className="waitlist-feature"><div className="waitlist-feature-check"><svg viewBox="0 0 16 16"><path d="M13 4L6.5 10.5 3.5 7.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>Behind-the-scenes development updates</div>
            <div className="waitlist-feature"><div className="waitlist-feature-check"><svg viewBox="0 0 16 16"><path d="M13 4L6.5 10.5 3.5 7.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>Opportunity to join the pilot program</div>
            <div className="waitlist-feature"><div className="waitlist-feature-check"><svg viewBox="0 0 16 16"><path d="M13 4L6.5 10.5 3.5 7.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>Direct input on features and direction</div>
          </div>
        </div>
        <WaitlistForm />
      </div>
    </section>
  );
}
