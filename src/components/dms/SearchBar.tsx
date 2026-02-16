"use client"

import React, { useState, useEffect } from "react"
import { Search, X, Loader2 } from "lucide-react"

interface DmsSearchBarProps {
    onSearch: (query: string) => void
    isLoading?: boolean
    placeholder?: string
    initialValue?: string
}

export function DmsSearchBar({
    onSearch,
    isLoading = false,
    placeholder = "Search documents...",
    initialValue = ""
}: DmsSearchBarProps) {
    const [query, setQuery] = useState(initialValue)

    // Debounce logic
    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(query)
        }, 400) // Slightly longer debounce for better performance

        return () => clearTimeout(timer)
    }, [query, onSearch])

    const handleClear = () => {
        setQuery("")
        onSearch("")
    }

    return (
        <div className="relative group w-full max-w-md">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : (
                    <Search size={18} />
                )}
            </div>

            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className={`
                    w-full pl-10 pr-10 py-2 bg-muted/50 border rounded-lg text-sm outline-none transition-all
                    placeholder:text-muted-foreground/60
                    focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary/50
                    border-transparent hover:border-muted-foreground/20
                `}
            />

            {query && !isLoading && (
                <button
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground transition-all"
                    title="Clear search"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    )
}
