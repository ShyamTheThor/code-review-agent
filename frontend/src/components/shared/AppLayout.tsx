import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-50 relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm animate-in fade-in duration-200" 
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <Sidebar />
        {/* Close button for mobile */}
        <button 
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white md:hidden"
          onClick={closeSidebar}
          aria-label="Close menu"
        >
          <X className="size-6" />
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Unified Navbar with Mobile Toggle */}
        <div className="sticky top-0 z-10 flex items-center bg-zinc-950/50 backdrop-blur-md border-b border-zinc-800">
          <div className="pl-4 md:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-zinc-400 hover:text-white"
              onClick={toggleSidebar}
              aria-label="Open menu"
            >
              <Menu className="size-6" />
            </Button>
          </div>
          <div className="flex-1">
            <Navbar />
          </div>
        </div>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
