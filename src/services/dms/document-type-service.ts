
import { prisma as globalPrisma } from "@/lib/prisma";
import { AuthUser } from "@/lib/auth/auth-types";
import { createAuditLog } from "@/lib/audit";
import { DocumentType } from "@prisma/client";

export class DocumentTypeService {
    /**
     * createDocumentType
     * 
     * Creates a new document type.
     * Enforces unique name (case-insensitive) within tenant.
     */
    static async createDocumentType(name: string, tenantId: number, user: AuthUser) {
        const trimmedName = name.trim();
        if (!trimmedName) throw new Error("Document type name cannot be empty");

        return await globalPrisma.$transaction(async (tx) => {
            // Check for duplicate name
            const existing = await tx.documentType.findFirst({
                where: {
                    tenantId,
                    name: { equals: trimmedName, mode: "insensitive" }
                }
            });

            if (existing) {
                throw new Error(`Document type '${trimmedName}' already exists.`);
            }

            const docType = await tx.documentType.create({
                data: {
                    name: trimmedName,
                    tenantId,
                    isActive: true
                }
            });

            await createAuditLog({
                tenantId,
                actorUserId: user.sub,
                entityType: "DOCUMENT_TYPE",
                entityId: docType.id,
                action: "DMS.DOCTYPE_CREATE",
                details: `Created document type '${docType.name}'.`,
                metadata: { name: docType.name }
            }, tx);

            return docType;
        });
    }

    /**
     * updateDocumentType
     * 
     * Updates the name of a document type.
     */
    static async updateDocumentType(id: string, name: string, tenantId: number, user: AuthUser) {
        const trimmedName = name.trim();
        if (!trimmedName) throw new Error("Document type name cannot be empty");

        return await globalPrisma.$transaction(async (tx) => {
            const docType = await tx.documentType.findUnique({
                where: { id, tenantId } // Tenant isolation
            });

            if (!docType) throw new Error("Document type not found");

            // Check for duplicate name if changing
            if (docType.name.toLowerCase() !== trimmedName.toLowerCase()) {
                const existing = await tx.documentType.findFirst({
                    where: {
                        tenantId,
                        name: { equals: trimmedName, mode: "insensitive" },
                        id: { not: id }
                    }
                });

                if (existing) {
                    throw new Error(`Document type '${trimmedName}' already exists.`);
                }
            }

            const updated = await tx.documentType.update({
                where: { id },
                data: {
                    name: trimmedName,
                    updatedById: user.sub
                }
            });

            await createAuditLog({
                tenantId,
                actorUserId: user.sub,
                entityType: "DOCUMENT_TYPE",
                entityId: id,
                action: "DMS.DOCTYPE_UPDATE",
                details: `Renamed document type from '${docType.name}' to '${updated.name}'.`,
                metadata: { oldName: docType.name, newName: updated.name }
            }, tx);

            return updated;
        });
    }

    /**
     * deactivateDocumentType
     * 
     * Sets isActive to false.
     * Prevents future use, but preserves history.
     */
    static async deactivateDocumentType(id: string, tenantId: number, user: AuthUser) {
        return await globalPrisma.$transaction(async (tx) => {
            const docType = await tx.documentType.findUnique({ where: { id, tenantId } });
            if (!docType) throw new Error("Document type not found");

            if (!docType.isActive) return docType; // Already inactive

            const updated = await tx.documentType.update({
                where: { id },
                data: {
                    isActive: false,
                    updatedById: user.sub
                }
            });

            await createAuditLog({
                tenantId,
                actorUserId: user.sub,
                entityType: "DOCUMENT_TYPE",
                entityId: id,
                action: "DMS.DOCTYPE_DEACTIVATE",
                details: `Deactivated document type '${docType.name}'.`,
                metadata: { name: docType.name }
            }, tx);

            return updated;
        });
    }

    /**
     * reactivateDocumentType
     * 
     * Sets isActive to true.
     * Must check for name conflicts if a new type with same name was created while this was inactive.
     */
    static async reactivateDocumentType(id: string, tenantId: number, user: AuthUser) {
        return await globalPrisma.$transaction(async (tx) => {
            const docType = await tx.documentType.findUnique({ where: { id, tenantId } });
            if (!docType) throw new Error("Document type not found");

            if (docType.isActive) return docType; // Already active

            // Check if another active type exists with same name
            const existingActive = await tx.documentType.findFirst({
                where: {
                    tenantId,
                    name: { equals: docType.name, mode: "insensitive" },
                    isActive: true,
                    id: { not: id }
                }
            });

            if (existingActive) {
                throw new Error(`Cannot reactivate '${docType.name}' because another active type with this name exists.`);
            }

            const updated = await tx.documentType.update({
                where: { id },
                data: {
                    isActive: true,
                    updatedById: user.sub
                }
            });

            await createAuditLog({
                tenantId,
                actorUserId: user.sub,
                entityType: "DOCUMENT_TYPE",
                entityId: id,
                action: "DMS.DOCTYPE_REACTIVATE",
                details: `Reactivated document type '${docType.name}'.`,
                metadata: { name: docType.name }
            }, tx);

            return updated;
        });
    }

    /**
     * listDocumentTypes
     * 
     * Lists all types (active and inactive) for Admin management.
     */
    static async listDocumentTypes(tenantId: number) {
        return await globalPrisma.documentType.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { documents: true }
                }
            }
        });
    }

    /**
     * listActiveDocumentTypes
     * 
     * Lists only active types for document creation.
     */
    static async listActiveDocumentTypes(tenantId: number) {
        return await globalPrisma.documentType.findMany({
            where: {
                tenantId,
                isActive: true
            },
            orderBy: { name: 'asc' }
        });
    }
}
