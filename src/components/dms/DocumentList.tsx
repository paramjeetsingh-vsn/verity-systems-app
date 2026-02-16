"use client"

import React, { useEffect, useState, useCallback } from "react"
import {
    FileText,
    MoreVertical,
    History,
    AlertCircle,
    Loader2
} from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { StatusBadge } from "@/components/dms/StatusBadge"

interface DocumentData {
    id: string
    title: string
    documentNumber: string | null
    type: { name: string } | null
    expiryDate: string | null
    description?: string
    status: string
    effectiveStatus: string
    updatedAt: string
    currentVersion?: {
        id: string
        fileName: string
        versionNumber: number
    }
}

interface DocumentListProps {
    folderId: string | null
    search?: string
    onDocumentSelect: (docId: string) => void
    onLoadComplete?: (count: number) => void
}

export function DmsDocumentList({ folderId, search = "", onDocumentSelect, onLoadComplete }: DocumentListProps) {
    const { fetchWithAuth } = useAuth()
    const [documents, setDocuments] = useState<DocumentData[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadDocuments = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const params = new URLSearchParams()
            if (folderId) params.append("folderId", folderId)
            if (search) params.append("search", search)

            const data = await fetchWithAuth<DocumentData[]>(`/api/secure/dms/documents?${params.toString()}`)
            setDocuments(data)
            onLoadComplete?.(data.length)
        } catch (err: any) {
            setError(err.message || "Failed to load documents")
        } finally {
            setLoading(false)
        }
    }, [folderId, search, fetchWithAuth, onLoadComplete])

    useEffect(() => {
        loadDocuments()
    }, [loadDocuments])

    return (
        <div className="flex flex-col h-full bg-background flex-1 overflow-hidden">
            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Valid empty state when no documents found */}
                {!loading && documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                        <p className="text-sm text-muted-foreground italic">
                            {search ? `No documents found matching "${search}"` : "No documents found."}
                        </p>
                    </div>
                ) : loading && documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-2">
                        <Loader2 className="animate-spin text-primary" size={24} />
                        <span className="text-sm text-muted-foreground">Loading documents...</span>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-background/95 backdrop-blur-sm shadow-sm z-10">
                            <tr className="border-b text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                <th className="px-4 py-3 w-32">Doc No.</th>
                                <th className="px-4 py-3">Title</th>
                                <th className="px-4 py-3 w-32">Type</th>
                                <th className="px-4 py-3 w-32">Status</th>
                                <th className="px-4 py-3 w-24">Version</th>
                                <th className="px-4 py-3 w-32">Expiry</th>
                                <th className="px-4 py-3 w-40">Modified</th>
                                <th className="px-4 py-3 w-12 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {documents.map((doc) => (
                                <tr
                                    key={doc.id}
                                    onClick={() => onDocumentSelect(doc.id)}
                                    className="group hover:bg-muted/30 cursor-pointer transition-colors"
                                >
                                    <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                                        {doc.documentNumber || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/5 rounded border group-hover:bg-primary/10 transition-colors">
                                                <FileText size={18} className="text-primary/70" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-medium truncate">{doc.title}</span>
                                                {doc.description && (
                                                    <span className="text-[11px] text-muted-foreground truncate max-w-md">
                                                        {doc.description}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {doc.type?.name ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">
                                                {doc.type.name}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={doc.effectiveStatus} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <History size={12} />
                                            v{doc.currentVersion?.versionNumber || 0}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                        {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                        {new Date(doc.updatedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                // Dropdown logic would go here
                                            }}
                                            className="p-1 rounded-md hover:bg-muted-foreground/10 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <MoreVertical size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Error Overlay */}
            {error && (
                <div className="p-3 m-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}
        </div>
    )
}
