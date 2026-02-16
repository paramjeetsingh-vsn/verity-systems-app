
import { DocumentStatus } from "@prisma/client";
import { AuthUser } from "@/lib/auth/auth-types";
import { TRANSITION_MATRIX, WorkflowAction } from "./transition-matrix";
import { createAuditLog } from "@/lib/audit";
import {
    InvalidWorkflowActionError,
    DocumentNotFoundError,
    InvalidTransitionError,
    UnauthorizedWorkflowActionError
} from "./errors";

/**
 * Helper to validate permission against AuthUser object.
 * Throws if permission is missing.
 */
function checkPermission(user: AuthUser, permissionCode: string) {
    if (!user.permissions?.includes(permissionCode)) {
        throw new UnauthorizedWorkflowActionError(permissionCode);
    }
}

/**
 * transitionDocumentStatus
 * 
 * The single, transactional engine for DMS document status transitions.
 * This function enforces strict rules and ensures consistency across the DMS module.
 */
export async function transitionDocumentStatus(
    prisma: any,
    documentId: string,
    tenantId: number,
    action: WorkflowAction,
    user: AuthUser,
    comment?: string
) {
    const transition = TRANSITION_MATRIX[action];
    if (!transition) {
        throw new InvalidWorkflowActionError(action);
    }

    // 1. Permission Enforcement
    checkPermission(user, transition.permission);

    // 2. Transactional Status Update
    return await prisma.$transaction(async (tx: any) => {
        // a. Load document with strict tenant scoping
        const document = await tx.document.findUnique({
            where: { id: documentId, tenantId },
        });

        if (!document) {
            throw new DocumentNotFoundError(documentId, tenantId);
        }

        // b. Validate current state matches Matrix requirement
        if (document.status !== transition.from) {
            throw new InvalidTransitionError(action, document.status, transition.from);
        }

        // c. Business Logic: Rejection requires a comment
        if (action === "reject" && !comment) {
            throw new Error("A comment is required when rejecting a document");
        }

        // d. Execute Update (with Optimistic Concurrency Control)
        let updatedDoc;
        try {
            updatedDoc = await tx.document.update({
                where: {
                    id: documentId,
                    tenantId,
                    status: transition.from // Optimistic Lock
                },
                data: {
                    status: transition.to,
                    updatedById: user.sub,
                },
            });
        } catch (error: any) {
            // P2025 = Record to update not found (concurrent modification)
            if (error.code === "P2025") {
                throw new InvalidTransitionError(action, "UNKNOWN (Concurrent Update)", transition.from);
            }
            throw error;
        }

        // e. Log to Workflow History
        await tx.workflowHistory.create({
            data: {
                documentId,
                tenantId,
                fromStatus: transition.from,
                toStatus: transition.to,
                comment,
                actorUserId: user.sub,
            },
        });

        // f. Emit Audit Log
        const auditAction = `DMS.${action.toUpperCase()}`;
        await createAuditLog({
            tenantId,
            actorUserId: user.sub,
            entityType: "DOCUMENT",
            entityId: documentId,
            action: auditAction,
            details: `Action '${action}' completed. Status: ${transition.from} -> ${transition.to}. Comment: ${comment || "N/A"}`,
            metadata: {
                fromStatus: transition.from,
                toStatus: transition.to,
                comment,
                workflowAction: action
            }
        }, tx);

        return updatedDoc;
    });
}
