"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreVertical, FileText, History } from "lucide-react"
import { StatusBadge } from "@/components/dms/StatusBadge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"

// This type is used to define the shape of our data.
export interface DocumentData {
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

export const columns: ColumnDef<DocumentData>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected()
                        ? true
                        : (table.getIsSomePageRowsSelected() ? "indeterminate" : false)
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "documentNumber",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Doc No.
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => <div className="font-mono text-muted-foreground">{row.getValue("documentNumber") || '-'}</div>,
    },
    {
        accessorKey: "title",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Title
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const doc = row.original
            return (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/5 rounded border transition-colors">
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
            )
        },
    },
    {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
            const type = row.original.type
            return type?.name ? (
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">
                    {type.name}
                </span>
            ) : (
                <span className="text-muted-foreground text-xs">-</span>
            )
        },
    },
    {
        accessorKey: "status",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Status
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            return <StatusBadge status={row.original.effectiveStatus} />
        },
    },
    {
        accessorKey: "version",
        header: "Version",
        cell: ({ row }) => {
            return (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <History size={12} />
                    v{row.original.currentVersion?.versionNumber || 0}
                </div>
            )
        },
    },
    {
        accessorKey: "expiryDate",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Expiry
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const date = row.original.expiryDate
            return date ? <span className="text-xs text-muted-foreground">{new Date(date).toLocaleDateString()}</span> : <span className="text-xs text-muted-foreground">-</span>
        },
    },
    {
        accessorKey: "updatedAt",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Modified
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const date = row.original.updatedAt
            return <span className="text-xs text-muted-foreground">{new Date(date).toLocaleDateString()}</span>
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const doc = row.original
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(doc.id)}>
                            Copy ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        {/* Add more actions here */}
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
