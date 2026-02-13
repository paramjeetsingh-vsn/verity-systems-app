"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import {
    Monitor,
    Smartphone,
    Globe,
    Clock,
    ShieldCheck,
    LogOut,
    Search,
    RefreshCw
} from "lucide-react";

type Session = {
    id: number;
    userId: number;
    userEmail: string;
    userName: string;
    deviceInfo: string | null;
    ipAddress: string | null;
    lastActiveAt: string | null;
    createdAt: string;
    expiresAt: string;
    mfaVerified: boolean;
};

export default function SessionsClient() {
    const { fetchWithAuth } = useAuth();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [revokingId, setRevokingId] = useState<number | null>(null);

    const loadSessions = async () => {
        setLoading(true);
        try {
            const data = await fetchWithAuth<{ sessions: Session[] }>("/api/admin/sessions");
            setSessions(data.sessions);
            setError("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load sessions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSessions();
    }, []);

    const handleRevoke = async (id: number) => {
        if (!confirm("Are you sure you want to revoke this session? The user will be logged out immediately.")) {
            return;
        }

        setRevokingId(id);
        try {
            await fetchWithAuth(`/api/admin/sessions/${id}`, {
                method: "DELETE"
            });
            setSessions(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to revoke session");
        } finally {
            setRevokingId(null);
        }
    };

    const filteredSessions = sessions.filter(s =>
        s.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.deviceInfo || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.ipAddress || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getDeviceIcon = (info: string | null) => {
        if (!info) return <Globe className="h-4 w-4" />;
        const lower = info.toLowerCase();
        if (lower.includes("mobi") || lower.includes("android") || lower.includes("iphone")) {
            return <Smartphone className="h-4 w-4" />;
        }
        return <Monitor className="h-4 w-4" />;
    };

    if (error && sessions.length === 0) {
        return (
            <div className="p-8 text-center bg-destructive/10 text-destructive rounded-lg border border-destructive/20 mt-6">
                <h3 className="font-semibold mb-2">Error Loading Sessions</h3>
                <p>{error}</p>
                <button
                    onClick={loadSessions}
                    className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Active Sessions</h1>
                    <p className="text-muted-foreground">Monitor and manage all active user sessions across the system.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadSessions}
                        disabled={loading}
                        className="p-2 rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-50"
                        title="Refresh sessions"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by user, device, or IP..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                <div className="bg-muted/50 px-4 py-2 rounded-md border border-border flex items-center gap-2">
                    <span className="text-sm font-medium">{filteredSessions.length}</span>
                    <span className="text-sm text-muted-foreground">Active Sessions</span>
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Device & IP</th>
                                <th className="px-6 py-4 text-center">MFA</th>
                                <th className="px-6 py-4">Last Active</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading && filteredSessions.length === 0 ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-8 h-16 bg-muted/20"></td>
                                    </tr>
                                ))
                            ) : filteredSessions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                        No active sessions found.
                                    </td>
                                </tr>
                            ) : (
                                filteredSessions.map(session => (
                                    <tr key={session.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-foreground">{session.userName}</span>
                                                <span className="text-xs text-muted-foreground">{session.userEmail}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-muted rounded-md shrink-0">
                                                    {getDeviceIcon(session.deviceInfo)}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="truncate max-w-[200px] text-xs font-medium" title={session.deviceInfo || 'Unknown Device'}>
                                                        {session.deviceInfo || 'Unknown Device'}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground font-mono">{session.ipAddress || 'Unknown IP'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                {session.mfaVerified ? (
                                                    <div className="flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                                                        <ShieldCheck className="h-3 w-3" />
                                                        <span className="text-[10px] font-bold">VERIFIED</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
                                                        PWD ONLY
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                                    {session.lastActiveAt ? new Date(session.lastActiveAt).toLocaleString() : 'Never'}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground mt-0.5">
                                                    Created: {new Date(session.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleRevoke(session.id)}
                                                disabled={revokingId === session.id}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50"
                                            >
                                                <LogOut className="h-3 w-3" />
                                                {revokingId === session.id ? 'Revoking...' : 'Revoke'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
