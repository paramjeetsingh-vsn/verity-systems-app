import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-guard";
import { handleApiError } from "@/lib/dms/api-error-handler";
import { AuditService } from "@/services/dms/audit-service";

/**
 * GET /api/secure/dms/documents/[id]/audit
 * 
 * Fetches audit logs for a specific document.
 * Requires DMS_DOCUMENT_READ permission.
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: documentId } = await params;
        const { searchParams } = new URL(req.url);

        // 1. Authenticate & Authorize
        // We use DMS_DOCUMENT_READ as the baseline permission for viewing document history/audit in V1
        const user = await requirePermission(req, "DMS_DOCUMENT_READ");

        // 2. Parse Query Params
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        // 3. Service Call
        const auditLogs = await AuditService.getDocumentAuditLogs({
            tenantId: user.tenantId,
            documentId,
            page,
            limit,
            user
        });

        return NextResponse.json(auditLogs);
    } catch (error: any) {
        return handleApiError(error);
    }
}
