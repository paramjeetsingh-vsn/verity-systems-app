"use client"

import React, { useEffect, useState } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Filter, X } from "lucide-react"

interface AdvancedFilterDrawerProps {
    isOpen: boolean
    onClose: () => void
    documentTypes: { id: string, name: string }[]
}

export function AdvancedFilterDrawer({ isOpen, onClose, documentTypes }: AdvancedFilterDrawerProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Local state for form fields
    const [localFilters, setLocalFilters] = useState<any>({})

    // Initialize state from URL when drawer opens
    useEffect(() => {
        if (isOpen) {
            const getArray = (key: string) => {
                const val = searchParams.get(key)
                return val ? val.split(",") : []
            }

            setLocalFilters({
                typeIds: getArray("type"),
                status: getArray("status"),

                // Date Ranges
                expiryFilter: searchParams.get("expiryFilter") || "",
                expiryFrom: searchParams.get("expiryFrom") || "",
                expiryTo: searchParams.get("expiryTo") || "",

                // Version
                versionFrom: searchParams.get("versionFrom") || "",
                versionTo: searchParams.get("versionTo") || "",

                // Folder
                folderId: searchParams.get("folderId") || "",
                includeSubfolders: searchParams.get("includeSubfolders") === "true"
            })
        }
    }, [isOpen, searchParams])

    const handleApply = () => {
        const params = new URLSearchParams(searchParams.toString())

        // Helper to set/delete
        const update = (key: string, value: any) => {
            if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
                params.delete(key)
            } else {
                if (Array.isArray(value)) {
                    params.set(key, value.join(","))
                } else {
                    params.set(key, String(value))
                }
            }
        }

        update("status", localFilters.status)
        update("type", localFilters.typeIds)

        update("expiryFilter", localFilters.expiryFilter)
        update("expiryFrom", localFilters.expiryFilter === 'custom' ? localFilters.expiryFrom : null)
        update("expiryTo", localFilters.expiryFilter === 'custom' ? localFilters.expiryTo : null)

        update("versionFrom", localFilters.versionFrom)
        update("versionTo", localFilters.versionTo)

        update("folderId", localFilters.folderId)
        update("includeSubfolders", localFilters.includeSubfolders ? "true" : null)

        params.set("page", "1") // Reset page

        router.push(pathname + "?" + params.toString())
        onClose()
    }

    const handleReset = () => {
        setLocalFilters({})
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={onClose} />

            {/* Drawer */}
            <div className="relative w-full max-w-sm bg-background h-full shadow-xl flex flex-col border-l animate-in slide-in-from-right duration-300">
                <div className="p-4 border-b flex justify-between items-center bg-card">
                    <div>
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Filter size={18} />
                            Advanced Filters
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Refine your document search</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-8 bg-card/50">
                    {/* Metadata Section */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">Metadata</h3>

                        <div className="space-y-3">
                            <label className="text-sm font-medium block">Type</label>
                            <div className="grid grid-cols-1 gap-2 bg-background p-3 rounded-md border">
                                {documentTypes.map(type => (
                                    <label key={type.id} className="flex items-center gap-3 text-sm cursor-pointer hover:text-foreground/80">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                                            checked={localFilters.typeIds?.includes(type.id) || false}
                                            onChange={(e) => {
                                                const current = localFilters.typeIds || []
                                                const next = e.target.checked
                                                    ? [...current, type.id]
                                                    : current.filter((id: string) => id !== type.id)
                                                setLocalFilters({ ...localFilters, typeIds: next })
                                            }}
                                        />
                                        <span className="truncate">{type.name}</span>
                                    </label>
                                ))}
                                {documentTypes.length === 0 && <span className="text-xs text-muted-foreground italic">No types available</span>}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium block">Status</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'OBSOLETE'].map(status => (
                                    <label key={status} className="flex items-center gap-2 text-sm cursor-pointer bg-background p-2 rounded-md border hover:border-primary/50 transition-colors">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                                            checked={localFilters.status?.includes(status) || false}
                                            onChange={(e) => {
                                                const current = localFilters.status || []
                                                const next = e.target.checked
                                                    ? [...current, status]
                                                    : current.filter((s: string) => s !== status)
                                                setLocalFilters({ ...localFilters, status: next })
                                            }}
                                        />
                                        <span className="capitalize">{status.toLowerCase().replace('_', ' ')}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Lifecycle & Expiry */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">Lifecycle</h3>

                        <div className="space-y-3">
                            <label className="text-sm font-medium block">Expiry</label>
                            <select
                                className="w-full text-sm border rounded-md h-9 px-3 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                                value={localFilters.expiryFilter || ""}
                                onChange={(e) => setLocalFilters({ ...localFilters, expiryFilter: e.target.value })}
                            >
                                <option value="">Any</option>
                                <option value="expired">Expired</option>
                                <option value="expiring_30">Expiring in 30 days</option>
                                <option value="expiring_90">Expiring in 90 days</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>

                        {localFilters.expiryFilter === 'custom' && (
                            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-md border">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">From</label>
                                    <input
                                        type="date"
                                        className="w-full text-sm border rounded h-8 px-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                                        value={localFilters.expiryFrom || ""}
                                        onChange={(e) => setLocalFilters({ ...localFilters, expiryFrom: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">To</label>
                                    <input
                                        type="date"
                                        className="w-full text-sm border rounded h-8 px-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                                        value={localFilters.expiryTo || ""}
                                        onChange={(e) => setLocalFilters({ ...localFilters, expiryTo: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Location */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">Location</h3>
                        <label className="flex items-center gap-3 text-sm cursor-pointer p-3 bg-background rounded-md border hover:border-primary/50 transition-colors">
                            <input
                                type="checkbox"
                                className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                                checked={localFilters.includeSubfolders || false}
                                onChange={(e) => setLocalFilters({ ...localFilters, includeSubfolders: e.target.checked })}
                            />
                            <span className="font-medium">Include Subfolders</span>
                        </label>
                        <p className="text-[10px] text-muted-foreground px-1">
                            When enabled, search includes current folder and all nested subfolders.
                        </p>
                    </div>

                    {/* Version */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">Version</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Min Version</label>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 1"
                                    className="w-full text-sm border rounded h-9 px-3 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                                    value={localFilters.versionFrom || ""}
                                    onChange={(e) => setLocalFilters({ ...localFilters, versionFrom: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Max Version</label>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 10"
                                    className="w-full text-sm border rounded h-9 px-3 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                                    value={localFilters.versionTo || ""}
                                    onChange={(e) => setLocalFilters({ ...localFilters, versionTo: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t bg-card flex gap-3">
                    <button
                        onClick={handleReset}
                        className="flex-1 px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors"
                    >
                        Reset
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        Apply Filters
                    </button>

                </div>
            </div>
        </div>
    )
}
