"use client"

import { useAuth } from "./auth-context"

/**
 * usePermission
 * 
 * Custom hook to check if the current authenticated user has a specific permission.
 * This is used for UX-level gating (showing/hiding buttons).
 * 
 * IMPORTANT: This does NOT replace server-side enforcement. The server remains the 
 * final authority on all operations.
 */
export function usePermission(permissionCode: string): boolean {
    const { user, loading } = useAuth()

    if (loading || !user || !user.permissions) {
        return false
    }

    // Check if the permission code exists in the user's permission array
    return user.permissions.includes(permissionCode)
}

/**
 * useAnyPermission
 * 
 * Helper to check if the user has at least one of the provided permissions.
 */
export function useAnyPermission(permissionCodes: string[]): boolean {
    const { user, loading } = useAuth()

    if (loading || !user || !user.permissions) {
        return false
    }

    return permissionCodes.some(code => user.permissions.includes(code))
}
