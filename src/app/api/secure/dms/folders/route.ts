
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/auth-guard";
import { requirePermission } from "@/lib/auth/permission-guard";
import { handleApiError } from "@/lib/dms/api-error-handler";
import { FolderService } from "@/services/dms/folder-service";

/**
 * GET /api/secure/dms/folders
 * 
 * Lists all folders for the tenant (flat list for hierarchy building).
 */
export async function GET(req: Request) {
    try {
        const user = await requirePermission(req, "DMS_FOLDER_READ");
        const { searchParams } = new URL(req.url);
        const parentId = searchParams.get("parentId");

        const folders = await FolderService.listFolders({
            parentId: parentId || null,
            tenantId: user.tenantId
        });
        return NextResponse.json(folders);
    } catch (error: any) {
        return handleApiError(error);
    }
}

/**
 * POST /api/secure/dms/folders
 * 
 * Creates a new folder.
 */
export async function POST(req: Request) {
    try {
        const user = await requirePermission(req, "DMS_FOLDER_CREATE");
        const body = await req.json();

        const folder = await FolderService.createFolder({
            name: body.name,
            parentId: body.parentId,
            tenantId: user.tenantId,
            user
        });

        return NextResponse.json(folder, { status: 201 });
    } catch (error: any) {
        return handleApiError(error);
    }
}
