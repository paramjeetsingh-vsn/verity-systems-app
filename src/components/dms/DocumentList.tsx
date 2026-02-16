"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
    FileText,
    MoreVertical,
    History,
    AlertCircle,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Filter // Added Filter
} from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { StatusBadge } from "@/components/dms/StatusBadge"
import { DataTableHeader, SortOrder } from "@/components/dms/DataTableHeader"
import { AdvancedFilterDrawer } from "@/components/dms/AdvancedFilterDrawer" // Added AdvancedFilterDrawer

interface DocumentData {
    id: string
    title: string
    documentNumber: string | null
    type: { id: string, name: string } | null
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
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Data State
    const [documents, setDocuments] = useState<DocumentData[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [meta, setMeta] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 })

    // Filter Options State
    const [documentTypes, setDocumentTypes] = useState<{ label: string, value: string }[]>([])

    // Load filter options (Types) once
    useEffect(() => {
        fetchWithAuth<{ id: string, name: string }[]>("/api/secure/dms/document-types?active=true")
            .then(types => setDocumentTypes(types.map(t => ({ label: t.name, value: t.id }))))
            .catch(console.error)
    }, [fetchWithAuth]);

    // URL State Helpers
    const createQueryString = useCallback(
        (name: string, value: string | null) => {
            const params = new URLSearchParams(searchParams.toString())
            if (value === null) {
                params.delete(name)
            } else {
                params.set(name, value)
            }
            return params.toString()
        },
        [searchParams]
    )

    const updateUrl = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString())
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === undefined) {
                params.delete(key)
            } else {
                params.set(key, value)
            }
        })
        // Reset page to 1 on filter change (unless page itself is changing)
        if (!updates.page) {
            params.set("page", "1")
        }
        router.push(pathname + "?" + params.toString())
    }

    const loadDocuments = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const params = new URLSearchParams(searchParams.toString())

            // Sync props to params (priority to props if provided, but here props are external filters)
            if (folderId) params.set("folderId", folderId)
            else params.delete("folderId")

            if (search) params.set("search", search)
            else params.delete("search")

            // Defaults
            if (!params.has("page")) params.set("page", "1")

            // Map 'type' filter from UI to 'documentTypeIds' for API if needed, 
            // but API expects 'documentTypeIds' or 'typeIds'. 
            // Let's assume URL uses 'type' and we map it, OR just use 'documentTypeIds' in URL.
            // Let's use 'type' in URL for cleaner look, map to 'documentTypeIds' here? 
            // Actually API `route.ts` parses `documentTypeIds`. 
            // If I use `type` in URL, I need to send `documentTypeIds` to API.
            // But `searchParams` is passed directly? No, I construct a new `params` for fetch.

            // Adjust param names for API
            if (params.has("type")) {
                const types = params.getAll("type");
                params.delete("type");
                types.forEach(t => params.append("documentTypeIds", t));
            }

            const queryString = params.toString()
            const response = await fetchWithAuth<{ data: DocumentData[], meta: any }>(`/api/secure/dms/documents?${queryString}`)

            setDocuments(response.data)
            setMeta(response.meta)
            onLoadComplete?.(response.meta.total)
        } catch (err: any) {
            setError(err.message || "Failed to load documents")
        } finally {
            setLoading(false)
        }
    }, [folderId, search, searchParams, fetchWithAuth, onLoadComplete])

    useEffect(() => {
        loadDocuments()
    }, [loadDocuments])

    // Handlers
    const handleSort = (key: string, direction: SortOrder) => {
        updateUrl({
            sortBy: direction ? key : null,
            sortOrder: direction
        })
    }

    const handleFilter = (key: string, value: any) => {
        // value can be array or string or null
        if (Array.isArray(value)) {
            updateUrl({ [key]: value.length ? value.join(",") : null })
        } else {
            updateUrl({ [key]: value })
        }
    }

    const currentSort = {
        key: searchParams.get("sortBy") || "createdAt",
        direction: (searchParams.get("sortOrder") as SortOrder) || "desc"
    }

    // Advanced Filter State
    const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false)

    // Check active filters count
    const activeFilterCount = Array.from(searchParams.entries()).filter(([key, val]) => {
        return ['status', 'type', 'expiryFilter', 'versionFrom', 'versionTo', 'includeSubfolders'].includes(key) && val
    }).length

    return (
        <div className="flex flex-col h-full bg-background flex-1 overflow-hidden">
            {/* Toolbar / Active Filters */}
            <div className="p-4 border-b flex items-center justify-between gap-4 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                <div className="flex items-center gap-2 flex-1">
                    {/* Search Bar could be here or above, assuming separate component or passed prop */}
                    {/* For now, just show active filter summary or nothing if handled by layout */}

                    {activeFilterCount > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">{activeFilterCount} active filters</span>
                            <button
                                onClick={() => router.push(pathname)}
                                className="text-xs text-primary hover:underline"
                            >
                                Clear All
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsAdvancedFilterOpen(true)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${activeFilterCount > 0 ? "bg-primary/10 border-primary/20 text-primary" : "hover:bg-muted"}`}
                    >
                        <Filter size={16} />
                        Advanced Filters
                    </button>
                </div>
            </div>

            <AdvancedFilterDrawer
                isOpen={isAdvancedFilterOpen}
                onClose={() => setIsAdvancedFilterOpen(false)}
                documentTypes={documentTypes.map(t => ({ id: t.value, name: t.label }))}
            />

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {!loading && documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                        <p className="text-sm text-muted-foreground italic">
                            {searchParams.toString() ? "No documents match your filters." : "No documents found."}
                        </p>
                        {searchParams.toString() && (
                            <button
                                onClick={() => router.push(pathname)}
                                className="mt-2 text-xs text-primary hover:underline"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-background/95 backdrop-blur-sm shadow-sm z-10 border-b">
                            <tr className="text-xs text-muted-foreground">
                                <th className="px-4 py-3 w-32 align-top">
                                    <DataTableHeader
                                        title="Doc No." columnId="documentNumber"
                                        sortable currentSortConfig={currentSort} onSort={handleSort}
                                    />
                                </th>
                                <th className="px-4 py-3 align-top min-w-[200px]">
                                    <DataTableHeader
                                        title="Title" columnId="title"
                                        sortable currentSortConfig={currentSort} onSort={handleSort}
                                    />
                                </th>
                                <th className="px-4 py-3 w-32 align-top">
                                    <DataTableHeader
                                        title="Type" columnId="typeId" // Sort by relation? API handles 'type'
                                        // Sort by type? API probably needs to join. Let's disable sort for now or implement.
                                        // Filter
                                        filterable filterType="multi-select"
                                        filterOptions={documentTypes}
                                        currentFilterValue={searchParams.get("type")?.split(",")}
                                        onFilter={(v) => handleFilter("type", v)}
                                    />
                                </th>
                                <th className="px-4 py-3 w-32 align-top">
                                    <DataTableHeader
                                        title="Status" columnId="status"
                                        sortable currentSortConfig={currentSort} onSort={handleSort}
                                        filterable filterType="multi-select"
                                        filterOptions={[
                                            { label: "Draft", value: "DRAFT" },
                                            { label: "In Review", value: "SUBMITTED" },
                                            { label: "Approved", value: "APPROVED" },
                                            { label: "Rejected", value: "REJECTED" },
                                            { label: "Obsolete", value: "OBSOLETE" },
                                            // Expired is a calculated status, complicate to filter by strictly status DB field
                                            // But effectively usually maps to OBSOLETE or just check expiry date
                                        ]}
                                        currentFilterValue={searchParams.get("status")?.split(",")}
                                        onFilter={(v) => handleFilter("status", v)}
                                    />
                                </th>
                                <th className="px-4 py-3 w-24 align-top">
                                    <DataTableHeader
                                        title="Version" columnId="version"
                                        sortable currentSortConfig={currentSort} onSort={handleSort}
                                    />
                                </th>
                                <th className="px-4 py-3 w-32 align-top">
                                    <DataTableHeader
                                        title="Expiry" columnId="expiryDate"
                                        sortable currentSortConfig={currentSort} onSort={handleSort}
                                        filterable filterType="select"
                                        filterOptions={[
                                            { label: "Expired", value: "expired" },
                                            { label: "Expiring soon (30d)", value: "expiring_30" },
                                            { label: "Expiring soon (90d)", value: "expiring_90" },
                                        ]}
                                        currentFilterValue={searchParams.get("expiryFilter")}
                                        onFilter={(v) => handleFilter("expiryFilter", v)}
                                    />
                                </th>
                                <th className="px-4 py-3 w-40 align-top">
                                    <DataTableHeader
                                        title="Modified" columnId="updatedAt"
                                        sortable currentSortConfig={currentSort} onSort={handleSort}
                                    />
                                </th>
                                <th className="px-4 py-3 w-12 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y relative">
                            {loading && (
                                <tr className="absolute inset-0 bg-background/50 z-20 flex items-center justify-center min-h-[100px]">
                                    <td colSpan={8} className="h-full w-full flex items-center justify-center">
                                        <Loader2 className="animate-spin text-primary" size={24} />
                                    </td>
                                </tr>
                            )}
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

            {/* Pagination Footer */}
            <div className="border-t p-2 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <span>Page {meta.page} of {meta.totalPages}</span>
                    <span className="hidden sm:inline">({meta.total} items)</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => updateUrl({ page: String(meta.page - 1) })}
                        disabled={meta.page <= 1}
                        className="p-1 rounded hover:bg-muted disabled:opacity-50"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={() => updateUrl({ page: String(meta.page + 1) })}
                        disabled={meta.page >= meta.totalPages}
                        className="p-1 rounded hover:bg-muted disabled:opacity-50"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
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
