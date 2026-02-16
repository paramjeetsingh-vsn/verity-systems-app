
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-guard";
import { handleApiError } from "@/lib/dms/api-error-handler";
import { ShareService } from "@/services/dms/share-service";

/**
 * GET /api/secure/dms/shares
 * 
 * Lists all active share links for the tenant.
 */
export async function GET(req: Request) {
    try {
        const user = await requirePermission(req, "DMS_SHARE_READ");
        const { searchParams } = new URL(req.url);
        const documentId = searchParams.get("documentId") || undefined;

        const links = await ShareService.listShareLinks(user.tenantId, documentId);
        return NextResponse.json(links);
    } catch (error: any) {
        return handleApiError(error);
    }
}

/**
 * POST /api/secure/dms/shares
 * 
 * Creates a new share link for a document.
 */
export async function POST(req: Request) {
    try {
        const user = await requirePermission(req, "DMS_SHARE_CREATE");
        const body = await req.json();

        const shareLink = await ShareService.createShareLink({
            documentId: body.documentId,
            tenantId: user.tenantId,
            user,
            expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
            maxClicks: body.maxClicks || null
        });

        return NextResponse.json(shareLink, { status: 201 });
    } catch (error: any) {
        return handleApiError(error);
    }
}
