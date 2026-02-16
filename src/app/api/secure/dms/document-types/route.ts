
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-guard";
import { handleApiError } from "@/lib/dms/api-error-handler";
import { DocumentTypeService } from "@/services/dms/document-type-service";

/**
 * GET /api/secure/dms/document-types
 * 
 * Lists document types.
 * Query param ?active=true for drop-downs.
 * Default lists all (for Admin).
 */
export async function GET(req: Request) {
    try {
        // Permission check: READ for list, MANAGE for full admin view?
        // Let's use DMS_DOCUMENT_READ for basic list (active), 
        // and DMS_DOCUMENT_TYPE_MANAGE for full list.
        // For simplicity, we can just require a base permission, 
        // but filtering logic should apply.

        const { searchParams } = new URL(req.url);
        const activeOnly = searchParams.get("active") === "true";

        const user = await requirePermission(req, activeOnly ? "DMS_DOCUMENT_READ" : "DMS_DOCUMENT_TYPE_MANAGE");

        const types = activeOnly
            ? await DocumentTypeService.listActiveDocumentTypes(user.tenantId)
            : await DocumentTypeService.listDocumentTypes(user.tenantId);

        return NextResponse.json(types);
    } catch (error: any) {
        return handleApiError(error);
    }
}

/**
 * POST /api/secure/dms/document-types
 * 
 * Creates a new document type.
 */
export async function POST(req: Request) {
    try {
        const user = await requirePermission(req, "DMS_DOCUMENT_TYPE_MANAGE");
        const body = await req.json();

        const docType = await DocumentTypeService.createDocumentType(
            body.name,
            user.tenantId,
            user
        );

        return NextResponse.json(docType, { status: 201 });
    } catch (error: any) {
        return handleApiError(error);
    }
}
