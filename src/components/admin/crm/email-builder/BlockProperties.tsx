"use client";

import type { EmailBlock } from "./types";
import {
  HeadingProps,
  TextProps,
  ImageProps,
  ButtonProps,
  DividerProps,
  SpacerProps,
  ColumnsProps,
} from "./BlockTypeProps";

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
