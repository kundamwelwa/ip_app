"use client";

import { ReactNode, useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar - Independent Scroll */}
        <div className="h-screen overflow-y-auto border-r">
          <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        </div>
        
        {/* Main Content - Independent Scroll */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header - Fixed */}
          <div className="flex-shrink-0">
            <Header />
          </div>
          
          {/* Page Content - Scrollable */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
