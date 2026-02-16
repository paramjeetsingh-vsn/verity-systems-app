
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/auth-guard";
import { requirePermission } from "@/lib/auth/permission-guard";
import { handleApiError } from "@/lib/dms/api-error-handler";
import { DocumentService } from "@/services/dms/document-service";

/**
 * GET /api/secure/dms/documents
 * 
 * Lists documents with optional folder/status/search filters.
 */
export async function GET(req: Request) {
    try {
        const user = await requirePermission(req, "DMS_DOCUMENT_READ");
        const { searchParams } = new URL(req.url);

        const folderId = searchParams.get("folderId");
        // folderId is optional. If not provided, listDocuments will return all documents (or filtered by search).


        const documents = await DocumentService.listDocuments({
            tenantId: user.tenantId,
            folderId: folderId || undefined,
            search: searchParams.get("search") || undefined,
        });

        return NextResponse.json(documents);
    } catch (error: any) {
        return handleApiError(error);
    }
}

/**
 * POST /api/secure/dms/documents
 * 
 * Creates a new document record (DRAFT).
 */
export async function POST(req: Request) {
    try {
        const user = await requirePermission(req, "DMS_DOCUMENT_CREATE");
        const body = await req.json();

        const document = await DocumentService.createDocument({
            title: body.title,
            description: body.description,
            folderId: body.folderId,
            expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
            typeId: body.typeId,
            tenantId: user.tenantId,
            user
        });

        return NextResponse.json(document, { status: 201 });
    } catch (error: any) {
        return handleApiError(error);
    }
}
