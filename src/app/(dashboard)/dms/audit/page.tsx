"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import {
    Loader2,
    ShieldAlert,
    Search,
    Filter,
    Activity,
    ChevronLeft,
    ChevronRight,
    Calendar,
    User,
    FileText,
    RefreshCw
} from "lucide-react"

interface AuditLogItem {
    id: number
    action: string
    entityType: string | null
    entityId: string | null
    entityName: string
    details: string | null
    metadata: any
    actorName: string
    actorEmail: string | undefined
    createdAt: string
    ipAddress: string | null
}

interface AuditResponse {
    items: AuditLogItem[]
    total: number
    page: number
    limit: number
    totalPages: number
}

interface UserOption {
    id: number
    fullName: string
    email: string
}

export default function DmsAuditPage() {
    const { fetchWithAuth } = useAuth()

    // State
    const [logs, setLogs] = useState<AuditLogItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [users, setUsers] = useState<UserOption[]>([])

    // Filters & Pagination
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [action, setAction] = useState("")
    const [userId, setUserId] = useState("")
    const [entityType, setEntityType] = useState("")

    // Fetch Users for Dropdown
    useEffect(() => {
        const loadUsers = async () => {
            try {
                // Fetch users (assuming admin access allows this)
                const res = await fetchWithAuth<any[]>("/api/admin/users?limit=100")
                if (Array.isArray(res)) {
                    setUsers(res.map(u => ({ id: u.id, fullName: u.fullName, email: u.email })))
                }
            } catch (err) {
                console.warn("Failed to load users for filter dropdown", err)
            }
        }
        loadUsers()
    }, [fetchWithAuth])

    // Fetch Logs
    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const params = new URLSearchParams()
            params.append("page", page.toString())
            params.append("limit", "20")

            if (startDate) params.append("startDate", new Date(startDate).toISOString())
            if (endDate) params.append("endDate", new Date(endDate).toISOString())
            if (action) params.append("action", action)
            if (userId) params.append("userId", userId)
            if (entityType) params.append("entityType", entityType)

            const res = await fetchWithAuth(`/api/secure/dms/audit?${params.toString()}`)

            if (res.error) throw new Error(res.error.message)

            const data: AuditResponse = res
            setLogs(data.items)
            setTotalPages(data.totalPages)
            setPage(data.page) // Sync page from server
        } catch (err: any) {
            setError(err.message || "Failed to load audit logs")
        } finally {
            setLoading(false)
        }
    }, [fetchWithAuth, page, startDate, endDate, action, userId, entityType])

    // Trigger fetch on filter/page change
    useEffect(() => {
        fetchLogs()
    }, [fetchLogs])

    // Reset page when filters change
    const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
        setter(value)
        setPage(1) // Reset to first page
    }

    // Helper: Format Date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    // Helper: Action Badge Color
    const getActionBadgeColor = (action: string) => {
        if (action.includes("CREATE")) return "bg-green-100 text-green-700 border-green-200"
        if (action.includes("UPDATE")) return "bg-blue-100 text-blue-700 border-blue-200"
        if (action.includes("DELETE")) return "bg-red-100 text-red-700 border-red-200"
        if (action.includes("APPROVE")) return "bg-emerald-100 text-emerald-700 border-emerald-200"
        if (action.includes("REJECT")) return "bg-orange-100 text-orange-700 border-orange-200"
        if (action.includes("SUBMIT")) return "bg-indigo-100 text-indigo-700 border-indigo-200"
        return "bg-gray-100 text-gray-700 border-gray-200"
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Activity className="text-primary" />
                        DMS Global Audit
                    </h1>
                    <p className="text-muted-foreground">
                        Track all document management activities across the tenant.
                    </p>
                </div>
                <button
                    onClick={() => fetchLogs()}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-md transition-colors"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="bg-card border rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 shadow-sm">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => handleFilterChange(setStartDate, e.target.value)}
                        className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">End Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => handleFilterChange(setEndDate, e.target.value)}
                        className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Action</label>
                    <select
                        value={action}
                        onChange={(e) => handleFilterChange(setAction, e.target.value)}
                        className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="">All Actions</option>
                        <option value="DMS.DOCUMENT_CREATE">Create Document</option>
                        <option value="DMS.DOCUMENT_UPDATE">Update Document</option>
                        <option value="DMS.DOCUMENT_DELETE">Delete Document</option>
                        <option value="DMS.DOCUMENT_SUBMIT">Submit</option>
                        <option value="DMS.DOCUMENT_APPROVE">Approve</option>
                        <option value="DMS.DOCUMENT_REJECT">Reject</option>
                        <option value="DMS.VERSION_CREATE">New Version</option>
                        <option value="DMS.FOLDER_CREATE">Create Folder</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Entity Type</label>
                    <select
                        value={entityType}
                        onChange={(e) => handleFilterChange(setEntityType, e.target.value)}
                        className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="">All Types</option>
                        <option value="DOCUMENT">Document</option>
                        <option value="FOLDER">Folder</option>
                        <option value="VERSION">Version</option>
                        <option value="WORKFLOW">Workflow</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">User</label>
                    <select
                        value={userId}
                        onChange={(e) => handleFilterChange(setUserId, e.target.value)}
                        className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="">All Users</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.fullName}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md flex items-center gap-2">
                    <ShieldAlert size={16} />
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading && logs.length === 0 && (
                <div className="flex h-64 items-center justify-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                    <Loader2 className="animate-spin mr-2" /> Loading audit logs...
                </div>
            )}

            {/* Empty State */}
            {!loading && logs.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                    <Filter size={32} className="mb-2 opacity-20" />
                    <p>No log entries found matching your criteria.</p>
                </div>
            )}

            {/* Data Table */}
            {!loading && logs.length > 0 && (
                <div className="rounded-md border bg-card shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-medium border-b text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3">Timestamp</th>
                                    <th className="px-4 py-3">Action</th>
                                    <th className="px-4 py-3">Entity</th>
                                    <th className="px-4 py-3">User</th>
                                    <th className="px-4 py-3">Details</th>
                                    <th className="px-4 py-3">Metadata</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs font-mono">
                                            {formatDate(log.createdAt)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded textxs font-medium border ${getActionBadgeColor(log.action)}`}>
                                                {log.action.replace("DMS.", "")}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col text-xs">
                                                <span className="font-semibold text-foreground">{log.entityName}</span>
                                                <span className="text-muted-foreground bg-muted/50 px-1 rounded w-fit mt-0.5">
                                                    {log.entityType}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                                                    {log.actorName.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-foreground">{log.actorName}</span>
                                                    <span className="text-[10px] text-muted-foreground">{log.actorEmail}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-foreground">{log.details || "-"}</span>
                                        </td>
                                        <td className="px-4 py-3 align-top min-w-[200px]">
                                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                <div className="space-y-1">
                                                    {Object.entries(log.metadata).slice(0, 3).map(([key, value]) => (
                                                        <div key={key} className="text-[10px] grid grid-cols-[80px_1fr] gap-1">
                                                            <span className="font-medium text-muted-foreground truncate" title={key}>
                                                                {key}:
                                                            </span>
                                                            <span className="text-foreground truncate" title={String(value)}>
                                                                {String(value)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {Object.keys(log.metadata).length > 3 && (
                                                        <span className="text-[10px] text-muted-foreground italic">
                                                            +{Object.keys(log.metadata).length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
                        <span className="text-sm text-muted-foreground">
                            Showing {logs.length} entries (Page {page} of {totalPages})
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                                className="p-1.5 rounded hover:bg-muted disabled:opacity-50 transition-colors border"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || loading}
                                className="p-1.5 rounded hover:bg-muted disabled:opacity-50 transition-colors border"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
