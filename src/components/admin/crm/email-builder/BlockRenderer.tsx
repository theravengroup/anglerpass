"use client";

import type { EmailBlock } from "./types";

interface BlockRendererProps {
  block: EmailBlock;
}

/**
 * Renders a visual preview of an email block in the canvas.
 * This is the WYSIWYG representation — actual email HTML is
 * produced by the serializer.
 */
export default function BlockRenderer({ block }: BlockRendererProps) {
  switch (block.type) {
    case "heading":
      return <HeadingPreview block={block} />;
    case "text":
      return <TextPreview block={block} />;
    case "image":
      return <ImagePreview block={block} />;
    case "button":
      return <ButtonPreview block={block} />;
    case "divider":
      return <DividerPreview block={block} />;
    case "spacer":
      return <SpacerPreview block={block} />;
    case "columns":
      return <ColumnsPreview block={block} />;
  }
}

// ─── Block Previews ─────────────────────────────────────────────────

function HeadingPreview({ block }: { block: Extract<EmailBlock, { type: "heading" }> }) {
  const sizes = { 1: "text-2xl", 2: "text-xl", 3: "text-lg" } as const;
  return (
    <div className={`font-heading font-semibold text-text-primary ${sizes[block.level]}`} style={{ textAlign: block.align }}>
      {block.content || "Heading"}
    </div>
  );
}

function TextPreview({ block }: { block: Extract<EmailBlock, { type: "text" }> }) {
  return (
    <div
      className="text-sm leading-relaxed text-text-secondary"
      style={{ textAlign: block.align }}
      dangerouslySetInnerHTML={{ __html: block.content || "Text content..." }}
    />
  );
}

function ImagePreview({ block }: { block: Extract<EmailBlock, { type: "image" }> }) {
  if (!block.src) {
    return (
      <div className="flex items-center justify-center rounded border border-dashed border-stone-light/40 bg-offwhite/50 py-8">
        <span className="text-xs text-text-light">Image — add URL in properties</span>
      </div>
    );
  }

  const widthClass = block.width === "full" ? "w-full" : block.width === "half" ? "w-1/2" : "w-auto";
  const alignClass = block.align === "center" ? "mx-auto" : block.align === "right" ? "ml-auto" : "";

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={block.src}
      alt={block.alt}
      className={`max-w-full rounded ${widthClass} ${alignClass}`}
    />
  );
}

function ButtonPreview({ block }: { block: Extract<EmailBlock, { type: "button" }> }) {
  const variantClasses = {
    primary: "bg-forest text-white border-forest",
    secondary: "bg-river text-white border-river",
    outline: "bg-transparent text-forest border-forest",
  } as const;

  const alignClass = block.align === "center" ? "text-center" : block.align === "right" ? "text-right" : "text-left";

  return (
    <div className={alignClass}>
      <span
        className={`inline-block rounded-md border-2 px-6 py-3 text-sm font-medium ${variantClasses[block.variant]}`}
      >
        {block.label || "Button"}
      </span>
    </div>
  );
}

function DividerPreview({ block }: { block: Extract<EmailBlock, { type: "divider" }> }) {
  const styleMap = { solid: "border-solid", dashed: "border-dashed", dotted: "border-dotted" } as const;
  return <hr className={`border-t border-stone-light/40 ${styleMap[block.style]}`} />;
}

function SpacerPreview({ block }: { block: Extract<EmailBlock, { type: "spacer" }> }) {
  return (
    <div
      className="flex items-center justify-center bg-offwhite/30"
      style={{ height: `${block.height}px` }}
    >
      <span className="text-[10px] text-text-light">{block.height}px</span>
    </div>
  );
}

function ColumnsPreview({ block }: { block: Extract<EmailBlock, { type: "columns" }> }) {
  const splits = { "50-50": ["1fr", "1fr"], "33-67": ["1fr", "2fr"], "67-33": ["2fr", "1fr"] } as const;
  const [left, right] = splits[block.layout];

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `${left} ${right}` }}>
      <div className="rounded border border-dashed border-stone-light/30 p-2 text-xs text-text-secondary">
        {block.left || "Left column"}
      </div>
      <div className="rounded border border-dashed border-stone-light/30 p-2 text-xs text-text-secondary">
        {block.right || "Right column"}
      </div>
    </div>
  );
}
