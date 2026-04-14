import "server-only";

/**
 * Minimal magic-byte sniffer for the file types AnglerPass accepts on
 * upload. We never trust `File.type` (client-controlled) or `file.name`
 * extensions — both can be forged to slip non-image bytes into an image
 * bucket. This sniffs the first few bytes and returns a canonical MIME
 * type or `null` if the signature doesn't match anything we accept.
 *
 * Supported signatures:
 *  - image/webp   RIFF....WEBP
 *  - image/png    89 50 4E 47 0D 0A 1A 0A
 *  - image/jpeg   FF D8 FF
 *  - application/pdf  25 50 44 46 2D  ("%PDF-")
 */
export type SniffedMime =
  | "image/webp"
  | "image/png"
  | "image/jpeg"
  | "application/pdf";

export async function sniffMimeType(file: File): Promise<SniffedMime | null> {
  // 12 bytes covers every signature above.
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (head.length < 4) return null;

  // PNG
  if (
    head[0] === 0x89 &&
    head[1] === 0x50 &&
    head[2] === 0x4e &&
    head[3] === 0x47 &&
    head[4] === 0x0d &&
    head[5] === 0x0a &&
    head[6] === 0x1a &&
    head[7] === 0x0a
  ) {
    return "image/png";
  }

  // JPEG
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return "image/jpeg";
  }

  // PDF — "%PDF-"
  if (
    head[0] === 0x25 &&
    head[1] === 0x50 &&
    head[2] === 0x44 &&
    head[3] === 0x46 &&
    head[4] === 0x2d
  ) {
    return "application/pdf";
  }

  // WEBP — "RIFF" .... "WEBP"
  if (
    head.length >= 12 &&
    head[0] === 0x52 &&
    head[1] === 0x49 &&
    head[2] === 0x46 &&
    head[3] === 0x46 &&
    head[8] === 0x57 &&
    head[9] === 0x45 &&
    head[10] === 0x42 &&
    head[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

/**
 * Map a sniffed MIME type to a canonical, short extension. Prefer this
 * over anything derived from `file.name`, which can contain path
 * separators, multiple dots, or adversarial extensions.
 */
export function extForMime(mime: SniffedMime): string {
  switch (mime) {
    case "image/webp":
      return "webp";
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "application/pdf":
      return "pdf";
  }
}
