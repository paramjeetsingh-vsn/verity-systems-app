"use client"

import React from "react"
import { FileText, FolderOpen, Plus, SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
    hasSearch?: boolean
    hasFolder?: boolean
    folderName?: string
    canCreate?: boolean
    onCreateClick?: () => void
}

export function EmptyState({ hasSearch, hasFolder, folderName, canCreate, onCreateClick }: EmptyStateProps) {
    if (hasSearch) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 py-16 px-4">
                <div className="p-4 rounded-full bg-muted/80 mb-4">
                    <SearchX className="text-muted-foreground" size={32} />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">No matching documents</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                    Try adjusting your search terms or removing filters to find what you're looking for.
                </p>
            </div>
        )
    }

    if (hasFolder) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 py-16 px-4">
                <div className="p-4 rounded-full bg-muted/80 mb-4">
                    <FolderOpen className="text-muted-foreground" size={32} />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">
                    {folderName ? `"${folderName}" is empty` : "This folder is empty"}
                </h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
                    There are no documents in this folder yet.
                </p>
                {canCreate && onCreateClick && (
                    <Button size="sm" onClick={onCreateClick} className="shadow-sm">
                        <Plus size={15} className="mr-1.5" />
                        Add Document
                    </Button>
                )}
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center flex-1 py-16 px-4">
            <div className="p-4 rounded-full bg-primary/5 border border-primary/10 mb-4">
                <FileText className="text-primary/60" size={32} />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">No documents yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
                Get started by uploading your first document to keep everything organized.
            </p>
            {canCreate && onCreateClick && (
                <Button size="sm" onClick={onCreateClick} className="shadow-sm">
                    <Plus size={15} className="mr-1.5" />
                    Create Document
                </Button>
            )}
        </div>
    )
}
