import { SidebarProvider, SidebarTrigger } from "src/components/ui/sidebar";
import { AppSidebar } from "src/components/layout/app-sidebar";
import { ThemeToggle } from "src/components/layout/theme-toggle";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex w-full flex-col">
          <header className="flex h-14 items-center justify-between border-b px-4 lg:h-[60px]">
            <SidebarTrigger />
            <ThemeToggle />
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted/40">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
