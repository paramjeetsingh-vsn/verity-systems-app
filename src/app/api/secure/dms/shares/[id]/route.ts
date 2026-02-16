
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-guard";
import { handleApiError } from "@/lib/dms/api-error-handler";
import { ShareService } from "@/services/dms/share-service";

/**
 * DELETE /api/secure/dms/shares/[id]
 * 
 * Revokes a specific share link.
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await requirePermission(req, "DMS_SHARE_REVOKE");

        const result = await ShareService.revokeShareLink(id, user.tenantId, user);
        return NextResponse.json(result);
    } catch (error: any) {
        return handleApiError(error);
    }
}
