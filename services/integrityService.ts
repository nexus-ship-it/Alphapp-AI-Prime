
export interface AssetManifest {
  version: string;
  [key: string]: string; // For other asset hashes
}

export const fetchAssetManifest = async (): Promise<AssetManifest> => {
  try {
    const response = await fetch('/asset-manifest.json', { cache: 'no-store' }); // Always fetch latest
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const manifest: AssetManifest = await response.json();
    return manifest;
  } catch (error) {
    console.error("Error fetching asset manifest:", error);
    throw new Error("Failed to fetch asset manifest. Could not verify app integrity.");
  }
};