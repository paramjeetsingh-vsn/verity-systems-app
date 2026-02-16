
import { prisma as globalPrisma } from "@/lib/prisma";
import { resolveEffectiveStatus } from "@/lib/dms/status-utils";

export class DmsQueryService {
    /**
     * getFolderTree
     * 
     * Retrieves the full folder hierarchy for a tenant.
     * Useful for building navigation sidebars or selection trees.
     */
    static async getFolderTree(tenantId: number) {
        const folders = await globalPrisma.folder.findMany({
            where: { tenantId },
            orderBy: { name: "asc" }
        });

        // Simple recursive tree building
        const buildTree = (parentId: string | null = null): any[] => {
            return folders
                .filter(f => f.parentId === parentId)
                .map(f => ({
                    ...f,
                    children: buildTree(f.id)
                }));
        };

        return buildTree(null);
    }

    /**
     * getDocumentWithEffectiveStatus
     * 
     * Retrieves a document by ID with resolving effective status (EXPIRED check).
     */
    static async getDocumentWithEffectiveStatus(id: string, tenantId: number) {
        const document = await globalPrisma.document.findUnique({
            where: { id, tenantId },
            include: {
                currentVersion: {
                    select: {
                        id: true,
                        versionNumber: true,
                        fileName: true,
                        fileSize: true,
                        mimeType: true,
                        createdAt: true
                    }
                },
                folder: {
                    select: { id: true, name: true }
                }
            }
        });

        if (!document) return null;

        return {
            ...document,
            effectiveStatus: resolveEffectiveStatus(document)
        };
    }

    /**
     * searchDocumentsByTitle
     * 
     * Searches documents by title within a tenant and resolves status.
     */
    static async searchDocumentsByTitle(query: string, tenantId: number) {
        const documents = await globalPrisma.document.findMany({
            where: {
                tenantId,
                title: {
                    contains: query,
                    mode: 'insensitive'
                }
            },
            include: {
                currentVersion: {
                    select: {
                        id: true,
                        versionNumber: true,
                        fileName: true
                    }
                }
            },
            orderBy: { title: "asc" },
            take: 50 // Limit results for performance
        });

        return documents.map(doc => ({
            ...doc,
            effectiveStatus: resolveEffectiveStatus(doc)
        }));
    }
}
