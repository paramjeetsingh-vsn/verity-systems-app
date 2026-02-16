"use client"

import React, { useState } from "react"
import {
    X,
    AlertTriangle,
    Loader2
} from "lucide-react"

interface RejectDocumentModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (comment: string) => Promise<void>
}

export function RejectDocumentModal({ isOpen, onClose, onConfirm }: RejectDocumentModalProps) {
    const [comment, setComment] = useState("")
    const [processing, setProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!comment.trim()) {
            setError("Rejection reason is required.")
            return
        }

        try {
            setProcessing(true)
            setError(null)
            await onConfirm(comment)
            // Cleanup and close are handled by parent usually, but we can reset form
            setComment("")
            onClose()
        } catch (err: any) {
            setError(err.message || "Failed to reject document")
        } finally {
            setProcessing(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-background w-full max-w-md rounded-lg shadow-xl border overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-destructive">
                        <AlertTriangle size={20} />
                        Reject Document
                    </h3>
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="comment" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Reason for Rejection <span className="text-destructive">*</span>
                        </label>
                        <p className="text-xs text-muted-foreground">
                            Please provide a reason. This will be visible in the document history.
                        </p>
                        <textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            disabled={processing}
                            placeholder="e.g. Missing required signature on page 3..."
                            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-center gap-2">
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing || !comment.trim()}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground text-sm font-medium rounded-md hover:bg-destructive/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? <Loader2 size={16} className="animate-spin" /> : null}
                            Reject Document
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
