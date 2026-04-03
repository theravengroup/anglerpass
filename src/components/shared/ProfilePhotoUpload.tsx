"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, AlertCircle, X } from "lucide-react";

const TARGET_SIZE = 1200;
const MIN_SIZE = 400;
const WEBP_QUALITY = 0.85;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB after compression

interface ProfilePhotoUploadProps {
  /** Current photo URL (avatar_url or profile_photo_url) */
  currentUrl: string | null;
  /** Fallback initials when no photo */
  fallback: string;
  /** Called with the new public URL after upload */
  onUploaded: (url: string) => void;
  /** Whether uploads are disabled */
  disabled?: boolean;
  /** Accent color class for the ring/border */
  accentColor?: string;
}

/**
 * Validate minimum resolution (400×400) and convert to a square 1200×1200 WebP.
 * Rejects images below MIN_SIZE in either dimension.
 * Center-crops non-square images before resizing.
 */
async function processProfilePhoto(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;

      if (w < MIN_SIZE || h < MIN_SIZE) {
        reject(
          new Error(
            `Image is too small (${w}×${h}). Minimum resolution is ${MIN_SIZE}×${MIN_SIZE} pixels.`
          )
        );
        return;
      }

      // Center-crop to square
      const cropSize = Math.min(w, h);
      const sx = Math.round((w - cropSize) / 2);
      const sy = Math.round((h - cropSize) / 2);

      const canvas = document.createElement("canvas");
      canvas.width = TARGET_SIZE;
      canvas.height = TARGET_SIZE;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Draw the center-cropped square, scaled to TARGET_SIZE
      ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, TARGET_SIZE, TARGET_SIZE);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to compress image"));
            return;
          }

          // If still over 2MB, try lower quality
          if (blob.size > MAX_FILE_SIZE) {
            canvas.toBlob(
              (lowerBlob) => {
                if (!lowerBlob || lowerBlob.size > MAX_FILE_SIZE) {
                  reject(
                    new Error(
                      "Image is too large even after compression. Please use a smaller image."
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

export default function ProfilePhotoUpload({
  currentUrl,
  fallback,
  onUploaded,
  disabled = false,
  accentColor = "forest",
}: ProfilePhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayUrl = preview ?? currentUrl;

  async function handleFile(file: File) {
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are accepted.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Process: validate resolution, center-crop, resize to 1200×1200, convert to WebP
      const webpBlob = await processProfilePhoto(file);

      // Show local preview immediately
      const previewUrl = URL.createObjectURL(webpBlob);
      setPreview(previewUrl);

      // Upload via API
      const formData = new FormData();
      formData.append("file", webpBlob, `profile-${Date.now()}.webp`);

      const res = await fetch("/api/profile/photo", {
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
      setError(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    setPreview(null);
    setError(null);

    try {
      await fetch("/api/profile/photo", { method: "DELETE" });
    } catch {
      // Non-critical — DB update is what matters
    }

    onUploaded("");
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar display */}
      <div className="group relative">
        <div
          className={`flex size-28 items-center justify-center overflow-hidden rounded-full border-2 border-${accentColor}/20 bg-${accentColor}/10`}
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Profile photo"
              className="size-full object-cover"
            />
          ) : (
            <span className={`text-3xl font-semibold text-${accentColor}`}>
              {fallback}
            </span>
          )}

          {/* Overlay on hover */}
          {!disabled && !uploading && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Change profile photo"
            >
              <Camera className="size-6 text-white" />
            </button>
          )}

          {/* Uploading spinner */}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <Loader2 className="size-6 animate-spin text-white" />
            </div>
          )}
        </div>

        {/* Remove button */}
        {displayUrl && !disabled && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            className={`absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full border-2 border-white bg-${accentColor} text-white transition-colors hover:bg-red-600`}
            aria-label="Remove profile photo"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Guidance text */}
      <div className="text-center">
        <p className="text-xs text-text-secondary">
          Square photo, at least 400×400 pixels
        </p>
        <p className="text-xs text-text-light">
          Automatically resized to 1200×1200 &amp; converted to WebP
        </p>
      </div>

      {/* Upload button for when there's no photo */}
      {!displayUrl && !disabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`border-${accentColor}/30 text-${accentColor} hover:bg-${accentColor}/5`}
        >
          {uploading ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <Camera className="mr-1.5 size-4" />
          )}
          Upload Photo
        </Button>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
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
