
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-guard";
import { handleApiError } from "@/lib/dms/api-error-handler";
import { ShareService } from "@/services/dms/share-service";

/**
 * GET /api/secure/dms/documents/[id]/shares
 * 
 * Lists active share links for a document.
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await requirePermission(req, "DMS_SHARE_READ");

        const shares = await ShareService.listShareLinks(user.tenantId, id);
        return NextResponse.json(shares);
    } catch (error: any) {
        return handleApiError(error);
    }
}

/**
 * POST /api/secure/dms/documents/[id]/shares
 * 
 * Creates a new secure share link.
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await requirePermission(req, "DMS_SHARE_CREATE");
        const body = await req.json();

        const share = await ShareService.createShareLink({
            documentId: id,
            tenantId: user.tenantId,
            user,
            expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
            maxClicks: body.maxClicks || null
        });

        return NextResponse.json(share, { status: 201 });
    } catch (error: any) {
        return handleApiError(error);
    }
}
