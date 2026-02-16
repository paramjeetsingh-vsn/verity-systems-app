"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/ui/Sidebar";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";

export default function DashboardLayout({ children }) {
    const [mobileOpen, setMobileOpen] = useState(false);

    const pathname = usePathname();
    // Pages that should be full width
    const isFullWidth = pathname?.startsWith("/dms") || pathname?.startsWith("/admin");

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header setMobileOpen={setMobileOpen} />
                <main className="flex-1 p-4 sm:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <div className={`mx-auto w-full ${isFullWidth ? "max-w-full" : "max-w-7xl"}`}>
                        {children}
                    </div>
                </main>
                <Footer />
            </div>
        </div>
    );
}
