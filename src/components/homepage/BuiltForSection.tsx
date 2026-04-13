 
export default function BuiltForSection() {
  return (
    <section className="built-for" id="built-for">
      <div className="container">
        <div className="built-for-header reveal">
          <span className="eyebrow">Who It&apos;s For</span>
          <h2 className="section-heading">Built for the{' '}<br />Private Water Ecosystem</h2>
          <p className="section-subhead" style={{ margin: '0 auto' }}>Every feature was designed with the specific needs{' '}<br />of four core audiences in mind.</p>
        </div>
        <div className="built-for-rows">
          <div className="built-for-row reveal">
            <div className="built-for-img">
              <img src="/images/virginia.webp" alt="Angler fly fishing on a private Virginia river at golden hour" />
            </div>
            <div className="built-for-text">
              <span className="built-for-label">For Landowners</span>
              <h3>Private Landowners</h3>
              <p>You own the water. AnglerPass gives you a professional way to register your properties, manage who has access, control availability, and present your waters in a way that attracts the right anglers — not just anyone with a rod.</p>
              <a href="/landowners" className="btn btn-primary">Register Your Property</a>
            </div>
          </div>
          <div className="built-for-row reveal">
            <div className="built-for-img">
              <img src="/images/minnesota.webp" alt="Two anglers fly fishing on a private Minnesota lake in autumn" />
            </div>
            <div className="built-for-text">
              <span className="built-for-label">For Clubs</span>
              <h3>Clubs &amp; Associations</h3>
              <p>Managing memberships, scheduling water access, and keeping track of participation shouldn&apos;t require a full-time administrator. AnglerPass gives your club the operational backbone to run smoothly so members can focus on fishing.</p>
              <a href="/clubs" className="btn btn-river">Streamline Your Club</a>
            </div>
          </div>
          <div className="built-for-row reveal">
            <div className="built-for-img">
              <img src="/images/river-mountains-angler.webp" alt="Angler fly fishing in turquoise river with mountains" />
            </div>
            <div className="built-for-text">
              <span className="built-for-label">For Anglers</span>
              <h3>Anglers</h3>
              <p>You know the quality of private water is unmatched. Join a club on AnglerPass and get access to vetted private waters you won&apos;t find anywhere else — with real availability, transparent rod fees, and a booking system that respects the resource.</p>
              <a href="/anglers" className="btn btn-bronze">Find Private Water</a>
            </div>
          </div>
          <div className="built-for-row reveal">
            <div className="built-for-img">
              <img src="/images/womananglerwithguide.webp" alt="Fly fishing guide helping an angler on a private river" />
            </div>
            <div className="built-for-text">
              <span className="built-for-label">For Guides</span>
              <h3>Professional Guides</h3>
              <p>Your skills deserve private water. AnglerPass lets verified guides request access to club and landowner properties, set their own rates, and get booked directly by anglers. No cold calls, no middlemen — just more days on the water doing what you do best.</p>
              <a href="/guides" className="btn btn-charcoal">Join as a Guide</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
