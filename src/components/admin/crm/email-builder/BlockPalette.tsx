"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PALETTE_ITEMS, type BlockType } from "./types";

interface BlockPaletteProps {
  onDragStart: (type: BlockType) => void;
}

/**
 * Sidebar palette of draggable block types.
 * Drag a block from here onto the canvas to add it.
 */
export default function BlockPalette({ onDragStart }: BlockPaletteProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

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
            <code className="rounded bg-white px-1 font-mono text-river">{"{{ user.name }}"}</code>{" "}
            Recipient name
          </p>
          <p>
            <code className="rounded bg-white px-1 font-mono text-river">{"{{ user.email }}"}</code>{" "}
            Email address
          </p>
          <p>
            <code className="rounded bg-white px-1 font-mono text-river">{"{{ user.role }}"}</code>{" "}
            User role
          </p>
          <p>
            <code className="rounded bg-white px-1 font-mono text-river">{"{{ site_url }}"}</code>{" "}
            Site URL
          </p>
          <p>
            <code className="rounded bg-white px-1 font-mono text-river">{"{{ preferences_url }}"}</code>{" "}
            Preferences
          </p>
        </div>

        {/* Filters */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="mt-2 flex w-full items-center gap-1 text-[10px] font-medium text-river"
        >
          {showAdvanced ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          Filters &amp; Logic
        </button>

        {showAdvanced && (
          <div className="mt-1.5 space-y-1.5 border-t border-river/10 pt-1.5">
            <p className="text-[10px] font-medium text-text-secondary">
              Filters
            </p>
            <div className="space-y-0.5 text-[10px] text-text-light">
              <p>
                <code className="font-mono text-river">{"| upcase"}</code> UPPERCASE
              </p>
              <p>
                <code className="font-mono text-river">{"| capitalize"}</code> First&nbsp;Letter
              </p>
              <p>
                <code className="font-mono text-river">{"| default: \"Friend\""}</code> Fallback
              </p>
              <p>
                <code className="font-mono text-river">{"| truncate: 20"}</code> Shorten
              </p>
              <p>
                <code className="font-mono text-river">{"| currency"}</code> $0.00
              </p>
              <p>
                <code className="font-mono text-river">{"| date_format: \"long\""}</code> Date
              </p>
            </div>

            <p className="mt-1 text-[10px] font-medium text-text-secondary">
              Conditionals
            </p>
            <div className="space-y-0.5 text-[10px] text-text-light">
              <p>
                <code className="font-mono text-river">
                  {"{% if user.role == \"angler\" %}"}
                </code>
              </p>
              <p className="pl-2">...content...</p>
              <p>
                <code className="font-mono text-river">{"{% elsif user.role == \"landowner\" %}"}</code>
              </p>
              <p className="pl-2">...alt content...</p>
              <p>
                <code className="font-mono text-river">{"{% else %}"}</code>
              </p>
              <p className="pl-2">...default...</p>
              <p>
                <code className="font-mono text-river">{"{% endif %}"}</code>
              </p>
            </div>

            <p className="mt-1 text-[10px] font-medium text-text-secondary">
              Loops
            </p>
            <div className="space-y-0.5 text-[10px] text-text-light">
              <p>
                <code className="font-mono text-river">{"{% for item in items %}"}</code>
              </p>
              <p className="pl-2">
                <code className="font-mono text-river">{"{{ item.name }}"}</code>
              </p>
              <p>
                <code className="font-mono text-river">{"{% endfor %}"}</code>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
