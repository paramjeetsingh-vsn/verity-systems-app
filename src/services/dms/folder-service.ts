
import { prisma as globalPrisma } from "@/lib/prisma";
import { AuthUser } from "@/lib/auth/auth-types";
import { createAuditLog } from "@/lib/audit";
import { FolderNotFoundError, FolderNotEmptyError } from "@/lib/dms/errors";

export interface CreateFolderParams {
    name: string;
    parentId?: string;
    tenantId: number;
    user: AuthUser;
}

export interface UpdateFolderParams {
    id: string;
    name?: string;
    parentId?: string;
    tenantId: number;
    user: AuthUser;
}

export class FolderService {
    /**
     * createFolder
     * 
     * Creates a new folder within a tenant's scope.
     */
    static async createFolder(params: CreateFolderParams, tx?: any) {
        const { name, parentId, tenantId, user } = params;
        const db = tx || globalPrisma;

        return await db.$transaction(async (innerTx: any) => {
            // 1. If parentId provided, verify it exists and belongs to tenant
            if (parentId) {
                const parent = await innerTx.folder.findUnique({
                    where: { id: parentId, tenantId }
                });
                if (!parent) {
                    throw new FolderNotFoundError(parentId, tenantId);
                }
            }

            // 2. Check for duplicate name in same parent
            // 2. Check for duplicate name in same parent
            // We use findFirst instead of findUnique to avoid potential issues with NULL parentId uniqueness in some DBs
            const existing = await innerTx.folder.findFirst({
                where: {
                    tenantId,
                    parentId: parentId || null,
                    name
                }
            });

            if (existing) {
                throw new Error(`A folder named '${name}' already exists in this location.`);
            }

            // 3. Create folder
            const folder = await innerTx.folder.create({
                data: {
                    name,
                    parentId,
                    tenantId,
                    createdById: user.sub,
                    updatedById: user.sub
                }
            });

            // 4. Audit Log
            await createAuditLog({
                tenantId,
                actorUserId: user.sub,
                entityType: "FOLDER",
                entityId: folder.id,
                action: "DMS.FOLDER_CREATE",
                details: `Created folder '${name}' (ID: ${folder.id}) under parent '${parentId || 'Root'}'.`,
                metadata: {
                    name,
                    parentId
                }
            }, innerTx);

            return folder;
        });
    }

    /**
     * updateFolder
     * 
     * Updates folder metadata (name, move to different parent).
     */
    static async updateFolder(params: UpdateFolderParams, tx?: any) {
        const { id, name, parentId, tenantId, user } = params;
        const db = tx || globalPrisma;

        return await db.$transaction(async (innerTx: any) => {
            // 1. Verify existence and ownership
            const folder = await innerTx.folder.findUnique({
                where: { id, tenantId }
            });

            if (!folder) {
                throw new FolderNotFoundError(id, tenantId);
            }

            // 2. Handle move (parentId change)
            if (parentId !== undefined && parentId !== folder.parentId) {
                if (parentId === id) {
                    throw new Error("Folder cannot be its own parent.");
                }

                if (parentId) {
                    const newParent = await innerTx.folder.findUnique({
                        where: { id: parentId, tenantId }
                    });
                    if (!newParent) {
                        throw new FolderNotFoundError(parentId, tenantId);
                    }
                }
            }

            // 3. Update folder
            const updatedFolder = await innerTx.folder.update({
                where: { id, tenantId },
                data: {
                    ...(name && { name }),
                    ...(parentId !== undefined && { parentId }),
                    updatedById: user.sub
                }
            });

            // 4. Audit Log
            await createAuditLog({
                tenantId,
                actorUserId: user.sub,
                entityType: "FOLDER",
                entityId: id,
                action: "DMS.FOLDER_UPDATE",
                details: `Updated folder ${id}. ${name ? `Name: ${name}. ` : ''}${parentId !== undefined ? `Parent: ${parentId || 'Root'}.` : ''}`,
                metadata: {
                    name: name || folder.name,
                    parentId: parentId !== undefined ? parentId : folder.parentId
                }
            }, innerTx);

            return updatedFolder;
        });
    }

