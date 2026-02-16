
import { NextResponse } from "next/server";
import { ShareService } from "@/services/dms/share-service";
import { handleApiError } from "@/lib/dms/api-error-handler";
import { DocumentAccessService } from "@/lib/dms/services/document-access-service";

/**
 * GET /api/public/dms/share/[token]
 * 
 * Public endpoint to validate a share link and provide a temporary download URL.
 * No authentication required.
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;

        // 1. Validate Token (Increments clicks, checks expiry)
        const validationResult = await ShareService.validateShareToken(token);

        if (!validationResult) {
            return NextResponse.json({ message: "Invalid or expired share link" }, { status: 404 });
        }

        const { document, linkDetails } = validationResult;

        // 2. Generate Signed URL for current version
        // Public shares always target the current version at the time of access
        const downloadUrl = await DocumentAccessService.generateDocumentDownloadUrl({
            tenantId: document.tenantId,
            documentId: document.id,
            versionId: document.currentVersionId || undefined
        });

        // 3. Return Metadata + URL
        return NextResponse.json({
            document: {
                id: document.id,
                title: document.title,
                description: document.description,
                fileName: document.currentVersion?.fileName,
                fileSize: document.currentVersion?.fileSize,
                mimeType: document.currentVersion?.mimeType,
                updatedAt: document.updatedAt
            },
            downloadUrl,
            expiresAt: linkDetails.expiresAt
        });

    } catch (error: any) {
        return handleApiError(error);
    }
}
