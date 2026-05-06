import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";

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

function sanitizeOriginalFileName(fileName: string) {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^-+/, "")
    .slice(0, 80);
}

function getAssetPath(fileName: string) {
  const safeFileName = fileName.trim();

  if (!safeFileName || !/^[a-z0-9._-]+$/.test(safeFileName)) {
    throw new Error("Invalid asset file name");
  }

  const absolutePath = resolve(assetDirectory, safeFileName);

  if (!absolutePath.startsWith(`${assetDirectory}/`)) {
    throw new Error("Invalid asset path");
  }

  return {
    fileName: safeFileName,
    absolutePath,
  };
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
  const sanitizedOriginalName = sanitizeOriginalFileName(
    fileName.replace(/\.[^.]+$/, ""),
  );
  const assetId = crypto.randomUUID();
  const storedFileName = `${prefix}-${Date.now()}-${assetId}-${sanitizedOriginalName}${extension}`;
  const { absolutePath } = getAssetPath(storedFileName);

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
  const asset = getAssetPath(fileName);
  const data = await readFile(asset.absolutePath);
  const extension = extname(asset.fileName).toLowerCase();

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
