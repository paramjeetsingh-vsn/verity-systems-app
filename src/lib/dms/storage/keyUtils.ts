
import { InvalidFileNameError, InvalidMimeTypeError } from "./errors";

/**
 * List of suspicious or blocked extensions for DMS V1.
 * This is a security measure to prevent executable or script files.
 */
const BLOCKED_EXTENSIONS = new Set([
    "exe", "dll", "bat", "sh", "js", "vbs", "php", "py", "pl", "rb", "html", "htm", "jsp"
]);

export interface StorageKeyParams {
    tenantId: number;
    documentId: string;
    versionNumber: number;
    originalFileName: string;
}

/**
 * generateStorageKey
 * 
 * Generates a clean, tenant-isolated storage key.
 * 
 * Rules:
 * - Extract safe file extension.
 * - Sanitize filename (prevents path traversal).
 * - Format: tenantId/documentId/versionNumber.extension
 */
export function generateStorageKey(params: StorageKeyParams): string {
    const { tenantId, documentId, versionNumber, originalFileName } = params;

    // 1. Path Traversal Check
    if (originalFileName.includes("..") || originalFileName.includes("/") || originalFileName.includes("\\")) {
        throw new InvalidFileNameError("Path traversal or separators detected.");
    }

    // 2. Extract Extension
    const extMatch = originalFileName.match(/\.([a-z0-9]+)$/i);
    if (!extMatch) {
        throw new InvalidFileNameError("Missing required file extension.");
    }

    const extension = extMatch[1].toLowerCase();

    // 3. Suspicious Extension Check
    if (BLOCKED_EXTENSIONS.has(extension)) {
        throw new InvalidFileNameError(`Extension .${extension} is blocked for security reasons.`);
    }

    // 4. Construct Final Key
    // format: tenantId/documentId/versionNumber.extension
    return `${tenantId}/${documentId}/${versionNumber}.${extension}`;
}
