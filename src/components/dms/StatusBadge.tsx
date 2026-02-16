import React from "react"
import {
    CheckCircle2,
    Clock,
    XCircle,
    AlertCircle,
    Archive,
    FileText
} from "lucide-react"

export type DmsStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "OBSOLETE" | "EXPIRED" | string

interface StatusBadgeProps {
    status: DmsStatus
    className?: string
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
    const getStatusConfig = (s: string) => {
        const normalized = s.toUpperCase()

        switch (normalized) {
            case "APPROVED":
                return {
                    color: "bg-green-100 text-green-800 border-green-200",
                    icon: <CheckCircle2 size={12} />
                }
            case "SUBMITTED":
                return {
                    color: "bg-blue-100 text-blue-800 border-blue-200",
                    icon: <Clock size={12} />
                }
            case "REJECTED":
                return {
                    color: "bg-red-100 text-red-800 border-red-200",
                    icon: <XCircle size={12} />
                }
            case "EXPIRED":
                return {
                    color: "bg-red-50 text-red-900 border-red-200 font-semibold", // Darker red/distinct
                    icon: <AlertCircle size={12} />
                }
            case "OBSOLETE":
                return {
                    color: "bg-orange-100 text-orange-800 border-orange-200",
                    icon: <Archive size={12} />
                }
            case "DRAFT":
                return {
                    color: "bg-gray-100 text-gray-700 border-gray-200",
                    icon: <FileText size={12} />
                }
            default:
                return {
                    color: "bg-gray-100 text-gray-600 border-gray-200",
                    icon: <Clock size={12} />
                }
        }
    }

    const config = getStatusConfig(status)

    // UI Override: Display "SUBMITTED" as "IN REVIEW"
    const displayStatus = status === "SUBMITTED" ? "IN REVIEW" : status

    return (
        <div className={`
            inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide
            ${config.color}
            ${className}
        `}>
            {config.icon}
            {displayStatus}
        </div>
    )
}
