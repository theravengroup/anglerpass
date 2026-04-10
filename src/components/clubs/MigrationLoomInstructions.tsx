export default function MigrationLoomInstructions() {
  return (
    <>
      <h4 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-forest">
        Before You Fill Out the Form &mdash; Record a Short Loom Video
      </h4>

      <p className="text-sm leading-relaxed text-text-secondary">
        Loom is a free screen recording tool. Before filling out the form,
        record a short video showing us where your member data currently lives.
        No preparation needed &mdash; just show us what you&rsquo;re working
        with.
      </p>

      <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-text-secondary">
        <li>
          Go to{" "}
          <a
            href="https://loom.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-river underline"
          >
            loom.com
          </a>{" "}
          and create a free account
        </li>
        <li>
          Click <strong className="text-text-primary">New Recording</strong> and
          select Screen + Camera or Screen Only
        </li>
        <li>
          Navigate to wherever your member data lives &mdash; a spreadsheet,
          software system, folder of files, anything
        </li>
        <li>
          Hit record and walk us through what you have. Aim for 2&ndash;5
          minutes.
        </li>
        <li>
          When finished, click <strong className="text-text-primary">Stop</strong>{" "}
          and copy your shareable Loom link
        </li>
        <li>Paste the link into the form below</li>
      </ol>

      {/* Loom example video embed — add src when ready */}
      <div>{/* Loom example video embed — add src when ready */}</div>
    </>
  );
}
