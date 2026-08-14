import { SidebarProvider, SidebarTrigger } from "src/components/ui/sidebar";
import { AppSidebar } from "src/components/layout/app-sidebar";
import { ThemeToggle } from "src/components/layout/theme-toggle";
import { CompanySelectorModal } from "src/components/layout/company-selector-modal";
import { Bell } from "lucide-react";
import { Button } from "src/components/ui/button";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <CompanySelectorModal />
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex w-full flex-col min-w-0">
          <header className="flex h-14 items-center justify-between border-b px-4 lg:h-[60px]">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="rounded-full">
                <Bell className="h-4 w-4" />
              </Button>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted/40 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
