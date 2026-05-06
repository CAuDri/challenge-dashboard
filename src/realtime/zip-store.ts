type ZipEntryInput = {
  path: string;
  data: Buffer;
};

type ZipEntryOutput = {
  path: string;
  data: Buffer;
};

const textEncoder = new TextEncoder();

const crcTable = new Uint32Array(256);

for (let i = 0; i < crcTable.length; i += 1) {
  let value = i;

  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }

  crcTable[i] = value >>> 0;
}

function getCrc32(data: Buffer) {
  let crc = 0xffffffff;

  for (const byte of data) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function getDosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const dosDate =
    ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();

  return {
    dosDate,
    dosTime,
  };
}

function writeUInt16(value: number) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value, 0);
  return buffer;
}

function writeUInt32(value: number) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value >>> 0, 0);
  return buffer;
}

export function createStoredZip(entries: ZipEntryInput[]) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;
  const { dosDate, dosTime } = getDosDateTime();

  for (const entry of entries) {
    const name = Buffer.from(textEncoder.encode(entry.path));
    const crc32 = getCrc32(entry.data);
    const size = entry.data.length;
    const localHeader = Buffer.concat([
      writeUInt32(0x04034b50),
      writeUInt16(20),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(dosTime),
      writeUInt16(dosDate),
      writeUInt32(crc32),
      writeUInt32(size),
      writeUInt32(size),
      writeUInt16(name.length),
      writeUInt16(0),
      name,
    ]);

    localParts.push(localHeader, entry.data);

    const centralHeader = Buffer.concat([
      writeUInt32(0x02014b50),
      writeUInt16(20),
      writeUInt16(20),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(dosTime),
      writeUInt16(dosDate),
      writeUInt32(crc32),
      writeUInt32(size),
      writeUInt32(size),
      writeUInt16(name.length),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt32(0),
      writeUInt32(offset),
      name,
    ]);

    centralParts.push(centralHeader);
    offset += localHeader.length + size;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const endOfCentralDirectory = Buffer.concat([
    writeUInt32(0x06054b50),
    writeUInt16(0),
    writeUInt16(0),
    writeUInt16(entries.length),
    writeUInt16(entries.length),
    writeUInt32(centralDirectory.length),
    writeUInt32(offset),
    writeUInt16(0),
  ]);

  return Buffer.concat([...localParts, centralDirectory, endOfCentralDirectory]);
}

export function readStoredZip(buffer: Buffer): ZipEntryOutput[] {
  const entries: ZipEntryOutput[] = [];
  let offset = 0;

  while (offset + 30 <= buffer.length) {
    const signature = buffer.readUInt32LE(offset);

    if (signature === 0x02014b50 || signature === 0x06054b50) {
      break;
    }

    if (signature !== 0x04034b50) {
      throw new Error("Invalid ZIP file");
    }

    const flags = buffer.readUInt16LE(offset + 6);
    const method = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const uncompressedSize = buffer.readUInt32LE(offset + 22);
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const nameEnd = nameStart + nameLength;
    const dataStart = nameEnd + extraLength;
    const dataEnd = dataStart + compressedSize;

    if (flags & 0x08) {
      throw new Error("ZIP files with data descriptors are not supported");
    }

    if (method !== 0) {
      throw new Error("Only uncompressed dashboard backups are supported");
    }

    if (compressedSize !== uncompressedSize || dataEnd > buffer.length) {
      throw new Error("Invalid ZIP entry");
    }

    const path = buffer.subarray(nameStart, nameEnd).toString("utf8");
    const data = buffer.subarray(dataStart, dataEnd);

    entries.push({
      path,
      data,
    });

    offset = dataEnd;
  }

  return entries;
}
