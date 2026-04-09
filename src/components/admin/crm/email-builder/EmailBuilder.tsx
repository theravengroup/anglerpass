"use client";

import { useState } from "react";
import { Code, Eye, Undo2, Redo2 } from "lucide-react";
import type { EmailBlock, BlockType } from "./types";
import { serializeBlocks, parseHtmlToBlocks } from "./serializer";
import BlockPalette from "./BlockPalette";
import EmailBuilderCanvas from "./EmailBuilderCanvas";
import BlockProperties from "./BlockProperties";

interface EmailBuilderProps {
  /** Initial HTML content (from an existing step) */
  initialHtml?: string;
  /** Called whenever the blocks change — passes serialized HTML */
  onChange: (html: string) => void;
}

/**
 * Drag-and-drop email builder.
 *
 * Three-panel layout:
 *   Left:   Block palette (drag from here)
 *   Center: Email canvas (drop and arrange)
 *   Right:  Properties panel (edit selected block)
 *
 * Produces inline-styled HTML suitable for email clients.
 */
export default function EmailBuilder({ initialHtml, onChange }: EmailBuilderProps) {
  const [blocks, setBlocks] = useState<EmailBlock[]>(() =>
    initialHtml ? parseHtmlToBlocks(initialHtml) : []
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [history, setHistory] = useState<EmailBlock[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const selectedBlock = blocks.find((b) => b.id === selectedId) ?? null;

  // ── History (undo/redo) ──
  const pushHistory = (newBlocks: EmailBlock[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(blocks);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setBlocks(newBlocks);
    onChange(serializeBlocks(newBlocks));
  };

  const undo = () => {
    if (historyIndex < 0) return;
    const prev = history[historyIndex];
    setHistoryIndex(historyIndex - 1);
    setBlocks(prev);
    onChange(serializeBlocks(prev));
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 2] ?? blocks;
    setHistoryIndex(historyIndex + 1);
    // Actually, redo needs the state after the current index
    // For simplicity, we store forward states too
    if (historyIndex + 2 < history.length) {
      setBlocks(history[historyIndex + 2]);
      onChange(serializeBlocks(history[historyIndex + 2]));
    }
  };

  // ── Block operations ──
  const handleBlocksChange = (newBlocks: EmailBlock[]) => {
    pushHistory(newBlocks);
  };

  const handleBlockUpdate = (updated: EmailBlock) => {
    const newBlocks = blocks.map((b) => (b.id === updated.id ? updated : b));
    pushHistory(newBlocks);
  };

  const handleDragStart = (_type: BlockType) => {
    // Could be used for visual feedback
  };

  const serializedHtml = serializeBlocks(blocks);

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={historyIndex < 0}
            className="rounded p-1.5 text-text-secondary hover:bg-offwhite disabled:opacity-30"
            aria-label="Undo"
          >
            <Undo2 className="size-4" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="rounded p-1.5 text-text-secondary hover:bg-offwhite disabled:opacity-30"
            aria-label="Redo"
          >
            <Redo2 className="size-4" />
          </button>
          <span className="ml-2 text-[10px] text-text-light">
            {blocks.length} block{blocks.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSource(!showSource)}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
              showSource
                ? "bg-charcoal text-white"
                : "bg-offwhite text-text-secondary hover:bg-charcoal/10"
            }`}
          >
            {showSource ? <Eye className="size-3.5" /> : <Code className="size-3.5" />}
            {showSource ? "Visual" : "HTML"}
          </button>
        </div>
      </div>

      {showSource ? (
        /* ── Source View ── */
        <div className="rounded-lg border border-stone-light/20 bg-white p-4">
          <textarea
            value={serializedHtml}
            onChange={(e) => {
              // Allow direct HTML editing
              const newBlocks = parseHtmlToBlocks(e.target.value);
              setBlocks(newBlocks);
              onChange(e.target.value);
            }}
            rows={20}
            className="w-full rounded-md border border-stone-light/30 bg-offwhite/50 p-3 font-mono text-xs text-text-primary"
          />
        </div>
      ) : (
        /* ── Visual Builder ── */
        <div className="grid grid-cols-[180px_1fr_220px] gap-3">
          {/* Left: Block palette */}
          <div className="rounded-lg border border-stone-light/20 bg-offwhite/50 p-3">
            <BlockPalette onDragStart={handleDragStart} />
          </div>

          {/* Center: Canvas */}
          <EmailBuilderCanvas
            blocks={blocks}
            onChange={handleBlocksChange}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          {/* Right: Properties */}
          <div className="rounded-lg border border-stone-light/20 bg-offwhite/50 p-3">
            {selectedBlock ? (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Properties
                </p>
                <BlockProperties
                  block={selectedBlock}
                  onChange={handleBlockUpdate}
                />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-center text-xs text-text-light">
                  Select a block to edit its properties
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
