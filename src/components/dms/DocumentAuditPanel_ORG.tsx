"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import {
    Loader2,
    ShieldAlert,
    User,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Activity
} from "lucide-react"

interface AuditLogItem {
    id: number
    action: string
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

interface DocumentAuditPanelProps {
    documentId: string
}

export function DocumentAuditPanel({ documentId }: DocumentAuditPanelProps) {
    const { fetchWithAuth } = useAuth()
    const [logs, setLogs] = useState<AuditLogItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const fetchLogs = async (pageNum: number) => {
        try {
            setLoading(true)
            const res = await fetchWithAuth(`/api/secure/dms/documents/${documentId}/audit?page=${pageNum}&limit=10`)
            if (res.error) throw new Error(res.error.message)

            const data: AuditResponse = res
            setLogs(data.items)
            setTotalPages(data.totalPages)
            setPage(data.page)
        } catch (err: any) {
            setError(err.message || "Failed to load audit logs")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs(1)
    }, [documentId])

    // Helper: Format Date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    // Helper: Format Action Badge
    const getActionBadgeColor = (action: string) => {
        if (action.includes("CREATE")) return "bg-green-100 text-green-700 border-green-200"
        if (action.includes("UPDATE")) return "bg-blue-100 text-blue-700 border-blue-200"
        if (action.includes("DELETE")) return "bg-red-100 text-red-700 border-red-200"
        if (action.includes("APPROVE")) return "bg-emerald-100 text-emerald-700 border-emerald-200"
        if (action.includes("REJECT")) return "bg-orange-100 text-orange-700 border-orange-200"
        return "bg-gray-100 text-gray-700 border-gray-200"
    }

    if (loading && logs.length === 0) {
        return (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
                <Loader2 className="animate-spin mr-2" /> Loading audit history...
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
                <ShieldAlert size={16} />
                {error}
                <button
                    onClick={() => fetchLogs(page)}
                    className="ml-auto text-sm underline hover:text-red-800"
                >
                    Retry
                </button>
            </div>
        )
    }

    if (logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                <Activity size={32} className="mb-2 opacity-20" />
                <p>No audit activity recorded for this document.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                            <tr>
                                <th className="px-4 py-3">Action</th>
                                <th className="px-4 py-3">User</th>
                                <th className="px-4 py-3">Details</th>
                                <th className="px-4 py-3 text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 align-top">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getActionBadgeColor(log.action)}`}>
                                            {log.action.replace("DMS.", "")}
                                        </span>

                                    </td>
                                    <td className="px-4 py-3 align-top">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                                                {log.actorName.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-foreground">{log.actorName}</div>
                                                <div className="text-xs text-muted-foreground">{log.actorEmail}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                        <div className="text-foreground">{log.details || "No details"}</div>
                                        {/* Metadata Expander (Optional Future) */}
                                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {Object.entries(log.metadata).map(([key, value]) => (
                                                    <div key={key} className="text-xs grid grid-cols-[100px_1fr] gap-2">
                                                        <span className="font-medium text-muted-foreground truncate" title={key}>
                                                            {key}:
                                                        </span>
                                                        <span className="text-foreground truncate" title={String(value)}>
                                                            {String(value)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 align-top text-right whitespace-nowrap text-muted-foreground">
                                        {formatDate(log.createdAt)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => fetchLogs(page - 1)}
                        disabled={page === 1}
                        className="p-1 rounded hover:bg-muted disabled:opacity-50"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => fetchLogs(page + 1)}
                        disabled={page === totalPages}
                        className="p-1 rounded hover:bg-muted disabled:opacity-50"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    )
}
