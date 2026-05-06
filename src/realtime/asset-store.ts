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

const publicAssetBaseUrl = process.env.PUBLIC_DASHBOARD_URL ?? "http://localhost";

const allowedMimeTypes = new Map<string, string>([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/svg+xml", ".svg"],
  ["image/webp", ".webp"],
  ["application/pdf", ".pdf"],
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

export function getAssetFileNameFromUrl(assetUrl: string | undefined) {
  if (!assetUrl) {
    return undefined;
  }

  try {
    const url = new URL(assetUrl, publicAssetBaseUrl);
    const marker = "/assets/";
    const markerIndex = url.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return undefined;
    }

    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
  } catch {
    return undefined;
  }
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
    assetUrl: `/assets/${storedFileName}`,
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
            : extension === ".pdf"
              ? "application/pdf"
            : "application/octet-stream";

  return {
    data,
    mimeType,
  };
}

export async function restoreAsset(fileName: string, data: Buffer) {
  const asset = getAssetPath(fileName);

  await mkdir(assetDirectory, { recursive: true });
  await writeFile(asset.absolutePath, data);
}
