import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-subtle">
        <AppSidebar />
        
        <main className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="h-16 border-b border-border/50 bg-card/80 backdrop-blur-sm flex items-center px-6 gap-4">
            <SidebarTrigger className="h-8 w-8 p-0 hover:bg-accent/50" />
            
            <div className="flex-1" />
            
            <div className="flex items-center gap-3">
              <NotificationDropdown />
            </div>
          </header>
          
          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}