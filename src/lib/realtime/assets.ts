import type { AssetUploadRequest, AssetUploadResponse } from "@/types/assets";

function getRealtimeUrl() {
  return process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:3001";
}

export async function uploadAsset(
  payload: AssetUploadRequest,
): Promise<AssetUploadResponse> {
  const realtimeUrl = getRealtimeUrl();

  let response: Response;

  try {
    response = await fetch(`${realtimeUrl}/assets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("[assets] upload fetch failed", {
      realtimeUrl,
      fileName: payload.fileName,
      mimeType: payload.mimeType,
      error,
    });

    throw error;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Asset upload failed: ${response.status} ${errorText}`);
  }

  return (await response.json()) as AssetUploadResponse;
}
