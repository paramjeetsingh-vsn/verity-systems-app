"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {

    PanelLeft,
    Menu,
    X,
    FolderOpen,
    FileText
} from "lucide-react"
import { FolderTree } from "@/components/dms/FolderTree"
import { DmsDocumentList } from "@/components/dms/DocumentList"
import { DmsSearchBar } from "@/components/dms/SearchBar"
import { CreateDocumentModal } from "@/components/dms/CreateDocumentModal"
import { usePermission } from "@/lib/auth/use-permission"

export default function DmsDashboard() {
    const router = useRouter()

    // State
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [itemCount, setItemCount] = useState(0)

    // Permissions
    const canCreateDocument = usePermission("DMS_DOCUMENT_CREATE")

    const handleDocumentSelect = React.useCallback((docId: string) => {
        router.push(`/dms/documents/${docId}`)
    }, [router])

    const handleCreateSuccess = React.useCallback((docId: string) => {
        router.push(`/dms/documents/${docId}`)
    }, [router])

    const handleCreateClick = React.useCallback(() => {
        setIsCreateModalOpen(true)
    }, [])

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] -m-4 sm:-m-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-background border-b gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="lg:hidden p-2 hover:bg-muted rounded-md transition-colors"
                    >
                        {isSidebarOpen ? <X size={20} /> : <PanelLeft size={20} />}
                    </button>
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <FolderOpen className="text-primary hidden sm:block" size={24} />
                            Document Management
                        </h1>
                        <p className="text-xs text-muted-foreground hidden sm:block">
                            Secure enterprise content repository
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <DmsSearchBar onSearch={setSearchQuery} />

                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Responsive Sidebar (Folder Tree) */}
                <div className={`
                    absolute lg:relative inset-y-0 left-0 z-30 transition-transform duration-300 transform bg-background
                    ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
                    lg:translate-x-0 ${isSidebarOpen ? "lg:w-64" : "lg:w-0"}
                    overflow-hidden
                `}>
                    <FolderTree
                        selectedFolderId={selectedFolderId}
                        onFolderSelect={(id) => {
                            setSelectedFolderId(id)
                            // Auto-close on mobile after selection
                            if (window.innerWidth < 1024) setIsSidebarOpen(false)
                        }}
                    />
                </div>

                {/* Main List Area */}
                <div className="flex-1 overflow-y-auto flex flex-col bg-muted/20">
                    <DmsDocumentList
                        folderId={selectedFolderId}
                        search={searchQuery}
                        onDocumentSelect={handleDocumentSelect}
                        onLoadComplete={setItemCount}
                        onCreateClick={handleCreateClick}
                        showCreateButton={canCreateDocument}
                    />
                </div>

                {/* Mobile Backdrop */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </div>

            {/* Create Modal */}
            <CreateDocumentModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                folderId={selectedFolderId}
                onSuccess={handleCreateSuccess}
            />
        </div>
    )
}
