
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-guard";
import { handleApiError } from "@/lib/dms/api-error-handler";
import { DocumentTypeService } from "@/services/dms/document-type-service";

/**
 * PATCH /api/secure/dms/document-types/[id]
 * 
 * Updates name or reactivates a document type.
 */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await requirePermission(req, "DMS_DOCUMENT_TYPE_MANAGE");
        const body = await req.json();

        // Check for reactivation flag
        if (body.reactivate) {
            const result = await DocumentTypeService.reactivateDocumentType(id, user.tenantId, user);
            return NextResponse.json(result);
        }

        // Otherwise update name
        const result = await DocumentTypeService.updateDocumentType(id, body.name, user.tenantId, user);
        return NextResponse.json(result);

    } catch (error: any) {
        return handleApiError(error);
    }
}

/**
 * DELETE /api/secure/dms/document-types/[id]
 * 
 * Deactivates a document type.
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await requirePermission(req, "DMS_DOCUMENT_TYPE_MANAGE");

        const result = await DocumentTypeService.deactivateDocumentType(id, user.tenantId, user);
        return NextResponse.json(result);
    } catch (error: any) {
        return handleApiError(error);
    }
}
