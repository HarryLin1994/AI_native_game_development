export async function extractPhotoMetadataFromFile(file) {
  const base = {
    source: "file_upload",
    fileName: file?.name ?? "",
    mime: file?.type ?? "",
    capturedAt: "",
    localDate: "",
    location: null,
    exifPresent: false
  };

  if (!file || !/^image\/jpe?g$/iu.test(file.type || "")) return base;

  try {
    const buffer = await file.arrayBuffer();
    const exif = readJpegExif(buffer);
    if (!exif) return base;
    const captured = readExifCapturedAt(exif);
    const location = readExifGpsLocation(exif);
    return {
      ...base,
      capturedAt: captured.capturedAt,
      localDate: captured.localDate,
      location,
      exifPresent: true
    };
  } catch {
    return base;
  }
}

export function createRuntimeCaptureMoment() {
  const now = new Date();
  let timezone = "unknown";
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown";
  } catch {
    timezone = "unknown";
  }
  return {
    capturedAt: now.toISOString(),
    localDate: formatLocalDate(now),
    timezone
  };
}

function readJpegExif(buffer) {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null;

  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    if (view.getUint8(offset) !== 0xff) return null;
    const marker = view.getUint8(offset + 1);
    const segmentLength = view.getUint16(offset + 2, false);
    if (marker === 0xe1 && offset + 4 + segmentLength <= view.byteLength) {
      const exifHeader = readAscii(view, offset + 4, 6);
      if (exifHeader === "Exif\0\0") {
        return readTiffExif(view, offset + 10);
      }
    }
    offset += 2 + segmentLength;
  }
  return null;
}

function readTiffExif(view, tiffOffset) {
  const order = readAscii(view, tiffOffset, 2);
  const littleEndian = order === "II";
  if (!littleEndian && order !== "MM") return null;
  if (readUint16(view, tiffOffset + 2, littleEndian) !== 42) return null;

  const ifd0Offset = readUint32(view, tiffOffset + 4, littleEndian);
  const ifd0 = readIfd(view, tiffOffset, tiffOffset + ifd0Offset, littleEndian);
  const exifIfdOffset = readNumberTag(ifd0.get(0x8769));
  const gpsIfdOffset = readNumberTag(ifd0.get(0x8825));
  return {
    ifd0,
    exif: exifIfdOffset ? readIfd(view, tiffOffset, tiffOffset + exifIfdOffset, littleEndian) : new Map(),
    gps: gpsIfdOffset ? readIfd(view, tiffOffset, tiffOffset + gpsIfdOffset, littleEndian) : new Map()
  };
}

function readIfd(view, tiffOffset, ifdOffset, littleEndian) {
  const tags = new Map();
  if (ifdOffset <= 0 || ifdOffset + 2 > view.byteLength) return tags;
  const count = readUint16(view, ifdOffset, littleEndian);
  for (let index = 0; index < count; index += 1) {
    const entryOffset = ifdOffset + 2 + index * 12;
    if (entryOffset + 12 > view.byteLength) break;
    const tag = readUint16(view, entryOffset, littleEndian);
    const type = readUint16(view, entryOffset + 2, littleEndian);
    const valueCount = readUint32(view, entryOffset + 4, littleEndian);
    const valueOffset = readUint32(view, entryOffset + 8, littleEndian);
    tags.set(tag, {
      view,
      tiffOffset,
      entryOffset,
      type,
      count: valueCount,
      valueOffset,
      littleEndian
    });
  }
  return tags;
}

function readExifCapturedAt(exif) {
  const rawDate =
    readAsciiTag(exif.exif.get(0x9003)) ||
    readAsciiTag(exif.exif.get(0x9004)) ||
    readAsciiTag(exif.ifd0.get(0x0132));
  const offset =
    readAsciiTag(exif.exif.get(0x9011)) ||
    readAsciiTag(exif.exif.get(0x9012)) ||
    "";
  if (!rawDate) return { capturedAt: "", localDate: "" };

  const match = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(rawDate);
  if (!match) return { capturedAt: "", localDate: "" };
  const [, year, month, day, hour, minute, second] = match;
  const localDate = `${year}-${month}-${day}`;
  const timezoneOffset = /^[+-]\d{2}:\d{2}$/u.test(offset) ? offset : "";
  return {
    capturedAt: `${localDate}T${hour}:${minute}:${second}${timezoneOffset}`,
    localDate
  };
}

function readExifGpsLocation(exif) {
  const latRef = readAsciiTag(exif.gps.get(0x0001));
  const latitude = readGpsCoordinate(exif.gps.get(0x0002), latRef);
  const lonRef = readAsciiTag(exif.gps.get(0x0003));
  const longitude = readGpsCoordinate(exif.gps.get(0x0004), lonRef);
  if (latitude === null || longitude === null) return null;
  return {
    coordinates: {
      latitude,
      longitude
    },
    acquisitionMethod: "photo_exif_gps",
    accuracyMeters: null
  };
}

function readGpsCoordinate(tag, ref) {
  const values = readRationalArrayTag(tag);
  if (!values || values.length < 3) return null;
  const decimal = values[0] + values[1] / 60 + values[2] / 3600;
  const sign = /[SW]/iu.test(ref) ? -1 : 1;
  return Number((decimal * sign).toFixed(6));
}

function readAsciiTag(tag) {
  if (!tag || tag.type !== 2) return "";
  const bytes = readValueBytes(tag);
  return bytesToAscii(bytes).replace(/\0+$/u, "").trim();
}

function readNumberTag(tag) {
  if (!tag) return 0;
  if (tag.type === 3 && tag.count === 1) return readUint16(tag.view, tag.entryOffset + 8, tag.littleEndian);
  if (tag.type === 4 && tag.count === 1) return tag.valueOffset;
  return 0;
}

function readRationalArrayTag(tag) {
  if (!tag || tag.type !== 5) return null;
  const offset = tag.tiffOffset + tag.valueOffset;
  const values = [];
  for (let index = 0; index < tag.count; index += 1) {
    const itemOffset = offset + index * 8;
    if (itemOffset + 8 > tag.view.byteLength) break;
    const numerator = readUint32(tag.view, itemOffset, tag.littleEndian);
    const denominator = readUint32(tag.view, itemOffset + 4, tag.littleEndian);
    values.push(denominator ? numerator / denominator : 0);
  }
  return values;
}

function readValueBytes(tag) {
  const byteCount = getTypeByteSize(tag.type) * tag.count;
  const offset = byteCount <= 4 ? tag.entryOffset + 8 : tag.tiffOffset + tag.valueOffset;
  if (offset < 0 || offset + byteCount > tag.view.byteLength) return new Uint8Array();
  return new Uint8Array(tag.view.buffer, tag.view.byteOffset + offset, byteCount);
}

function getTypeByteSize(type) {
  return {
    1: 1,
    2: 1,
    3: 2,
    4: 4,
    5: 8,
    7: 1,
    9: 4,
    10: 8
  }[type] ?? 1;
}

function readAscii(view, offset, length) {
  if (offset < 0 || offset + length > view.byteLength) return "";
  const bytes = new Uint8Array(view.buffer, view.byteOffset + offset, length);
  return bytesToAscii(bytes);
}

function bytesToAscii(bytes) {
  return Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
}

function readUint16(view, offset, littleEndian) {
  if (offset + 2 > view.byteLength) return 0;
  return view.getUint16(offset, littleEndian);
}

function readUint32(view, offset, littleEndian) {
  if (offset + 4 > view.byteLength) return 0;
  return view.getUint32(offset, littleEndian);
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
