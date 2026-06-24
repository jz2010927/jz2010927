import { applyOutputOptions, applyTileableBlend, buildDerivedMap, clampOutputSize, MAP_TYPES } from "./OutputOptions.js";

function renderTextureCanvas(generator, params, output, mapType = "color") {
  const canvas = document.createElement("canvas");
  canvas.width = clampOutputSize(output.width);
  canvas.height = clampOutputSize(output.height);
  generator.generate(canvas, params, { time: 0, exporting: true, mapType, tileable: output.tileable });
  applyTileableBlend(canvas, output);
  applyOutputOptions(canvas, output);
  buildDerivedMap(canvas, mapType, { generatorId: generator.id });
  return canvas;
}

function canvasToBlob(canvas, mimeType) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, 0.94);
  });
}

export function exportTexture(generator, params, output, mimeType, mapType = "color") {
  const canvas = renderTextureCanvas(generator, params, output, mapType);
  const extension = mimeType === "image/webp" ? "webp" : "png";
  const link = document.createElement("a");
  link.download = `${generator.id}-${mapType}-${canvas.width}x${canvas.height}-${params.Seed || "seed"}.${extension}`;
  link.href = canvas.toDataURL(mimeType, 0.94);
  link.click();
}

export async function createTextureBlob(generator, params, output, mimeType, mapType = "color") {
  return canvasToBlob(renderTextureCanvas(generator, params, output, mapType), mimeType);
}

export async function exportTexturePack(generator, params, output, mimeType, onProgress = () => {}) {
  const maps = generator.getMeta?.().supportedMaps || MAP_TYPES;
  const width = clampOutputSize(output.width);
  const height = clampOutputSize(output.height);
  const extension = mimeType === "image/webp" ? "webp" : "png";
  const entries = [];
  for (let index = 0; index < maps.length; index += 1) {
    onProgress(index + 1, maps.length, maps[index]);
    const mapType = maps[index];
    entries.push({
      name: `${generator.id}-${mapType}-${width}x${height}-${params.Seed || "seed"}.${extension}`,
      blob: await createTextureBlob(generator, params, output, mimeType, mapType),
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  const zip = await createZipBlob(entries);
  downloadBlob(zip, `${generator.id}-texture-pack-${width}x${height}-${params.Seed || "seed"}.zip`);
}

export function downloadBlob(blob, filename) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

let crcTable = null;

function getCrcTable() {
  if (crcTable) return crcTable;
  crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[i] = c >>> 0;
  }
  return crcTable;
}

function crc32(bytes) {
  const table = getCrcTable();
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosDate, dosTime };
}

function writeHeader(values, size) {
  const bytes = new Uint8Array(size);
  const view = new DataView(bytes.buffer);
  values.forEach(([offset, type, value]) => {
    if (type === 16) view.setUint16(offset, value, true);
    if (type === 32) view.setUint32(offset, value, true);
  });
  return bytes;
}

export async function createZipBlob(entries) {
  const encoder = new TextEncoder();
  const date = dosDateTime();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const dataBytes = new Uint8Array(await entry.blob.arrayBuffer());
    const crc = crc32(dataBytes);
    const size = dataBytes.byteLength;
    const localHeader = writeHeader([
      [0, 32, 0x04034b50],
      [4, 16, 20],
      [6, 16, 0x0800],
      [8, 16, 0],
      [10, 16, date.dosTime],
      [12, 16, date.dosDate],
      [14, 32, crc],
      [18, 32, size],
      [22, 32, size],
      [26, 16, nameBytes.length],
      [28, 16, 0],
    ], 30);
    localParts.push(localHeader, nameBytes, dataBytes);

    const centralHeader = writeHeader([
      [0, 32, 0x02014b50],
      [4, 16, 20],
      [6, 16, 20],
      [8, 16, 0x0800],
      [10, 16, 0],
      [12, 16, date.dosTime],
      [14, 16, date.dosDate],
      [16, 32, crc],
      [20, 32, size],
      [24, 32, size],
      [28, 16, nameBytes.length],
      [30, 16, 0],
      [32, 16, 0],
      [34, 16, 0],
      [36, 16, 0],
      [38, 32, 0],
      [42, 32, offset],
    ], 46);
    centralParts.push(centralHeader, nameBytes);
    offset += localHeader.byteLength + nameBytes.byteLength + dataBytes.byteLength;
  }

  const centralSize = centralParts.reduce((total, part) => total + part.byteLength, 0);
  const eocd = writeHeader([
    [0, 32, 0x06054b50],
    [4, 16, 0],
    [6, 16, 0],
    [8, 16, entries.length],
    [10, 16, entries.length],
    [12, 32, centralSize],
    [16, 32, offset],
    [20, 16, 0],
  ], 22);

  return new Blob([...localParts, ...centralParts, eocd], { type: "application/zip" });
}
