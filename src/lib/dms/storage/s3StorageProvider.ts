
import {
    S3Client,
    PutObjectCommand,
    HeadObjectCommand,
    GetObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { DmsStorageProvider } from "./storageProvider";

/**
 * S3StorageProvider
 * 
 * S3-compatible implementation of DmsStorageProvider.
 * Supports AWS S3, MinIO, Cloudflare R2, and other S3-compatible providers.
 */
export class S3StorageProvider implements DmsStorageProvider {
    private client: S3Client;
    private bucket: string;

    constructor() {
        const endpoint = process.env.DMS_STORAGE_ENDPOINT;
        const region = process.env.DMS_STORAGE_REGION || "auto"; // Default to auto for R2/MinIO
        const accessKeyId = process.env.DMS_STORAGE_ACCESS_KEY;
        const secretAccessKey = process.env.DMS_STORAGE_SECRET_KEY;
        const bucket = process.env.DMS_STORAGE_BUCKET;

        if (!accessKeyId || !secretAccessKey || !bucket) {
            throw new Error(
                "S3 Storage Configuration Error: Missing ACCESS_KEY, SECRET_KEY, or BUCKET."
            );
        }

        this.bucket = bucket;

        this.client = new S3Client({
            endpoint,
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
            // Essential for MinIO and some non-AWS S3 providers
            forcePathStyle: true,
        });
    }

    /**
     * Uploads a file buffer to S3.
     * ACL is explicitly NOT set to allow public access.
     */
    async uploadFile(params: {
        storageKey: string;
        fileBuffer: Buffer | Uint8Array;
        mimeType: string;
    }): Promise<{ etag?: string; versionId?: string }> {
        const { storageKey, fileBuffer, mimeType } = params;

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: storageKey,
            Body: fileBuffer,
            ContentType: mimeType,
            // No ACL: Defaults to private or bucket policy
        });

        const response = await this.client.send(command);

        return {
            etag: response.ETag,
            versionId: response.VersionId,
        };
    }

    /**
     * Generates a temporary signed URL for downloading.
     */
    async generateDownloadUrl(params: {
        storageKey: string;
        expiresInSeconds: number;
    }): Promise<string> {
        const { storageKey, expiresInSeconds } = params;

        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: storageKey,
        });

        return await getSignedUrl(this.client, command, {
            expiresIn: expiresInSeconds,
        });
    }

    /**
     * Checks if a document version exists in storage.
     */
    async fileExists(params: {
        storageKey: string;
    }): Promise<boolean> {
        const { storageKey } = params;

        try {
            const command = new HeadObjectCommand({
                Bucket: this.bucket,
                Key: storageKey,
            });

            await this.client.send(command);
            return true;
        } catch (error: any) {
            if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
                return false;
            }
            throw error;
        }
    }
}
