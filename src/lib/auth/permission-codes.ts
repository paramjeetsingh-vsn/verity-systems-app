/**
 * Permission ID Constants
 * 
 * These IDs are fixed in the database seed and used throughout the application
 * to perform security checks that are resilient to code/name changes.
 */
export enum PermissionId {
    USER_VIEW = 1,
    USER_CREATE = 2,
    USER_UPDATE = 3,
    USER_DELETE = 4,
    ROLE_VIEW = 5,
    ROLE_CREATE = 6,
    ROLE_UPDATE = 7,
    ROLE_DELETE = 8,
    ROLE_ASSIGN = 9,
    PERMISSION_VIEW = 10,
    AUDIT_VIEW = 11,
    ADMIN_ACCESS = 12,
    BILLING_READ = 13,
    COMPLIANCE_READ = 14,
    DATA_EXPORT = 15,
}

export enum RoleId {
    ADMIN = 1,
    USER = 2,
}
