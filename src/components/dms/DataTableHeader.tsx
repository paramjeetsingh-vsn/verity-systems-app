"use client"

import React, { useState, useRef, useEffect } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, Filter, X, Check } from "lucide-react"

export type SortOrder = "asc" | "desc" | null

export interface FilterOption {
    label: string
    value: string
}

export interface DataTableHeaderProps {
    title: string
    columnId: string
    sortable?: boolean
    currentSortConfig?: { key: string; direction: SortOrder }
    onSort?: (key: string, direction: SortOrder) => void

    filterable?: boolean
    filterType?: "text" | "select" | "multi-select" | "date-range"
    filterOptions?: FilterOption[]
    currentFilterValue?: any
    onFilter?: (value: any) => void

    className?: string
}

export function DataTableHeader({
    title,
    columnId,
    sortable,
    currentSortConfig,
    onSort,
    filterable,
    filterType,
    filterOptions = [],
    currentFilterValue,
    onFilter,
    className
}: DataTableHeaderProps) {
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const filterRef = useRef<HTMLDivElement>(null)

    // Handle outside click to close filter dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleSortClick = () => {
        if (!sortable || !onSort) return

        let nextDirection: SortOrder = "asc"
        if (currentSortConfig?.key === columnId) {
            if (currentSortConfig.direction === "asc") nextDirection = "desc"
            else if (currentSortConfig.direction === "desc") nextDirection = null
        }

        onSort(columnId, nextDirection)
    }

    const isActiveFilter = currentFilterValue !== undefined && currentFilterValue !== null && currentFilterValue !== "" && (Array.isArray(currentFilterValue) ? currentFilterValue.length > 0 : true)

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <button
                onClick={handleSortClick}
                className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wider hover:text-foreground transition-colors ${currentSortConfig?.key === columnId ? "text-primary font-semibold" : "text-muted-foreground"}`}
            >
                {title}
                {sortable && (
                    <span className="ml-1">
                        {currentSortConfig?.key === columnId ? (
                            currentSortConfig.direction === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                        ) : (
                            <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                        )}
                    </span>
                )}
            </button>

            {filterable && (
                <div className="relative ml-1" ref={filterRef}>
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`p-1 rounded-sm hover:bg-muted transition-colors ${isActiveFilter || isFilterOpen ? "text-primary bg-primary/10" : "text-muted-foreground/50 hover:text-foreground"}`}
                    >
                        <Filter size={12} fill={isActiveFilter ? "currentColor" : "none"} />
                    </button>

                    {isFilterOpen && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-popover text-popover-foreground border rounded-md shadow-md z-50 p-2 animate-in fade-in zoom-in-95 duration-100">
                            {/* Text Filter */}
                            {filterType === "text" && (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        placeholder={`Filter ${title}...`}
                                        className="w-full h-8 px-2 text-sm border rounded bg-background"
                                        value={currentFilterValue || ""}
                                        onChange={(e) => onFilter?.(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            )}

                            {/* Select / Multi-Select */}
                            {(filterType === "select" || filterType === "multi-select") && (
                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                    {filterOptions.map((opt) => {
                                        const isSelected = filterType === "multi-select"
                                            ? (currentFilterValue as string[])?.includes(opt.value)
                                            : currentFilterValue === opt.value

                                        return (
                                            <div
                                                key={opt.value}
                                                className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded cursor-pointer"
                                                onClick={() => {
                                                    if (filterType === "multi-select") {
                                                        const current = (currentFilterValue as string[]) || []
                                                        const next = isSelected
                                                            ? current.filter(v => v !== opt.value)
                                                            : [...current, opt.value]
                                                        onFilter?.(next.length ? next : undefined)
                                                    } else {
                                                        onFilter?.(isSelected ? undefined : opt.value)
                                                        setIsFilterOpen(false)
                                                    }
                                                }}
                                            >
                                                <div className={`w-3 h-3 border rounded flex items-center justify-center ${isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"}`}>
                                                    {isSelected && <Check size={8} />}
                                                </div>
                                                <span>{opt.label}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="pt-2 mt-2 border-t flex justify-between">
                                <button
                                    onClick={() => {
                                        onFilter?.(undefined)
                                        setIsFilterOpen(false)
                                    }}
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                >
                                    Clear
                                </button>
                                <button
                                    onClick={() => setIsFilterOpen(false)}
                                    className="text-xs text-primary font-medium hover:underline"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
