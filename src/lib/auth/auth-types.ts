export type AuthUser = {
    sub: number        // userId
    tenantId: number
    email: string
    roles: string[]
    roleIds: number[]
    permissions?: string[]
    permissionIds?: number[]
    mfaEnabled: boolean
    sid?: number
}
