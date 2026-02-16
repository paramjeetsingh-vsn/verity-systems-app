
/**
 * Generic storage error.
 */
export class StorageError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "StorageError";
    }
}

/**
 * Thrown when a file exceeds the allowed size limit (e.g., 10MB).
 */
export class FileTooLargeError extends Error {
    constructor(size: number, limit: number) {
        super(`File size (${size} bytes) exceeds the limit of ${limit} bytes.`);
        this.name = "FileTooLargeError";
    }
}

/**
 * Thrown when the mime-type and extension are inconsistent.
 */
export class MimeTypeMismatchError extends Error {
    constructor(mimeType: string, extension: string) {
        super(`Mime-type '${mimeType}' is inconsistent with extension '${extension}'.`);
        this.name = "MimeTypeMismatchError";
    }
}

/**
 * Thrown when the file type (mime-type) is not supported.
 */
export class InvalidMimeTypeError extends Error {
    constructor(mimeType: string) {
        super(`Invalid or unsupported mime-type: ${mimeType}`);
        this.name = "InvalidMimeTypeError";
    }
}

/**
 * Thrown when a filename is invalid (e.g., path traversal).
 */
export class InvalidFileNameError extends Error {
    constructor(reason: string) {
        super(`Invalid filename: ${reason}`);
        this.name = "InvalidFileNameError";
    }
}

/**
 * Thrown when the storage provider fails to upload.
 */
export class StorageUploadFailedError extends Error {
    constructor(detail: string) {
        super(`Storage upload failed: ${detail}`);
        this.name = "StorageUploadFailedError";
    }
}

/**
 * Thrown when there is a version number collision or logical conflict.
 */
export class VersionConflictError extends Error {
    constructor(documentId: string, versionNumber: number) {
        super(`Version conflict: Version ${versionNumber} already exists for document ${documentId}`);
        this.name = "VersionConflictError";
    }
}

/**
 * Thrown when storage provider configuration is missing or invalid.
 */
export class StorageConfigurationError extends Error {
    constructor(detail: string) {
        super(`Storage configuration error: ${detail}`);
        this.name = "StorageConfigurationError";
    }
}
