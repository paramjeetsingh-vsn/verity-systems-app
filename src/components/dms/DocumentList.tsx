"use client"

import React, { useEffect, useState, useCallback, useRef } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
    AlertCircle,
    Loader2,
    Filter,
    Plus
} from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { DataTable } from "@/components/dms/data-table"
import { columns, DocumentData } from "@/components/dms/columns"
import { AdvancedFilterDrawer } from "@/components/dms/AdvancedFilterDrawer"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"



interface DocumentListProps {
    folderId: string | null
    search?: string
    onDocumentSelect: (docId: string) => void
    onLoadComplete?: (count: number) => void
    onCreateClick?: () => void
    showCreateButton?: boolean
}

export function DmsDocumentList({ folderId, search = "", onDocumentSelect, onLoadComplete, onCreateClick, showCreateButton }: DocumentListProps) {
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

    // Stabilize search params
    const searchParamsString = searchParams.toString()

    // URL State Helpers
    const createQueryString = useCallback(
        (name: string, value: string | null) => {
            const params = new URLSearchParams(searchParamsString)
            if (value === null) {
                params.delete(name)
            } else {
                params.set(name, value)
            }
            return params.toString()
        },
        [searchParamsString]
    )

    const updateUrl = useCallback((updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParamsString)
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

        const newQueryString = params.toString()
        if (newQueryString !== searchParamsString) {
            router.push(pathname + "?" + newQueryString)
        }
    }, [searchParamsString, pathname, router])

    // Use ref to avoid dependency cycle with onLoadComplete
    const onLoadCompleteRef = useRef(onLoadComplete)
    useEffect(() => {
        onLoadCompleteRef.current = onLoadComplete
    }, [onLoadComplete])

    const loadDocuments = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const params = new URLSearchParams(searchParamsString)

            // Sync props to params
            if (folderId) params.set("folderId", folderId)
            else params.delete("folderId")

            if (search) params.set("search", search)
            else params.delete("search")

            // Defaults
            if (!params.has("page")) params.set("page", "1")

            if (params.has("type")) {
                const types = params.getAll("type");
                params.delete("type");
                types.forEach(t => params.append("documentTypeIds", t));
            }

            const queryString = params.toString()
            const response = await fetchWithAuth<{ data: DocumentData[], meta: any }>(`/api/secure/dms/documents?${queryString}`)

            setDocuments(response.data)

            // Only update parent if total changed
            if (onLoadCompleteRef.current) {
                onLoadCompleteRef.current(response.meta.total)
            }

            setMeta(response.meta)
        } catch (err: any) {
            setError(err.message || "Failed to load documents")
        } finally {
            setLoading(false)
        }
    }, [folderId, search, searchParamsString, fetchWithAuth])

    useEffect(() => {
        loadDocuments()
    }, [loadDocuments])

    // Handlers
    const handlePageChange = useCallback((page: number) => {
        updateUrl({ page: String(page) })
    }, [updateUrl])

    const handleSearch = useCallback((term: string) => {
        updateUrl({ search: term })
    }, [updateUrl])

    // Advanced Filter State
    const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false)

    // Check active filters count
    const activeFilterCount = Array.from(searchParams.entries()).filter(([key, val]) => {
        return ['status', 'type', 'expiryFilter', 'versionFrom', 'versionTo', 'includeSubfolders'].includes(key) && val
    }).length

    const advancedFilterButton = (
        <div className="flex items-center gap-2">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={() => setIsAdvancedFilterOpen(true)}
                            className={`flex items-center justify-center p-2 rounded-md border transition-colors ${activeFilterCount > 0 ? "bg-primary/10 border-primary/20 text-primary" : "hover:bg-muted"}`}
                            aria-label="Advanced Filters"
                        >
                            <Filter size={18} />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Advanced Filters</p>
                    </TooltipContent>
                </Tooltip>

                {showCreateButton && onCreateClick && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={onCreateClick}
                                className="inline-flex items-center justify-center p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all shadow-sm shrink-0"
                                aria-label="New Document"
                            >
                                <Plus size={18} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>New Document</p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </TooltipProvider>
        </div>
    )

    return (
        <div className="flex flex-col min-h-full bg-background flex-1">
            <AdvancedFilterDrawer
                isOpen={isAdvancedFilterOpen}
                onClose={() => setIsAdvancedFilterOpen(false)}
                documentTypes={documentTypes.map(t => ({ id: t.value, name: t.label }))}
            />

            {/* Content */}
            <div className="flex-1 flex flex-col p-4">
                {loading && documents.length === 0 ? (
                    <div className="flex items-center justify-center flex-1">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={documents}
                        meta={meta}
                        onRowClick={(doc) => onDocumentSelect(doc.id)}
                        onPageChange={handlePageChange}
                        onSearch={handleSearch}
                        initialSearch={search}
                        toolbarActions={advancedFilterButton}
                    />
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
