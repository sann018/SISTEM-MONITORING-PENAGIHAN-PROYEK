import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex w-full h-svh bg-gray-50 overflow-hidden">
        {/* Sidebar */}
        <AppSidebar />
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-0">
          {/* Header Bar */}
          <header className="border-b border-gray-200 bg-white shadow-sm sticky top-0 z-40">
            <div className="flex items-center gap-4 px-4 md:px-6 py-3 md:py-4">
              <SidebarTrigger className="h-8 w-8 md:h-9 md:w-9 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300" />
              
              {title && (
                <h1 className="text-lg md:text-xl font-bold text-gray-900">
                  {title}
                </h1>
              )}
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
