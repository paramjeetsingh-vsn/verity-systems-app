
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/auth-guard";
import { requirePermission } from "@/lib/auth/permission-guard";
import { handleApiError } from "@/lib/dms/api-error-handler";
import { FolderService } from "@/services/dms/folder-service";
import { FolderNotFoundError } from "@/lib/dms/errors";

/**
 * GET /api/secure/dms/folders/[id]
 * 
 * Retrieves folder details.
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await requirePermission(req, "DMS_FOLDER_READ");

        const folder = await FolderService.getFolderById(id, user.tenantId);
        if (!folder) {
            throw new FolderNotFoundError(id, user.tenantId);
        }

        return NextResponse.json(folder);
    } catch (error: any) {
        return handleApiError(error);
    }
}

/**
 * PATCH /api/secure/dms/folders/[id]
 * 
 * Updates folder (name or parent).
 */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await requirePermission(req, "DMS_FOLDER_UPDATE");
        const body = await req.json();

        const folder = await FolderService.updateFolder({
            id,
            name: body.name,
            parentId: body.parentId,
            tenantId: user.tenantId,
            user
        });

        return NextResponse.json(folder);
    } catch (error: any) {
        return handleApiError(error);
    }
}

/**
 * DELETE /api/secure/dms/folders/[id]
 * 
 * Deletes a folder.
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await requirePermission(req, "DMS_FOLDER_DELETE");

        const result = await FolderService.deleteFolder(id, user.tenantId, user);
        return NextResponse.json(result);
    } catch (error: any) {
        return handleApiError(error);
    }
}
