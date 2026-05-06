export type AssetUploadRequest = {
  fileName: string;
  mimeType: string;
  dataUrl: string;
  prefix?: string;
};

export type AssetUploadResponse = {
  assetUrl: string;
  fileName: string;
};
