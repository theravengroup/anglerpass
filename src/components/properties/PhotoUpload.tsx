"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2, AlertCircle } from "lucide-react";
import { MIN_PHOTOS, MAX_PHOTOS } from "@/lib/validations/properties";
import PhotoLightbox from "@/components/properties/PhotoLightbox";

const MAX_DIMENSION = 2000;
const WEBP_QUALITY = 0.85;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB after compression

interface PhotoUploadProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  propertyId?: string;
  onEnsureSaved?: () => Promise<string | null>;
  disabled?: boolean;
}

async function compressAndConvertToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Scale down if larger than MAX_DIMENSION
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to compress image"));
            return;
          }

          if (blob.size > MAX_FILE_SIZE) {
            // Try again with lower quality
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

export default function PhotoUpload({
  photos,
  onChange,
  propertyId,
  onEnsureSaved,
  disabled = false,
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const remaining = MAX_PHOTOS - photos.length;

  const handleFiles = useCallback(
    async (files: FileList) => {
      let resolvedId = propertyId;

      // Auto-save draft if property hasn't been saved yet
      if (!resolvedId && onEnsureSaved) {
        setUploading(true);
        resolvedId = (await onEnsureSaved()) ?? undefined;
        if (!resolvedId) {
          setError("Please enter a property name before uploading photos.");
          setUploading(false);
          return;
        }
      }

      if (!resolvedId) {
        setError("Please enter a property name before uploading photos.");
        return;
      }

      const fileArray = Array.from(files).slice(0, remaining);
      if (fileArray.length === 0) return;

      // Validate file types
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];
      const invalidFiles = fileArray.filter(
        (f) => !validTypes.includes(f.type)
      );
      if (invalidFiles.length > 0) {
        setError("Only JPEG, PNG, and WebP images are accepted.");
        return;
      }

      setUploading(true);
      setError(null);

      const newUrls: string[] = [];

      for (const file of fileArray) {
        try {
          // Compress and convert to WebP
          const webpBlob = await compressAndConvertToWebP(file);

          // Upload to API
          const formData = new FormData();
          formData.append("file", webpBlob, `photo-${Date.now()}.webp`);
          formData.append("propertyId", resolvedId);

          const res = await fetch("/api/properties/photos", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const result = await res.json();
            throw new Error(result.error ?? "Upload failed");
          }

          const { url } = await res.json();
          newUrls.push(url);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to upload photo"
          );
          break;
        }
      }

      if (newUrls.length > 0) {
        onChange([...photos, ...newUrls]);
      }
      setUploading(false);
    },
    [photos, onChange, propertyId, onEnsureSaved, remaining]
  );

  function removePhoto(index: number) {
    onChange(photos.filter((_, i) => i !== index));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (disabled || uploading || remaining <= 0) return;
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-primary">
            Property Photos
          </p>
          <p className="text-xs text-text-light">
            {MIN_PHOTOS} required, {MAX_PHOTOS} maximum.{" "}
            {photos.length}/{MAX_PHOTOS} uploaded.
            {" "}Images are automatically compressed and converted to WebP.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((url, i) => (
            <div key={url} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-stone-light/20">
              <img
                src={url}
                alt={`Property photo ${i + 1}`}
                className="size-full cursor-pointer object-cover transition-transform group-hover:scale-105"
                onClick={() => setLightboxIndex(i)}
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                >
                  <X className="size-3.5" />
                </button>
              )}
              {i === 0 && (
                <span className="absolute bottom-1.5 left-1.5 rounded bg-forest/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {remaining > 0 && !disabled && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-stone-light/30 py-8 transition-colors hover:border-forest/40 hover:bg-forest/5"
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="size-8 animate-spin text-forest" />
              <p className="mt-2 text-sm text-text-secondary">
                Compressing and uploading...
              </p>
            </>
          ) : (
            <>
              <ImagePlus className="size-8 text-text-light" />
              <p className="mt-2 text-sm text-text-secondary">
                Click or drag photos here
              </p>
              <p className="mt-1 text-xs text-text-light">
                JPEG, PNG, or WebP — up to {remaining} more
              </p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = "";
            }}
            disabled={uploading || disabled}
          />
        </div>
      )}

      {photos.length < MIN_PHOTOS && photos.length > 0 && (
        <p className="text-xs text-amber-600">
          {MIN_PHOTOS - photos.length} more photo{MIN_PHOTOS - photos.length > 1 ? "s" : ""} required to submit for review.
        </p>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
