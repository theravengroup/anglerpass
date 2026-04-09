import { ImageResponse } from 'next/og';
import sharp from 'sharp';

/**
 * Wraps ImageResponse to produce actual JPEG output via sharp.
 * ImageResponse always generates PNG internally — this converts
 * the buffer to JPEG for ~70-80% smaller file sizes.
 */
export async function jpegOgImage(
  element: React.ReactElement,
  options: { width: number; height: number }
): Promise<Response> {
  const pngResponse = new ImageResponse(element, options);
  const pngBuffer = Buffer.from(await pngResponse.arrayBuffer());
  const jpegBuffer = await sharp(pngBuffer).jpeg({ quality: 80 }).toBuffer();

  return new Response(new Uint8Array(jpegBuffer), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
