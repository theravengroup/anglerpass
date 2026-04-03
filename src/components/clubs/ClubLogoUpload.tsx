"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, AlertCircle, X, ImageIcon } from "lucide-react";

const TARGET_SIZE = 1200;
const MIN_SIZE = 200;
const WEBP_QUALITY = 0.85;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB after compression

interface ClubLogoUploadProps {
  /** Current logo URL */
  currentUrl: string | null;
  /** Club ID (required for upload path) */
  clubId: string;
  /** Fallback letter when no logo */
  fallback: string;
  /** Called with the new public URL after upload */
  onUploaded: (url: string) => void;
  /** Whether uploads are disabled */
  disabled?: boolean;
}

/**
 * Process a club logo:
 * - Reject below 200×200
 * - Center-crop to square
 * - Resize to 1200×1200
 * - Convert to WebP
 *
 * Logos are stored as square for consistent display across cards,
 * badges, and navigation. The upload guidance tells users to provide
 * a square image, but we center-crop gracefully if they don't.
 */
async function processLogo(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;

      if (w < MIN_SIZE || h < MIN_SIZE) {
        reject(
          new Error(
            `Image is too small (${w}×${h}). Minimum resolution is ${MIN_SIZE}×${MIN_SIZE} pixels. For best results, upload at least 1200×1200.`
          )
        );
        return;
      }

      // Center-crop to square
      const cropSize = Math.min(w, h);
      const sx = Math.round((w - cropSize) / 2);
      const sy = Math.round((h - cropSize) / 2);

      // Output at TARGET_SIZE or original if smaller
      const outputSize = Math.min(TARGET_SIZE, cropSize);

      const canvas = document.createElement("canvas");
      canvas.width = outputSize;
      canvas.height = outputSize;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, outputSize, outputSize);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to compress image"));
            return;
          }

          if (blob.size > MAX_FILE_SIZE) {
            canvas.toBlob(
              (lowerBlob) => {
                if (!lowerBlob || lowerBlob.size > MAX_FILE_SIZE) {
                  reject(
                    new Error(
                      "Image is too large even after compression. Please use a simpler or smaller image."
                    )
                  );
                  return;
                }
                resolve(lowerBlob);
              },
              "image/webp",
              0.6
            );
            return;
          }

          resolve(blob);
        },
        "image/webp",
        WEBP_QUALITY
      );
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export default function ClubLogoUpload({
  currentUrl,
  clubId,
  fallback,
  onUploaded,
  disabled = false,
}: ClubLogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayUrl = preview ?? currentUrl;

  async function handleFile(file: File) {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      setError("Only JPEG, PNG, WebP, and SVG images are accepted.");
      return;
    }

    // SVGs can be uploaded directly (vector, no resize needed)
    // But for consistency, we still convert to WebP raster
    setUploading(true);
    setError(null);

    try {
      const webpBlob = await processLogo(file);

      // Show local preview immediately
      const previewUrl = URL.createObjectURL(webpBlob);
      setPreview(previewUrl);

      // Upload via API
      const formData = new FormData();
      formData.append("file", webpBlob, `logo-${Date.now()}.webp`);
      formData.append("clubId", clubId);

      const res = await fetch("/api/clubs/logo", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const result = await res.json().catch(() => null);
        throw new Error(result?.error ?? "Upload failed");
      }

      const { url } = await res.json();
      onUploaded(url);
    } catch (err) {
      setPreview(null);
      setError(err instanceof Error ? err.message : "Failed to upload logo");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    setPreview(null);
    setError(null);

    try {
      await fetch("/api/clubs/logo", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId }),
      });
    } catch {
      // Non-critical
    }

    onUploaded("");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {/* Logo display */}
        <div className="group relative">
          <div className="flex size-20 items-center justify-center overflow-hidden rounded-xl border-2 border-river/20 bg-river/10">
            {displayUrl ? (
              <img
                src={displayUrl}
                alt="Club logo"
                className="size-full object-cover"
              />
            ) : (
              <span className="text-2xl font-semibold text-river">
                {fallback}
              </span>
            )}

            {/* Hover overlay */}
            {!disabled && !uploading && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Change club logo"
              >
                <Camera className="size-5 text-white" />
              </button>
            )}

            {/* Uploading spinner */}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50">
                <Loader2 className="size-5 animate-spin text-white" />
              </div>
            )}
          </div>

          {/* Remove button */}
          {displayUrl && !disabled && !uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-white bg-river text-white transition-colors hover:bg-red-600"
              aria-label="Remove club logo"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        {/* Upload guidance */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-text-primary">
            Club Logo{" "}
            <span className="text-xs font-normal text-text-light">(optional)</span>
          </p>
          <p className="text-xs text-text-secondary">
            Square image, at least 200×200px. Recommended 1200×1200.
          </p>
          <p className="text-xs text-text-light">
            JPEG, PNG, or WebP. Auto-converted to WebP.
          </p>
          {!displayUrl && !disabled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="mt-1 border-river/30 text-river hover:bg-river/5"
            >
              {uploading ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <ImageIcon className="mr-1.5 size-3.5" />
              )}
              Upload Logo
            </Button>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
        disabled={uploading || disabled}
      />

      {/* Error message */}
      {error && (
        <div
          className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
