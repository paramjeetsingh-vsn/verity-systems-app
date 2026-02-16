"use client"

import React, { useEffect, useState, useCallback } from "react"
import {
    Plus,
    Edit2,
    Trash2,
    RotateCcw,
    Loader2,
    Search,
    AlertCircle,
    CheckCircle2
} from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { Modal } from "@/components/ui/Modal"

interface DocumentType {
    id: string
    name: string
    isActive: boolean
    createdAt: string
    _count?: {
        documents: number
    }
}

export default function DocumentTypesPage() {
    const { fetchWithAuth, user } = useAuth()
    const [types, setTypes] = useState<DocumentType[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState("")

    // Modal States
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [selectedType, setSelectedType] = useState<DocumentType | null>(null)

    // Form States
    const [formName, setFormName] = useState("")
    const [processing, setProcessing] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    const [isDeactivateOpen, setIsDeactivateOpen] = useState(false)

    const [isReactivateOpen, setIsReactivateOpen] = useState(false)

    const loadTypes = useCallback(async () => {
        try {
            setLoading(true)
            const data = await fetchWithAuth<DocumentType[]>("/api/secure/dms/document-types")
            setTypes(data)
        } catch (err: any) {
            setError(err.message || "Failed to load document types")
        } finally {
            setLoading(false)
        }
    }, [fetchWithAuth])

    useEffect(() => {
        loadTypes()
    }, [loadTypes])

    // Filtered list
    const filteredTypes = types.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase())
    )

    // Handlers
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setProcessing(true)
            setFormError(null)
            await fetchWithAuth("/api/secure/dms/document-types", {
                method: "POST",
                body: JSON.stringify({ name: formName })
            })
            setIsCreateOpen(false)
            setFormName("")
            loadTypes()
        } catch (err: any) {
            setFormError(err.message)
        } finally {
            setProcessing(false)
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedType) return
        try {
            setProcessing(true)
            setFormError(null)
            await fetchWithAuth(`/api/secure/dms/document-types/${selectedType.id}`, {
                method: "PATCH",
                body: JSON.stringify({ name: formName })
            })
            setIsEditOpen(false)
            setSelectedType(null)
            setFormName("")
            loadTypes()
        } catch (err: any) {
            setFormError(err.message)
        } finally {
            setProcessing(false)
        }
    }

    // Opens the Deactivate Modal
    const openDeactivate = (type: DocumentType) => {
        setSelectedType(type)
        setIsDeactivateOpen(true)
        setFormError(null)
    }

    const confirmDeactivate = async () => {
        if (!selectedType) return
        try {
            setProcessing(true)
            await fetchWithAuth(`/api/secure/dms/document-types/${selectedType.id}`, {
                method: "DELETE"
            })
            setIsDeactivateOpen(false)
            setSelectedType(null)
            loadTypes()
        } catch (err: any) {
            setFormError(err.message)
        } finally {
            setProcessing(false)
        }
    }

    // Opens the Reactivate Modal
    const openReactivate = (type: DocumentType) => {
        setSelectedType(type)
        setIsReactivateOpen(true)
        setFormError(null)
    }

    const confirmReactivate = async () => {
        if (!selectedType) return
        try {
            setProcessing(true)
            await fetchWithAuth(`/api/secure/dms/document-types/${selectedType.id}`, {
                method: "PATCH",
                body: JSON.stringify({ reactivate: true })
            })
            setIsReactivateOpen(false)
            setSelectedType(null)
            loadTypes()
        } catch (err: any) {
            setFormError(err.message)
        } finally {
            setProcessing(false)
        }
    }

    const openEdit = (type: DocumentType) => {
        setSelectedType(type)
        setFormName(type.name)
        setIsEditOpen(true)
        setFormError(null)
    }

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Document Types</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage the taxonomy for document classification.</p>
                </div>
                <button
                    onClick={() => { setIsCreateOpen(true); setFormName(""); setFormError(null); }}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={16} />
                    New Type
                </button>
            </div>

            {/* Search & List */}
            <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-muted/20">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search types..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input-field pl-9"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 flex justify-center">
                        <Loader2 className="animate-spin text-primary" />
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-destructive">
                        <AlertCircle className="mx-auto mb-2" />
                        <p>{error}</p>
                    </div>
                ) : filteredTypes.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <p>No document types found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Name</th>
                                    <th className="px-6 py-3 font-medium">Usage</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredTypes.map((type) => (
                                    <tr key={type.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-6 py-4 font-medium">{type.name}</td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {type._count?.documents || 0} docs
                                        </td>
                                        <td className="px-6 py-4">
                                            {type.isActive ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => openEdit(type)}
                                                className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>

                                            {type.isActive ? (
                                                <button
                                                    onClick={() => openDeactivate(type)}
                                                    className="p-1.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive"
                                                    title="Deactivate"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => openReactivate(type)}
                                                    className="p-1.5 hover:bg-primary/10 rounded text-muted-foreground hover:text-primary"
                                                    title="Reactivate"
                                                >
                                                    <RotateCcw size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Create Document Type"
            >
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <input
                            autoFocus
                            type="text"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder="e.g. Invoice, Policy, Contract"
                            className="input-field w-full"
                            required
                        />
                    </div>
                    {formError && (
                        <div className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle size={12} /> {formError}
                        </div>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setIsCreateOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary" disabled={processing || !formName.trim()}>
                            {processing ? <Loader2 size={16} className="animate-spin" /> : "Create"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                title="Edit Document Type"
            >
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <input
                            autoFocus
                            type="text"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            className="input-field w-full"
                            required
                        />
                    </div>
                    {formError && (
                        <div className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle size={12} /> {formError}
                        </div>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setIsEditOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary" disabled={processing || !formName.trim()}>
                            {processing ? <Loader2 size={16} className="animate-spin" /> : "Save Changes"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Deactivate Modal */}
            <Modal
                isOpen={isDeactivateOpen}
                onClose={() => setIsDeactivateOpen(false)}
                title="Deactivate Document Type"
            >
                <div className="space-y-4">
                    <div className="p-3 bg-destructive/10 text-destructive rounded-md flex items-start gap-3">
                        <AlertCircle className="shrink-0 mt-0.5" size={18} />
                        <div className="space-y-1">
                            <p className="font-medium text-sm">Action Required</p>
                            <p className="text-sm opacity-90">
                                Are you sure you want to deactivate <span className="font-bold">"{selectedType?.name}"</span>?
                            </p>
                        </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        This will prevent any <strong>new documents</strong> from using this type. Existing documents will remain unchanged and can still be searched.
                    </p>

                    {formError && (
                        <div className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle size={12} /> {formError}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsDeactivateOpen(false)}
                            className="btn-secondary"
                            disabled={processing}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={confirmDeactivate}
                            className="btn-destructive"
                            disabled={processing}
                        >
                            {processing ? <Loader2 size={16} className="animate-spin" /> : "Deactivate"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Reactivate Modal */}
            <Modal
                isOpen={isReactivateOpen}
                onClose={() => setIsReactivateOpen(false)}
                title="Reactivate Document Type"
            >
                <div className="space-y-4">
                    <div className="p-3 bg-primary/10 text-primary rounded-md flex items-start gap-3">
                        <CheckCircle2 className="shrink-0 mt-0.5" size={18} />
                        <div className="space-y-1">
                            <p className="font-medium text-sm">Restoration</p>
                            <p className="text-sm opacity-90">
                                Restore <span className="font-bold">"{selectedType?.name}"</span> to active status?
                            </p>
                        </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        This type will immediately become available in the dropdown for creating new documents.
                    </p>

                    {formError && (
                        <div className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle size={12} /> {formError}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsReactivateOpen(false)}
                            className="btn-secondary"
                            disabled={processing}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={confirmReactivate}
                            className="btn-primary"
                            disabled={processing}
                        >
                            {processing ? <Loader2 size={16} className="animate-spin" /> : "Reactivate"}
                        </button>
                    </div>
                </div>
            </Modal>

        </div>
    )
}
