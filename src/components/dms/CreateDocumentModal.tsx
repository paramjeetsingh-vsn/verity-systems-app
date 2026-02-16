"use client"

import React, { useState, useEffect } from "react"
import {
    FilePlus,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Calendar,
    Tag
} from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { Modal } from "@/components/ui/Modal"

interface CreateDocumentModalProps {
    isOpen: boolean
    onClose: () => void
    folderId: string | null
    onSuccess: (docId: string) => void
}

interface DocumentType {
    id: string;
    name: string;
}

export function CreateDocumentModal({ isOpen, onClose, folderId, onSuccess }: CreateDocumentModalProps) {
    const { fetchWithAuth } = useAuth()
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [expiryDate, setExpiryDate] = useState("")
    const [typeId, setTypeId] = useState("")

    const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
    const [loadingTypes, setLoadingTypes] = useState(false)

    const [creating, setCreating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        if (isOpen) {
            loadDocumentTypes();
        }
    }, [isOpen]);

    const loadDocumentTypes = async () => {
        try {
            setLoadingTypes(true);
            setLoadingTypes(true);
            const types = await fetchWithAuth<DocumentType[]>("/api/secure/dms/document-types?active=true");
            setDocumentTypes(types);
            setDocumentTypes(types);
        } catch (err) {
            console.error("Failed to load document types", err);
        } finally {
            setLoadingTypes(false);
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return

        try {
            setCreating(true)
            setError(null)

            const document = await fetchWithAuth("/api/secure/dms/documents", {
                method: "POST",
                body: JSON.stringify({
                    title,
                    description,
                    folderId,
                    typeId: typeId || undefined,
                    expiryDate: expiryDate ? new Date(expiryDate) : undefined
                })
            })

            setSuccess(true)
            setTimeout(() => {
                onSuccess(document.id)
                handleClose()
            }, 1000)
        } catch (err: any) {
            setError(err.message || "Failed to create document")
        } finally {
            setCreating(false)
        }
    }

    const handleClose = () => {
        setTitle("")
        setDescription("")
        setExpiryDate("")
        setTypeId("")
        setError(null)
        setSuccess(false)
        onClose()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Create New Document"
            footer={
                <div className="flex justify-end gap-3 w-full">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors"
                        disabled={creating}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md shadow-sm disabled:opacity-50 flex items-center gap-2 transition-all"
                        disabled={!title.trim() || creating || success}
                    >
                        {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        {creating ? "Creating..." : success ? "Created!" : "Create Draft"}
                    </button>
                </div>
            }
        >
            <form onSubmit={handleCreate} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Define the initial metadata for your document. You can upload files and start the workflow after creation.
                </p>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                        <label className="text-sm font-medium leading-none">Document Title <span className="text-red-500">*</span></label>
                        <input
                            autoFocus
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Quarterly Financial Report"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none flex items-center gap-2">
                            <Tag size={14} />
                            Document Type
                        </label>
                        <select
                            value={typeId}
                            onChange={(e) => setTypeId(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">Select Type (Optional)</option>
                            {documentTypes.map(type => (
                                <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                        </select>
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
                            min={new Date().toISOString().split('T')[0]}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Description (Optional)</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Brief summary of the document purpose..."
                        rows={3}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md animate-in slide-in-from-top-2">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md animate-in slide-in-from-top-2">
                        <CheckCircle2 size={16} />
                        <span>Document draft created successfully!</span>
                    </div>
                )}
            </form>
        </Modal>
    )
}

function Plus({ size }: { size: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}
