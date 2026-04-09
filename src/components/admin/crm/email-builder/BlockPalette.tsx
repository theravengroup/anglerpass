"use client";

import { PALETTE_ITEMS, type BlockType } from "./types";

interface BlockPaletteProps {
  onDragStart: (type: BlockType) => void;
}

/**
 * Sidebar palette of draggable block types.
 * Drag a block from here onto the canvas to add it.
 */
export default function BlockPalette({ onDragStart }: BlockPaletteProps) {
  return (
    <div className="space-y-1.5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
        Content Blocks
      </p>
      {PALETTE_ITEMS.map((item) => (
        <div
          key={item.type}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("block-type", item.type);
            e.dataTransfer.effectAllowed = "copy";
            onDragStart(item.type);
          }}
          className="flex cursor-grab items-center gap-2.5 rounded-md border border-stone-light/20 bg-white px-3 py-2.5 transition-all hover:border-forest/30 hover:shadow-sm active:cursor-grabbing active:shadow-md"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded bg-forest/10 text-xs font-bold text-forest">
            {item.icon}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-primary">
              {item.label}
            </p>
            <p className="truncate text-[10px] text-text-light">
              {item.description}
            </p>
          </div>
        </div>
      ))}

      {/* Template variables reference */}
      <div className="mt-4 rounded-md border border-river/20 bg-river/5 p-2.5">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-river">
          Template Variables
        </p>
        <div className="space-y-0.5 text-[10px] text-text-secondary">
          <p>
            <code className="rounded bg-white px-1 font-mono text-river">{"{{display_name}}"}</code>{" "}
            Recipient name
          </p>
          <p>
            <code className="rounded bg-white px-1 font-mono text-river">{"{{email}}"}</code>{" "}
            Recipient email
          </p>
          <p>
            <code className="rounded bg-white px-1 font-mono text-river">{"{{site_url}}"}</code>{" "}
            Site URL
          </p>
          <p>
            <code className="rounded bg-white px-1 font-mono text-river">{"{{unsubscribe_url}}"}</code>{" "}
            Unsub link
          </p>
        </div>
      </div>
    </div>
  );
}
