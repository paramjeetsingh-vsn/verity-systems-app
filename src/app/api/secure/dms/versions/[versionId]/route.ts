
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-guard";
import { handleApiError } from "@/lib/dms/api-error-handler";
import { VersionService } from "@/services/dms/version-service";

/**
 * GET /api/secure/dms/versions/[versionId]
 * 
 * Retrieves details for a specific document version.
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ versionId: string }> }
) {
    try {
        const { versionId } = await params;
        const user = await requirePermission(req, "DMS_DOCUMENT_READ");

        const version = await VersionService.getVersionById(versionId, user.tenantId);

        if (!version) {
            return NextResponse.json({ message: "Version not found" }, { status: 404 });
        }

        return NextResponse.json(version);
    } catch (error: any) {
        return handleApiError(error);
    }
}
