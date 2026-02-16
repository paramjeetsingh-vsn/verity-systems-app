
import { DocumentStatus } from "@prisma/client";

/**
 * Minimal interface required from a Document to resolve its effective status.
 */
export interface StatusResolvable {
    status: DocumentStatus;
    expiryDate: Date | null;
}

/**
 * Resolves the effective status of a document, accounting for expiration logic.
 * 
 * Rules:
 * - If status is "APPROVED" and an expiryDate exists and is in the past, return "EXPIRED".
 * - Otherwise, return the current database status.
 * 
 * Note: This is a computed state and should not be persisted back to the status field.
 */
export function resolveEffectiveStatus(document: StatusResolvable): DocumentStatus | "EXPIRED" {
    const { status, expiryDate } = document;

    if (status === DocumentStatus.APPROVED && expiryDate && new Date(expiryDate) < new Date()) {
        return "EXPIRED";
    }

    return status;
}
