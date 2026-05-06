import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

export type SavedAsset = {
  fileName: string;
  assetUrl: string;
  absolutePath: string;
};

const assetDirectory = resolve(
  process.env.DASHBOARD_ASSET_DIR ?? ".data/assets",
);

const publicAssetBaseUrl =
  process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:3001";

const allowedMimeTypes = new Map<string, string>([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/svg+xml", ".svg"],
  ["image/webp", ".webp"],
]);

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^-+/, "")
    .slice(0, 80);
}

function getExtension(fileName: string, mimeType: string) {
  const mimeExtension = allowedMimeTypes.get(mimeType);

  if (!mimeExtension) {
    throw new Error(`Unsupported asset mime type: ${mimeType}`);
  }

  const originalExtension = extname(fileName).toLowerCase();

  if (originalExtension && originalExtension === mimeExtension) {
    return originalExtension;
  }

  if (mimeType === "image/jpeg" && originalExtension === ".jpeg") {
    return ".jpg";
  }

  return mimeExtension;
}

function decodeDataUrl(dataUrl: string, expectedMimeType: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);

  if (!match) {
    throw new Error("Invalid data URL");
  }

  const [, mimeType, base64Data] = match;

  if (mimeType !== expectedMimeType) {
    throw new Error(
      `Data URL mime type mismatch: expected ${expectedMimeType}, got ${mimeType}`,
    );
  }

  return Buffer.from(base64Data, "base64");
}

export async function saveDataUrlAsset({
  fileName,
  mimeType,
  dataUrl,
  prefix = "asset",
}: {
  fileName: string;
  mimeType: string;
  dataUrl: string;
  prefix?: string;
}): Promise<SavedAsset> {
  if (!allowedMimeTypes.has(mimeType)) {
    throw new Error(`Unsupported asset mime type: ${mimeType}`);
  }

  const extension = getExtension(fileName, mimeType);
  const sanitizedOriginalName = sanitizeFileName(
    fileName.replace(/\.[^.]+$/, ""),
  );
  const assetId = crypto.randomUUID();
  const storedFileName = `${prefix}-${Date.now()}-${assetId}-${sanitizedOriginalName}${extension}`;
  const absolutePath = join(assetDirectory, storedFileName);

  const fileBuffer = decodeDataUrl(dataUrl, mimeType);

  await mkdir(assetDirectory, { recursive: true });
  await writeFile(absolutePath, fileBuffer);

  return {
    fileName: storedFileName,
    assetUrl: `${publicAssetBaseUrl}/assets/${storedFileName}`,
    absolutePath,
  };
}

export async function readAsset(fileName: string) {
  const sanitizedFileName = sanitizeFileName(fileName);

  if (!sanitizedFileName || sanitizedFileName !== fileName) {
    throw new Error("Invalid asset file name");
  }

  const absolutePath = join(assetDirectory, sanitizedFileName);
  const data = await readFile(absolutePath);
  const extension = extname(sanitizedFileName).toLowerCase();

  const mimeType =
    extension === ".png"
      ? "image/png"
      : extension === ".jpg" || extension === ".jpeg"
        ? "image/jpeg"
        : extension === ".svg"
          ? "image/svg+xml"
          : extension === ".webp"
            ? "image/webp"
            : "application/octet-stream";

  return {
    data,
    mimeType,
  };
}
