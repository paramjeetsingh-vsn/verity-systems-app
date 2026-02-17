"use client"

import React from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface TableSkeletonProps {
    rows?: number
    columns?: number
}

export function TableSkeleton({ rows = 8, columns = 7 }: TableSkeletonProps) {
    const widths = ["w-8", "w-20", "w-48", "w-16", "w-20", "w-12", "w-20", "w-20", "w-8"]

    return (
        <div className="flex flex-col min-h-full bg-background flex-1">
            <div className="rounded-md border flex-1">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {Array.from({ length: columns }).map((_, i) => (
                                <TableHead key={i}>
                                    <div className={`h-4 ${widths[i] || "w-20"} bg-muted rounded animate-pulse`} />
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: rows }).map((_, rowIdx) => (
                            <TableRow key={rowIdx}>
                                {Array.from({ length: columns }).map((_, colIdx) => (
                                    <TableCell key={colIdx}>
                                        {colIdx === 0 ? (
                                            <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                                        ) : colIdx === 2 ? (
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 bg-muted rounded animate-pulse shrink-0" />
                                                <div className="flex flex-col gap-1.5 flex-1">
                                                    <div className="h-3.5 w-36 bg-muted rounded animate-pulse" />
                                                    <div className="h-2.5 w-24 bg-muted/60 rounded animate-pulse" />
                                                </div>
                                            </div>
                                        ) : colIdx === 4 ? (
                                            <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
                                        ) : (
                                            <div
                                                className={`h-3.5 ${widths[colIdx] || "w-16"} bg-muted rounded animate-pulse`}
                                                style={{ animationDelay: `${(rowIdx * columns + colIdx) * 50}ms` }}
                                            />
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
