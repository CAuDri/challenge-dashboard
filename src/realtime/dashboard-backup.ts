import type { PersistedDashboardState } from "@/types/persistence";
import {
  getAssetFileNameFromUrl,
  readAsset,
  restoreAsset,
} from "./asset-store";
import { createStoredZip, readStoredZip } from "./zip-store";

const dashboardStatePath = "dashboard-state.json";
const assetPathPrefix = "assets/";

function collectReferencedAssetFileNames(state: PersistedDashboardState) {
  const fileNames = new Set<string>();

  for (const team of state.teams) {
    const fileName = getAssetFileNameFromUrl(team.logoUrl);

    if (fileName) {
      fileNames.add(fileName);
    }
  }

  for (const screen of state.screens) {
    const imageFileName = getAssetFileNameFromUrl(screen.config?.image?.imageUrl);

    if (imageFileName) {
      fileNames.add(imageFileName);
    }

    const pdfFileName = getAssetFileNameFromUrl(screen.config?.pdf?.pdfUrl);

    if (pdfFileName) {
      fileNames.add(pdfFileName);
    }
  }

  return [...fileNames];
}

export async function createDashboardBackupZip(
  state: PersistedDashboardState,
) {
  const entries = [
    {
      path: dashboardStatePath,
      data: Buffer.from(JSON.stringify(state, null, 2), "utf8"),
    },
  ];

  for (const fileName of collectReferencedAssetFileNames(state)) {
    try {
      const asset = await readAsset(fileName);

      entries.push({
        path: `${assetPathPrefix}${fileName}`,
        data: asset.data,
      });
    } catch (error) {
      console.warn(
        `[backup] skipping missing referenced asset ${fileName}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  return createStoredZip(entries);
}

export async function restoreDashboardBackupZip(backup: Buffer) {
  const entries = readStoredZip(backup);
  const stateEntry = entries.find((entry) => entry.path === dashboardStatePath);

  if (!stateEntry) {
    throw new Error("Backup does not contain dashboard-state.json");
  }

  const parsedState = JSON.parse(
    stateEntry.data.toString("utf8"),
  ) as Partial<PersistedDashboardState>;

  for (const entry of entries) {
    if (!entry.path.startsWith(assetPathPrefix)) {
      continue;
    }

    const fileName = entry.path.slice(assetPathPrefix.length);

    if (fileName) {
      await restoreAsset(fileName, entry.data);
    }
  }

  return parsedState;
}
