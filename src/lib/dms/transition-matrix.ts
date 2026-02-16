
import { DocumentStatus } from "@prisma/client";

/**
 * Allowed workflow actions in the DMS module.
 */
export type WorkflowAction = "submit" | "approve" | "reject" | "revise" | "obsolete";

/**
 * Represents a single state transition in the workflow.
 */
export interface Transition {
    from: DocumentStatus;
    to: DocumentStatus;
    permission: string;
}

/**
 * Centralized Transition Matrix - The single source of truth for DMS workflows.
 * 
 * Defines which state a document must be in to perform an action, 
 * the resulting state, and the permission required.
 */
export const TRANSITION_MATRIX: Record<WorkflowAction, Transition> = {
    submit: {
        from: DocumentStatus.DRAFT,
        to: DocumentStatus.SUBMITTED,
        permission: "DMS_DOCUMENT_SUBMIT",
    },
    approve: {
        from: DocumentStatus.SUBMITTED,
        to: DocumentStatus.APPROVED,
        permission: "DMS_DOCUMENT_APPROVE",
    },
    reject: {
        from: DocumentStatus.SUBMITTED,
        to: DocumentStatus.REJECTED,
        permission: "DMS_DOCUMENT_REJECT",
    },
    revise: {
        from: DocumentStatus.REJECTED,
        to: DocumentStatus.DRAFT,
        permission: "DMS_DOCUMENT_EDIT",
    },
    obsolete: {
        from: DocumentStatus.APPROVED,
        to: DocumentStatus.OBSOLETE,
        permission: "DMS_DOCUMENT_OBSOLETE",
    },
};
