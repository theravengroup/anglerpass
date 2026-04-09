"use client";

import { useState, useRef } from "react";
import { GripVertical, Trash2, Copy } from "lucide-react";
import type { EmailBlock, BlockType } from "./types";
import { createBlock } from "./types";
import BlockRenderer from "./BlockRenderer";

interface EmailBuilderCanvasProps {
  blocks: EmailBlock[];
  onChange: (blocks: EmailBlock[]) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

/**
 * The main canvas — a drop zone where blocks are rendered in order.
 * Supports:
 *   - Dropping new blocks from the palette
 *   - Reordering existing blocks via drag-and-drop
 *   - Selecting a block to edit its properties
 *   - Duplicating and deleting blocks
 */
export default function EmailBuilderCanvas({
  blocks,
  onChange,
  selectedId,
  onSelect,
}: EmailBuilderCanvasProps) {
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // ── Drop from palette (new block) ──
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggedId ? "move" : "copy";
    setDropIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDropIndex(null);

    const blockType = e.dataTransfer.getData("block-type") as BlockType;
    const reorderId = e.dataTransfer.getData("reorder-id");

    if (reorderId) {
      // Reorder existing block
      const currentIndex = blocks.findIndex((b) => b.id === reorderId);
      if (currentIndex === -1 || currentIndex === index) return;

      const updated = [...blocks];
      const [moved] = updated.splice(currentIndex, 1);
      const adjustedIndex = currentIndex < index ? index - 1 : index;
      updated.splice(adjustedIndex, 0, moved);
      onChange(updated);
    } else if (blockType) {
      // Add new block from palette
      const newBlock = createBlock(blockType);
      const updated = [...blocks];
      updated.splice(index, 0, newBlock);
      onChange(updated);
      onSelect(newBlock.id);
    }

    setDraggedId(null);
  };

  const handleDragLeave = () => {
    setDropIndex(null);
  };

  // ── Reorder via drag ──
  const handleBlockDragStart = (e: React.DragEvent, blockId: string) => {
    e.dataTransfer.setData("reorder-id", blockId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedId(blockId);
  };

  const handleBlockDragEnd = () => {
    setDraggedId(null);
    setDropIndex(null);
  };

  // ── Actions ──
  const duplicateBlock = (id: string) => {
    const index = blocks.findIndex((b) => b.id === id);
    if (index === -1) return;
    const clone = { ...blocks[index], id: crypto.randomUUID() };
    const updated = [...blocks];
    updated.splice(index + 1, 0, clone);
    onChange(updated);
    onSelect(clone.id);
  };

  const deleteBlock = (id: string) => {
    onChange(blocks.filter((b) => b.id !== id));
    if (selectedId === id) onSelect(null);
  };

  return (
    <div
      ref={canvasRef}
      className="relative min-h-[400px] rounded-lg border border-stone-light/20 bg-white"
    >
      {/* Email header preview */}
      <div className="border-b border-stone-light/10 bg-offwhite/50 px-6 py-4">
        <p className="font-heading text-base text-text-secondary">
          Hi {"{{display_name}}"},
        </p>
      </div>

      {/* Block list with drop zones */}
      <div className="px-6 py-4">
        {blocks.length === 0 && (
          <DropZone
            index={0}
            isActive={dropIndex === 0}
            isEmpty
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />
        )}

        {blocks.map((block, i) => (
          <div key={block.id}>
            {/* Drop zone before this block */}
            <DropZone
              index={i}
              isActive={dropIndex === i}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />

            {/* The block itself */}
            <div
              draggable
              onDragStart={(e) => handleBlockDragStart(e, block.id)}
              onDragEnd={handleBlockDragEnd}
              onClick={() => onSelect(block.id === selectedId ? null : block.id)}
              className={`group relative rounded-md border px-3 py-2.5 transition-all ${
                selectedId === block.id
                  ? "border-forest bg-forest/[0.02] shadow-sm"
                  : "border-transparent hover:border-stone-light/30"
              } ${draggedId === block.id ? "opacity-40" : ""}`}
            >
              {/* Drag handle + actions */}
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                <GripVertical className="size-4 cursor-grab text-stone active:cursor-grabbing" />
              </div>

              <div className="absolute -right-1 top-0 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateBlock(block.id);
                  }}
                  className="rounded p-1 text-stone hover:bg-offwhite hover:text-text-primary"
                  aria-label="Duplicate block"
                >
                  <Copy className="size-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteBlock(block.id);
                  }}
                  className="rounded p-1 text-stone hover:bg-red-50 hover:text-red-500"
                  aria-label="Delete block"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>

              <BlockRenderer block={block} />
            </div>

            {/* Drop zone after the last block */}
            {i === blocks.length - 1 && (
              <DropZone
                index={i + 1}
                isActive={dropIndex === i + 1}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              />
            )}
          </div>
        ))}
      </div>

      {/* Email footer preview */}
      <div className="border-t border-stone-light/10 bg-offwhite/50 px-6 py-3">
        <p className="text-[11px] text-text-light">
          <span className="underline">Unsubscribe from marketing emails</span>
          {" · "}
          <span className="underline">Email preferences</span>
        </p>
        <p className="mt-1 text-[11px] text-text-light">
          — The AnglerPass Team
        </p>
      </div>
    </div>
  );
}

// ─── Drop Zone ──────────────────────────────────────────────────────

function DropZone({
  index,
  isActive,
  isEmpty,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  index: number;
  isActive: boolean;
  isEmpty?: boolean;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
}) {
  return (
    <div
      onDragOver={(e) => onDragOver(e, index)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
      className={`transition-all ${
        isActive
          ? "my-1 h-10 rounded-md border-2 border-dashed border-forest/40 bg-forest/5"
          : isEmpty
            ? "flex h-32 items-center justify-center rounded-md border-2 border-dashed border-stone-light/30"
            : "h-1"
      }`}
    >
      {isEmpty && !isActive && (
        <p className="text-xs text-text-light">
          Drag blocks here to build your email
        </p>
      )}
    </div>
  );
}