    /**
     * deleteFolder
     * 
     * Deletes a folder. Fails if folder has documents or subfolders (enforced by DB Restrict or Logic).
     */
    static async deleteFolder(id: string, tenantId: number, user: AuthUser, tx?: any) {
        const db = tx || globalPrisma;

        return await db.$transaction(async (innerTx: any) => {
            // 1. Verify existence
            const folder = await innerTx.folder.findUnique({
                where: { id, tenantId },
                include: {
                    _count: {
                        select: { children: true, documents: true }
                    }
                }
            });

            if (!folder) {
                throw new FolderNotFoundError(id, tenantId);
            }

            // 2. Dependency Check (Prevent deleting non-empty folders)
            if (folder._count.children > 0 || folder._count.documents > 0) {
                throw new FolderNotEmptyError(id);
            }

            // 3. Delete
            await innerTx.folder.delete({
                where: { id, tenantId }
            });

            // 4. Audit Log
            await createAuditLog({
                tenantId,
                actorUserId: user.sub,
                entityType: "FOLDER",
                entityId: id,
                action: "DMS.FOLDER_DELETE",
                details: `Deleted folder '${folder.name}' (ID: ${id}).`,
                metadata: {
                    name: folder.name
                }
            }, innerTx);

            return { success: true };
        });
    }

    /**
     * getFolderById
     * 
     * Retrieves a folder with counts of documents and subfolders.
     */
    static async getFolderById(id: string, tenantId: number) {
        return await globalPrisma.folder.findUnique({
            where: { id, tenantId },
            include: {
                _count: {
                    select: { children: true, documents: true }
                }
            }
        });
    }

    /**
     * listFolders
     * 
     * Lists folders in a parent folder (or root if null).
     */
    static async listFolders(params: { parentId: string | null, tenantId: number }) {
        const { parentId, tenantId } = params;
        return await globalPrisma.folder.findMany({
            where: {
                tenantId,
                parentId: parentId || null
            },
            orderBy: { name: "asc" }
        });
    }

    /**
     * getFolderHierarchy
     * 
     * Gets list of all folders for breadcrumbs or tree view.
     */
    static async getFolders(tenantId: number) {
        return await globalPrisma.folder.findMany({
            where: { tenantId },
            orderBy: [
                { parentId: "asc" },
                { name: "asc" }
            ]
        });
    }

    /**
     * listFoldersByParent (Alias for listFolders)
     */
    static async listFoldersByParent(parentId: string | null, tenantId: number) {
        return this.listFolders({ parentId, tenantId });
    }

    /**
     * getRecursiveFolderIds
     * 
     * Returns an array of folder IDs including the target folder and all its descendants.
     * Uses in-memory traversal to avoid N+1 queries.
     */
    static async getRecursiveFolderIds(folderId: string, tenantId: number): Promise<string[]> {
        // 1. Fetch all folders for the tenant (lightweight select)
        const allFolders = await globalPrisma.folder.findMany({
            where: { tenantId },
            select: { id: true, parentId: true }
        });

        // 2. Build adjacency list
        const childrenMap = new Map<string, string[]>();
        for (const f of allFolders) {
            if (f.parentId) {
                if (!childrenMap.has(f.parentId)) childrenMap.set(f.parentId, []);
                childrenMap.get(f.parentId)!.push(f.id);
            }
        }

        // 3. Traverse descendants
        const result: string[] = [folderId];
        const queue: string[] = [folderId];

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            const children = childrenMap.get(currentId);
            if (children) {
                for (const childId of children) {
                    result.push(childId);
                    queue.push(childId);
                }
            }
        }

        return result;
    }
}
