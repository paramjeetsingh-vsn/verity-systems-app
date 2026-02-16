
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-guard";
import { handleApiError } from "@/lib/dms/api-error-handler";
import { DmsQueryService } from "@/services/dms/query-service";

/**
 * GET /api/secure/dms/query/documents/search
 * 
 * Searches documents by title for the tenant.
 */
export async function GET(req: Request) {
    try {
        const user = await requirePermission(req, "DMS_DOCUMENT_READ");
        const { searchParams } = new URL(req.url);
        const title = searchParams.get("title") || "";

        if (!title) {
            return NextResponse.json([], { status: 200 });
        }

        const results = await DmsQueryService.searchDocumentsByTitle(title, user.tenantId);
        return NextResponse.json(results);
    } catch (error: any) {
        return handleApiError(error);
    }
}
