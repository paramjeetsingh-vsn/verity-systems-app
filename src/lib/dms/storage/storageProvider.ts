
/**
 * DmsStorageProvider
 * 
 * A provider-agnostic interface for DMS storage operations.
 * This allows swapping between S3, local disk, or other cloud providers
 * without changing the core business logic.
 */
export interface DmsStorageProvider {
    /**
     * Uploads a file to the storage provider.
     */
    uploadFile(params: {
        storageKey: string;
        fileBuffer: Buffer | Uint8Array;
        mimeType: string;
    }): Promise<{ etag?: string; versionId?: string }>;

    /**
     * Generates a temporary signed URL for downloading a file.
     */
    generateDownloadUrl(params: {
        storageKey: string;
        expiresInSeconds: number;
    }): Promise<string>;

    /**
     * Checks if a file exists in the storage.
     */
    fileExists(params: {
        storageKey: string;
    }): Promise<boolean>;
}
