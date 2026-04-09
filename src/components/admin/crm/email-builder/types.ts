/**
 * Email builder block types and interfaces.
 *
 * Each block represents a draggable content element in the email builder.
 * Blocks serialize to inline-styled HTML for email client compatibility.
 */

export type BlockType =
  | "heading"
  | "text"
  | "image"
  | "button"
  | "divider"
  | "spacer"
  | "columns";

export interface BaseBlock {
  id: string;
  type: BlockType;
}

export interface HeadingBlock extends BaseBlock {
  type: "heading";
  content: string;
  level: 1 | 2 | 3;
  align: "left" | "center" | "right";
}

export interface TextBlock extends BaseBlock {
  type: "text";
  content: string;
  align: "left" | "center" | "right";
}

export interface ImageBlock extends BaseBlock {
  type: "image";
  src: string;
  alt: string;
  width: "full" | "half" | "auto";
  align: "left" | "center" | "right";
  href: string;
}

export interface ButtonBlock extends BaseBlock {
  type: "button";
  label: string;
  href: string;
  align: "left" | "center" | "right";
  variant: "primary" | "secondary" | "outline";
}

export interface DividerBlock extends BaseBlock {
  type: "divider";
  style: "solid" | "dashed" | "dotted";
}

export interface SpacerBlock extends BaseBlock {
  type: "spacer";
  height: number;
}

export interface ColumnsBlock extends BaseBlock {
  type: "columns";
  layout: "50-50" | "33-67" | "67-33";
  left: string;
  right: string;
}

export type EmailBlock =
  | HeadingBlock
  | TextBlock
  | ImageBlock
  | ButtonBlock
  | DividerBlock
  | SpacerBlock
  | ColumnsBlock;

// ─── Block Palette Items ────────────────────────────────────────────

export interface PaletteItem {
  type: BlockType;
  label: string;
  icon: string;
  description: string;
}

export const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: "heading",
    label: "Heading",
    icon: "H",
    description: "Section title or headline",
  },
  {
    type: "text",
    label: "Text",
    icon: "T",
    description: "Paragraph or rich text",
  },
  {
    type: "image",
    label: "Image",
    icon: "🖼",
    description: "Photo or graphic",
  },
  {
    type: "button",
    label: "Button",
    icon: "▶",
    description: "Call-to-action button",
  },
  {
    type: "divider",
    label: "Divider",
    icon: "—",
    description: "Horizontal line",
  },
  {
    type: "spacer",
    label: "Spacer",
    icon: "↕",
    description: "Vertical spacing",
  },
  {
    type: "columns",
    label: "Columns",
    icon: "⫼",
    description: "Two-column layout",
  },
];

// ─── Default Block Factories ────────────────────────────────────────

export function createBlock(type: BlockType): EmailBlock {
  const id = crypto.randomUUID();

  switch (type) {
    case "heading":
      return { id, type, content: "Your headline here", level: 2, align: "left" };
    case "text":
      return {
        id,
        type,
        content: "Write your email content here. Use {{display_name}} to personalize.",
        align: "left",
      };
    case "image":
      return { id, type, src: "", alt: "Image description", width: "full", align: "center", href: "" };
    case "button":
      return { id, type, label: "Click Here", href: "{{site_url}}/dashboard", align: "center", variant: "primary" };
    case "divider":
      return { id, type, style: "solid" };
    case "spacer":
      return { id, type, height: 24 };
    case "columns":
      return { id, type, layout: "50-50", left: "Left column content", right: "Right column content" };
  }
}
