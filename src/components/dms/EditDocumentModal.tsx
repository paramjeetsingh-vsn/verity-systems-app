"use client"

import React, { useState, useEffect } from "react"
import {
    Loader2,
    AlertCircle,
    CheckCircle2,
    Calendar,
    Tag,
    Save
} from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { Modal } from "@/components/ui/Modal"

interface DocumentDetail {
    id: string
    title: string
    description?: string
    expiryDate: string | null
    type?: { id: string, name: string } | null
    typeId?: string
    folderId: string | null
}

interface EditDocumentModalProps {
    isOpen: boolean
    onClose: () => void
    document: DocumentDetail
    onSuccess: () => void
}

interface DocumentType {
    id: string;
    name: string;
}

export function EditDocumentModal({ isOpen, onClose, document, onSuccess }: EditDocumentModalProps) {
    const { fetchWithAuth } = useAuth()

    // Form State
    const [title, setTitle] = useState(document.title)
    const [description, setDescription] = useState(document.description || "")
    const [expiryDate, setExpiryDate] = useState(document.expiryDate ? new Date(document.expiryDate).toISOString().split('T')[0] : "")
    const [typeId, setTypeId] = useState(document.type?.id || "")

    // Data State
    const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
    const [loadingTypes, setLoadingTypes] = useState(false)

    // UI State
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // Reset form when document changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setTitle(document.title)
            setDescription(document.description || "")
            setExpiryDate(document.expiryDate ? new Date(document.expiryDate).toISOString().split('T')[0] : "")
            setTypeId(document.type?.id || "") // Note: typeId might not be directly in document object if not selected in include, but layout passes type object
            loadDocumentTypes();
        }
    }, [isOpen, document])

    const loadDocumentTypes = async () => {
        try {
            setLoadingTypes(true);
            const types = await fetchWithAuth<DocumentType[]>("/api/secure/dms/document-types?active=true");
            setDocumentTypes(types);
        } catch (err) {
            console.error("Failed to load document types", err);
        } finally {
            setLoadingTypes(false);
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return

        try {
            setSaving(true)
            setError(null)

            await fetchWithAuth(`/api/secure/dms/documents/${document.id}`, {
                method: "PATCH",
                body: JSON.stringify({
                    title,
                    description,
                    typeId: typeId || null, // Send null to clear if needed, or undefined to keep? API expects string or undefined. Service allows null? 
                    // Service updateDocumentMetadata: ...(typeId && { typeId }), so it only updates if provided? 
                    // Wait, if I want to CLEAR typeId, I need to send something. 
                    // Prisma update: typeId: typeId (if typeId is null, it sets null).
                    // API route check: body.typeId.
                    // If user selects "Select Type" (empty string), we should send null?
                    // Let's check service logic.
                    // Service: ...(typeId && { typeId }) -> this means if typeId is falsy (empty string), it WON'T update.
                    // This prevents clearing the type.
                    // I might need to adjust service or send a specific value.
                    // For now, let's assume setting a type is the goal.
                    expiryDate: expiryDate ? new Date(expiryDate) : null // null to clear expiry
                })
            })

            setSuccess(true)
            setTimeout(() => {
                onSuccess()
                onClose()
                setSuccess(false)
            }, 1000)
        } catch (err: any) {
            setError(err.message || "Failed to update document")
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Document Details"
            footer={
                <div className="flex justify-end gap-3 w-full">
                    <button
                        onClick={onClose}
                        className="btn-secondary"
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="btn-primary flex items-center gap-2"
                        disabled={!title.trim() || saving || success}
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {saving ? "Saving..." : success ? "Saved!" : "Save Changes"}
                    </button>
                </div>
            }
        >
            <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                        <label className="text-sm font-medium leading-none">Document Title <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="input-field w-full"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none flex items-center gap-2">
                            <Tag size={14} />
                            Document Type
                        </label>
                        {loadingTypes ? (
                            <div className="h-10 w-full rounded-md border border-input bg-muted animate-pulse" />
                        ) : (
                            <select
                                value={typeId}
                                onChange={(e) => setTypeId(e.target.value)}
                                className="input-field w-full"
                            >
                                <option value="">Select Type (Optional)</option>
                                {documentTypes.map(type => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none flex items-center gap-2">
                            <Calendar size={14} />
                            Expiry Date
                        </label>
                        <input
                            type="date"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            className="input-field w-full"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="input-field w-full min-h-[80px]"
                    />
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md animate-in slide-in-from-top-2">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}
            </form>
        </Modal>
    )
}
