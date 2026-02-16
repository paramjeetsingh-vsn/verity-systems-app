
import { prisma as globalPrisma } from "@/lib/prisma";
import { AuthUser } from "@/lib/auth/auth-types";
import { S3StorageProvider } from "../storage/s3StorageProvider";
import { createAuditLog } from "@/lib/audit";

/**
 * DocumentAccessService
 * 
 * Handles secure access to documents, including generating signed URLs
 * for downloads and verifying access permissions.
 */
export class DocumentAccessService {
    /**
     * generateDocumentDownloadUrl
     * 
     * Generates a temporary (300s) signed URL for a specific document version.
     * If no versionId is provided, the current version is used.
     */
    static async generateDocumentDownloadUrl(params: {
        prisma?: any;
        tenantId: number;
        documentId: string;
        versionId?: string;
        user?: AuthUser;
    }): Promise<string> {
        const {
            prisma = globalPrisma,
            tenantId,
            documentId,
            versionId,
            user
        } = params;

        // 1. Load document with tenant scoping
        const document = await prisma.document.findUnique({
            where: { id: documentId, tenantId },
            include: {
                versions: versionId ? { where: { id: versionId } } : false
            }
        });

        if (!document) {
            throw new Error(`Document not found: ${documentId} for tenant ${tenantId}`);
        }

        let storageKey: string;
        let targetVersionId: string;

        // 2. Resolve version to download
        if (versionId) {
            const version = document.versions?.[0];
            if (!version) {
                throw new Error(`Document version not found: ${versionId} for document ${documentId}`);
            }
            storageKey = version.storageKey;
            targetVersionId = version.id;
        } else {
            // Use current version
            if (!document.currentVersionId) {
                throw new Error(`Document ${documentId} has no current version.`);
            }

            // Load current version metadata
            const currentVersion = await prisma.documentVersion.findUnique({
                where: { id: document.currentVersionId, tenantId, documentId }
            });

            if (!currentVersion) {
                throw new Error(`Current version metadata missing for document ${documentId}`);
            }

            storageKey = currentVersion.storageKey;
            targetVersionId = currentVersion.id;
        }

        // 3. Generate signed URL via S3 provider (expires in 300s)
        const storage = new S3StorageProvider();
        const signedUrl = await storage.generateDownloadUrl({
            storageKey,
            expiresInSeconds: 300
        });

        // 4. Log Audit Event
        await createAuditLog({
            tenantId,
            actorUserId: user?.sub || 0,
            action: user ? "DMS.READ_DOWNLOAD" : "DMS.SHARE_DOWNLOAD",
            details: `Generated download URL for document ${documentId} (Version: ${targetVersionId}).${!user ? " (Public access)" : ""}`,
        });

        return signedUrl;
    }
}
