"use client";

import type { EmailBlock, BlockType } from "./types";

interface BlockPropertiesProps {
  block: EmailBlock;
  onChange: (block: EmailBlock) => void;
}

/**
 * Properties panel — edit the selected block's settings.
 */
export default function BlockProperties({ block, onChange }: BlockPropertiesProps) {
  switch (block.type) {
    case "heading":
      return <HeadingProps block={block} onChange={onChange} />;
    case "text":
      return <TextProps block={block} onChange={onChange} />;
    case "image":
      return <ImageProps block={block} onChange={onChange} />;
    case "button":
      return <ButtonProps block={block} onChange={onChange} />;
    case "divider":
      return <DividerProps block={block} onChange={onChange} />;
    case "spacer":
      return <SpacerProps block={block} onChange={onChange} />;
    case "columns":
      return <ColumnsProps block={block} onChange={onChange} />;
  }
}

// ─── Shared Field Components ────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-text-secondary">
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-md border border-stone-light/30 px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-light"
    />
  );
}

function TextArea({
  value,
  onChange,
  rows = 4,
  placeholder,
  mono,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className={`w-full rounded-md border border-stone-light/30 px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-light ${mono ? "font-mono" : ""}`}
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-stone-light/30 px-2.5 py-1.5 text-xs text-text-primary"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

const ALIGN_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

// ─── Block-Specific Properties ──────────────────────────────────────

function HeadingProps({
  block,
  onChange,
}: {
  block: Extract<EmailBlock, { type: "heading" }>;
  onChange: (b: EmailBlock) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Heading Text">
        <TextInput
          value={block.content}
          onChange={(v) => onChange({ ...block, content: v })}
          placeholder="Your headline here..."
        />
      </Field>
      <Field label="Level">
        <SelectInput
          value={String(block.level)}
          onChange={(v) => onChange({ ...block, level: Number(v) as 1 | 2 | 3 })}
          options={[
            { value: "1", label: "H1 — Large" },
            { value: "2", label: "H2 — Medium" },
            { value: "3", label: "H3 — Small" },
          ]}
        />
      </Field>
      <Field label="Alignment">
        <SelectInput
          value={block.align}
          onChange={(v) => onChange({ ...block, align: v as "left" | "center" | "right" })}
          options={ALIGN_OPTIONS}
        />
      </Field>
    </div>
  );
}

function TextProps({
  block,
  onChange,
}: {
  block: Extract<EmailBlock, { type: "text" }>;
  onChange: (b: EmailBlock) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Content">
        <TextArea
          value={block.content}
          onChange={(v) => onChange({ ...block, content: v })}
          rows={6}
          placeholder="Write your email content here..."
        />
      </Field>
      <p className="text-[10px] text-text-light">
        Supports basic HTML: &lt;b&gt;, &lt;i&gt;, &lt;a href=&quot;...&quot;&gt;, &lt;br&gt;
      </p>
      <Field label="Alignment">
        <SelectInput
          value={block.align}
          onChange={(v) => onChange({ ...block, align: v as "left" | "center" | "right" })}
          options={ALIGN_OPTIONS}
        />
      </Field>
    </div>
  );
}

function ImageProps({
  block,
  onChange,
}: {
  block: Extract<EmailBlock, { type: "image" }>;
  onChange: (b: EmailBlock) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Image URL">
        <TextInput
          value={block.src}
          onChange={(v) => onChange({ ...block, src: v })}
          placeholder="https://..."
          type="url"
        />
      </Field>
      <Field label="Alt Text">
        <TextInput
          value={block.alt}
          onChange={(v) => onChange({ ...block, alt: v })}
          placeholder="Describe the image"
        />
      </Field>
      <Field label="Link URL (optional)">
        <TextInput
          value={block.href}
          onChange={(v) => onChange({ ...block, href: v })}
          placeholder="https://... or /dashboard"
        />
      </Field>
      <Field label="Width">
        <SelectInput
          value={block.width}
          onChange={(v) => onChange({ ...block, width: v as "full" | "half" | "auto" })}
          options={[
            { value: "full", label: "Full width" },
            { value: "half", label: "Half width" },
            { value: "auto", label: "Auto" },
          ]}
        />
      </Field>
      <Field label="Alignment">
        <SelectInput
          value={block.align}
          onChange={(v) => onChange({ ...block, align: v as "left" | "center" | "right" })}
          options={ALIGN_OPTIONS}
        />
      </Field>
    </div>
  );
}

function ButtonProps({
  block,
  onChange,
}: {
  block: Extract<EmailBlock, { type: "button" }>;
  onChange: (b: EmailBlock) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Button Label">
        <TextInput
          value={block.label}
          onChange={(v) => onChange({ ...block, label: v })}
          placeholder="Click Here"
        />
      </Field>
      <Field label="Link URL">
        <TextInput
          value={block.href}
          onChange={(v) => onChange({ ...block, href: v })}
          placeholder="https://... or /dashboard"
        />
      </Field>
      <Field label="Style">
        <SelectInput
          value={block.variant}
          onChange={(v) => onChange({ ...block, variant: v as "primary" | "secondary" | "outline" })}
          options={[
            { value: "primary", label: "Primary (Forest)" },
            { value: "secondary", label: "Secondary (River)" },
            { value: "outline", label: "Outline" },
          ]}
        />
      </Field>
      <Field label="Alignment">
        <SelectInput
          value={block.align}
          onChange={(v) => onChange({ ...block, align: v as "left" | "center" | "right" })}
          options={ALIGN_OPTIONS}
        />
      </Field>
    </div>
  );
}

function DividerProps({
  block,
  onChange,
}: {
  block: Extract<EmailBlock, { type: "divider" }>;
  onChange: (b: EmailBlock) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Line Style">
        <SelectInput
          value={block.style}
          onChange={(v) => onChange({ ...block, style: v as "solid" | "dashed" | "dotted" })}
          options={[
            { value: "solid", label: "Solid" },
            { value: "dashed", label: "Dashed" },
            { value: "dotted", label: "Dotted" },
          ]}
        />
      </Field>
    </div>
  );
}

function SpacerProps({
  block,
  onChange,
}: {
  block: Extract<EmailBlock, { type: "spacer" }>;
  onChange: (b: EmailBlock) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Height (px)">
        <input
          type="range"
          min={8}
          max={80}
          step={4}
          value={block.height}
          onChange={(e) => onChange({ ...block, height: Number(e.target.value) })}
          className="w-full"
        />
        <p className="mt-0.5 text-center text-[10px] text-text-light">
          {block.height}px
        </p>
      </Field>
    </div>
  );
}

function ColumnsProps({
  block,
  onChange,
}: {
  block: Extract<EmailBlock, { type: "columns" }>;
  onChange: (b: EmailBlock) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Layout">
        <SelectInput
          value={block.layout}
          onChange={(v) => onChange({ ...block, layout: v as "50-50" | "33-67" | "67-33" })}
          options={[
            { value: "50-50", label: "50 / 50" },
            { value: "33-67", label: "33 / 67" },
            { value: "67-33", label: "67 / 33" },
          ]}
        />
      </Field>
      <Field label="Left Column">
        <TextArea
          value={block.left}
          onChange={(v) => onChange({ ...block, left: v })}
          rows={3}
          placeholder="Left column content..."
        />
      </Field>
      <Field label="Right Column">
        <TextArea
          value={block.right}
          onChange={(v) => onChange({ ...block, right: v })}
          rows={3}
          placeholder="Right column content..."
        />
      </Field>
    </div>
  );
}
