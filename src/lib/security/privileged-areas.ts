import { PermissionId } from "@/lib/auth/permission-codes";

export interface PrivilegedArea {
    path: string;
    requiredRoles?: (string | number)[];
    requiredPermissions?: number[];
    alertCode: string;
}

export const PRIVILEGED_AREAS: Record<string, PrivilegedArea> = {
    ADMIN: {
        path: '/admin',
        requiredPermissions: [PermissionId.ADMIN_ACCESS, 'ADMIN_ACCESS' as any],
        alertCode: 'UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT',
    },
    BILLING: {
        path: '/billing',
        requiredPermissions: [13, 'billing:read' as any],
        alertCode: 'UNAUTHORIZED_BILLING_ACCESS_ATTEMPT',
    },
    COMPLIANCE: {
        path: '/compliance',
        requiredPermissions: [14, 'compliance:read' as any],
        alertCode: 'UNAUTHORIZED_COMPLIANCE_ACCESS_ATTEMPT',
    },
    EXPORTS: {
        path: '/exports',
        requiredPermissions: [15, 'data:export' as any],
        alertCode: 'UNAUTHORIZED_EXPORT_ACCESS_ATTEMPT',
    },
    API_ADMIN: {
        path: '/api/admin',
        requiredPermissions: [PermissionId.ADMIN_ACCESS, 'ADMIN_ACCESS' as any],
        alertCode: 'UNAUTHORIZED_API_ADMIN_ACCESS_ATTEMPT',
    },
};
