"use client"

import React, { useState } from "react"
import {
    CheckCircle,
    XCircle,
    Send,
    RotateCcw,
    Loader2,
    Edit3,
    Archive
} from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { getAvailableWorkflowActions, UiWorkflowAction } from "@/lib/dms/ui-logic"
import { RejectDocumentModal } from "./RejectDocumentModal"

interface DocumentHeaderActionsProps {
    document: {
        id: string
        status: string
        effectiveStatus: string
        currentVersion?: {
            id: string
        }
    }
    onSuccess: () => void
}

export function DocumentHeaderActions({ document, onSuccess }: DocumentHeaderActionsProps) {
    const { fetchWithAuth, user } = useAuth()
    const [loadingAction, setLoadingAction] = useState<string | null>(null)
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)

    // Helper to execute workflow transition
    const executeWorkflow = async (action: string, comment?: string) => {
        // Intercept REJECT action to show modal if no comment provided yet
        if (action === "reject" && !comment) {
            setIsRejectModalOpen(true)
            return
        }

        try {
            setLoadingAction(action)
            await fetchWithAuth(`/api/secure/dms/documents/${document.id}/workflow`, {
                method: "POST",
                body: JSON.stringify({ action, comment })
            })
            onSuccess()
        } catch (err: any) {
            alert(err.message || "Workflow action failed")
        } finally {
            setLoadingAction(null)
        }
    }

    // 1. Get User Permissions (as string array)
    const userPermissions = user?.permissions || []

    // 2. Compute Available Actions
    const availableActions = getAvailableWorkflowActions(document.effectiveStatus, userPermissions)

    if (availableActions.length === 0) return null

    // Helper to render icon
    const getIcon = (action: string) => {
        switch (action) {
            case "submit": return <Send size={16} />
            case "approve": return <CheckCircle size={16} />
            case "reject": return <XCircle size={16} />
            case "revise": return <Edit3 size={16} />
            case "obsolete": return <Archive size={16} />
            default: return <RotateCcw size={16} />
        }
    }

    // Helper to get color classes
    const getVariantClasses = (variant: UiWorkflowAction["variant"]) => {
        switch (variant) {
            case "primary": return "bg-blue-600 hover:bg-blue-700 text-white"
            case "success": return "bg-green-600 hover:bg-green-700 text-white"
            case "danger": return "bg-red-600 hover:bg-red-700 text-white"
            case "info": return "bg-sky-600 hover:bg-sky-700 text-white"
            case "secondary": return "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
            default: return "bg-gray-600 text-white"
        }
    }

    return (
        <>
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
                {availableActions.map((action) => (
                    <button
                        key={action.action}
                        onClick={() => executeWorkflow(action.action)}
                        disabled={!!loadingAction || (action.action === "submit" && !document.currentVersion)}
                        className={`
                            inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors shadow-sm
                            disabled:opacity-50 disabled:cursor-not-allowed
                            ${getVariantClasses(action.variant)}
                        `}
                        title={
                            action.action === "submit" && !document.currentVersion
                                ? "Upload a version first"
                                : action.label
                        }
                    >
                        {loadingAction === action.action ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            getIcon(action.action)
                        )}
                        <span>{action.label}</span>
                    </button>
                ))}
            </div>

            <RejectDocumentModal
                isOpen={isRejectModalOpen}
                onClose={() => setIsRejectModalOpen(false)}
                onConfirm={async (comment) => {
                    await executeWorkflow("reject", comment)
                }}
            />
        </>
    )
}


