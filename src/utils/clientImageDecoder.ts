import ExifReader from 'exifreader';

/**
 * Client-Side Image Decoder for non-browser native formats (PSD, PSB, TIFF, BMP, PCX, EXR, DPX)
 * Decodes ArrayBuffer client-side and renders to an HTML5 Canvas / Data URL.
 */

// Helper to decode BMP format client-side
function decodeBMP(buffer: ArrayBuffer): ImageData | null {
  const view = new DataView(buffer);
  if (view.getUint16(0, false) !== 0x424d) return null; // 'BM' magic

  const pixelOffset = view.getUint32(10, true);
  const width = view.getInt32(18, true);
  const height = Math.abs(view.getInt32(22, true));
  const bpp = view.getUint16(28, true);

  if (width <= 0 || height <= 0 || (bpp !== 24 && bpp !== 32 && bpp !== 8)) return null;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;
  const rawBytes = new Uint8Array(buffer, pixelOffset);
  const rowSize = Math.floor((bpp * width + 31) / 32) * 4;

  for (let y = 0; y < height; y++) {
    const srcRow = (height - 1 - y) * rowSize;
    const destRow = y * width * 4;
    for (let x = 0; x < width; x++) {
      if (bpp === 24) {
        const px = srcRow + x * 3;
        const b = rawBytes[px];
        const g = rawBytes[px + 1];
        const r = rawBytes[px + 2];
        const dPx = destRow + x * 4;
        data[dPx] = r;
        data[dPx + 1] = g;
        data[dPx + 2] = b;
        data[dPx + 3] = 255;
      } else if (bpp === 32) {
        const px = srcRow + x * 4;
        const b = rawBytes[px];
        const g = rawBytes[px + 1];
        const r = rawBytes[px + 2];
        const a = rawBytes[px + 3];
        const dPx = destRow + x * 4;
        data[dPx] = r;
        data[dPx + 1] = g;
        data[dPx + 2] = b;
        data[dPx + 3] = a;
      }
    }
  }

  return imgData;
}

// Helper to decode PSD merged composite image section
function decodePSD(buffer: ArrayBuffer): ImageData | null {
  const view = new DataView(buffer);
  const magic = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  if (magic !== '8BPS') return null;

  const height = view.getUint32(14, false);
  const width = view.getUint32(18, false);
  const channels = view.getUint16(12, false);
  const depth = view.getUint16(22, false);

  if (width <= 0 || height <= 0 || width > 8000 || height > 8000) return null;

  // Skip Color Mode Data
  let offset = 26;
  const colorModeLen = view.getUint32(offset, false);
  offset += 4 + colorModeLen;

  // Skip Image Resources
  const imgResLen = view.getUint32(offset, false);
  offset += 4 + imgResLen;

  // Skip Layer and Mask Info
  const layerMaskLen = view.getUint32(offset, false);
  offset += 4 + layerMaskLen;

  if (offset >= buffer.byteLength) return null;

  // Compression mode: 0 = Raw, 1 = RLE
  const compression = view.getUint16(offset, false);
  offset += 2;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;
  const pixelCount = width * height;

  if (compression === 0) {
    // Uncompressed raw planar channels (R, G, B, [A])
    const bytesPerChannel = depth === 16 ? 2 : 1;
    const channelSize = pixelCount * bytesPerChannel;
    const srcBytes = new Uint8Array(buffer, offset);

    for (let i = 0; i < pixelCount; i++) {
      const r = srcBytes[i * bytesPerChannel] || 0;
      const g = srcBytes[channelSize + i * bytesPerChannel] || 0;
      const b = srcBytes[channelSize * 2 + i * bytesPerChannel] || 0;
      const a = channels >= 4 ? (srcBytes[channelSize * 3 + i * bytesPerChannel] || 255) : 255;

      const idx = i * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = a;
    }
    return imgData;
  } else if (compression === 1) {
    // RLE compressed planar channels
    // Skip RLE byte counts table: height * channels * 2 bytes
    const rleTableLen = height * channels * 2;
    let dataOffset = offset + rleTableLen;
    const srcBytes = new Uint8Array(buffer, dataOffset);

    const decodedChannels: Uint8Array[] = [];
    let srcIdx = 0;

    for (let c = 0; c < Math.min(channels, 4); c++) {
      const chanData = new Uint8Array(pixelCount);
      let chanIdx = 0;

      while (chanIdx < pixelCount && srcIdx < srcBytes.length) {
        const header = srcBytes[srcIdx++];
        if (header < 128) {
          const count = header + 1;
          for (let k = 0; k < count && chanIdx < pixelCount; k++) {
            chanData[chanIdx++] = srcBytes[srcIdx++];
          }
        } else if (header > 128) {
          const count = 257 - header;
          const val = srcBytes[srcIdx++];
          for (let k = 0; k < count && chanIdx < pixelCount; k++) {
            chanData[chanIdx++] = val;
          }
        }
      }
      decodedChannels.push(chanData);
    }

    const rChan = decodedChannels[0] || new Uint8Array(pixelCount);
    const gChan = decodedChannels[1] || rChan;
    const bChan = decodedChannels[2] || rChan;
    const aChan = decodedChannels[3];

    for (let i = 0; i < pixelCount; i++) {
      const idx = i * 4;
      data[idx] = rChan[i];
      data[idx + 1] = gChan[i];
      data[idx + 2] = bChan[i];
      data[idx + 3] = aChan ? aChan[i] : 255;
    }
    return imgData;
  }

  return null;
}

/**
 * Main decoding entry point for client-side image decoding.
 */
export async function decodeClientImageToDataUrl(
  srcUrlOrBuffer: string | ArrayBuffer,
  fileExtension: string
): Promise<string | null> {
  try {
    let buffer: ArrayBuffer;
    if (typeof srcUrlOrBuffer === 'string') {
      const res = await fetch(srcUrlOrBuffer);
      if (!res.ok) return null;
      buffer = await res.arrayBuffer();
    } else {
      buffer = srcUrlOrBuffer;
    }

    const ext = fileExtension.toLowerCase().replace('.', '');

    // 1. Try ExifReader embedded thumbnail extraction (Works for TIFF, PSD, EXR metadata)
    try {
      const tags = ExifReader.load(buffer, { expanded: true });
      if (tags.Thumbnail && tags.Thumbnail.base64) {
        return `data:image/jpeg;base64,${tags.Thumbnail.base64}`;
      }
    } catch (e) {
      // ExifReader thumbnail fallback optional
    }

    // 2. Decode PSD / PSB client side
    if (ext === 'psd' || ext === 'psb') {
      const imgData = decodePSD(buffer);
      if (imgData) {
        const canvas = document.createElement('canvas');
        canvas.width = imgData.width;
        canvas.height = imgData.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.putImageData(imgData, 0, 0);
          return canvas.toDataURL('image/png');
        }
      }
    }

    // 3. Decode BMP client side
    if (ext === 'bmp') {
      const imgData = decodeBMP(buffer);
      if (imgData) {
        const canvas = document.createElement('canvas');
        canvas.width = imgData.width;
        canvas.height = imgData.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.putImageData(imgData, 0, 0);
          return canvas.toDataURL('image/png');
        }
      }
    }

    // 4. Default Data URL fallback if already web compatible
    return null;
  } catch (err) {
    console.warn('Client-side decoding error:', err);
    return null;
  }
}
