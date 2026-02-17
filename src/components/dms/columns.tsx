"use client"

import { ColumnDef } from "@tanstack/react-table"
import {
    ArrowUpDown,
    MoreVertical,
    FileText,
    History,
    FileSpreadsheet,
    FileImage,
    FileVideo,
    FileAudio,
    FileArchive,
    FileCode,
    FilePen,
    FileCheck,
    FileWarning,
    FileClock,
    FileKey,
    Presentation,
    ScrollText,
    ClipboardList,
    BookOpen,
    ShieldCheck,
    Scale,
    Receipt,
    type LucideIcon,
} from "lucide-react"
import { formatRelativeDate } from "@/lib/utils/format-date"
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

const TYPE_ICON_MAP: Record<string, { icon: LucideIcon; color: string }> = {
    "policy": { icon: ShieldCheck, color: "text-blue-600" },
    "procedure": { icon: ClipboardList, color: "text-teal-600" },
    "sop": { icon: ClipboardList, color: "text-teal-600" },
    "standard operating procedure": { icon: ClipboardList, color: "text-teal-600" },
    "manual": { icon: BookOpen, color: "text-indigo-600" },
    "form": { icon: FilePen, color: "text-orange-600" },
    "template": { icon: FileText, color: "text-violet-600" },
    "report": { icon: FileSpreadsheet, color: "text-emerald-600" },
    "spreadsheet": { icon: FileSpreadsheet, color: "text-green-600" },
    "contract": { icon: Scale, color: "text-amber-700" },
    "agreement": { icon: Scale, color: "text-amber-700" },
    "legal": { icon: Scale, color: "text-amber-700" },
    "invoice": { icon: Receipt, color: "text-green-700" },
    "receipt": { icon: Receipt, color: "text-green-700" },
    "certificate": { icon: FileCheck, color: "text-emerald-700" },
    "license": { icon: FileKey, color: "text-yellow-700" },
    "permit": { icon: FileKey, color: "text-yellow-700" },
    "presentation": { icon: Presentation, color: "text-rose-600" },
    "image": { icon: FileImage, color: "text-pink-600" },
    "photo": { icon: FileImage, color: "text-pink-600" },
    "video": { icon: FileVideo, color: "text-purple-600" },
    "audio": { icon: FileAudio, color: "text-sky-600" },
    "archive": { icon: FileArchive, color: "text-stone-600" },
    "code": { icon: FileCode, color: "text-slate-600" },
    "specification": { icon: ScrollText, color: "text-cyan-700" },
    "memo": { icon: ScrollText, color: "text-cyan-600" },
    "letter": { icon: ScrollText, color: "text-cyan-600" },
    "drawing": { icon: FileImage, color: "text-fuchsia-600" },
    "diagram": { icon: FileImage, color: "text-fuchsia-600" },
    "checklist": { icon: FileCheck, color: "text-lime-700" },
    "audit": { icon: FileWarning, color: "text-amber-600" },
    "record": { icon: FileClock, color: "text-slate-500" },
    "log": { icon: FileClock, color: "text-slate-500" },
    "guideline": { icon: BookOpen, color: "text-blue-500" },
    "instruction": { icon: BookOpen, color: "text-blue-500" },
}

function getDocTypeIcon(typeName: string | undefined | null): { icon: LucideIcon; color: string } {
    if (!typeName) return { icon: FileText, color: "text-primary/70" }
    const lower = typeName.toLowerCase()
    if (TYPE_ICON_MAP[lower]) return TYPE_ICON_MAP[lower]
    for (const [key, val] of Object.entries(TYPE_ICON_MAP)) {
        if (lower.includes(key) || key.includes(lower)) return val
    }
    return { icon: FileText, color: "text-primary/70" }
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
            const { icon: Icon, color } = getDocTypeIcon(doc.type?.name)
            return (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/5 rounded border transition-colors">
                        <Icon size={18} className={color} />
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
            if (!date) return <span className="text-xs text-muted-foreground">-</span>
            const d = new Date(date)
            const isExpired = d.getTime() < Date.now()
            return (
                <span className={`text-xs ${isExpired ? "text-destructive font-medium" : "text-muted-foreground"}`} title={d.toLocaleString()}>
                    {formatRelativeDate(date)}
                </span>
            )
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
            return <span className="text-xs text-muted-foreground" title={new Date(date).toLocaleString()}>{formatRelativeDate(date)}</span>
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
