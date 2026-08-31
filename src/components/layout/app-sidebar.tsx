"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "src/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "src/components/ui/dropdown-menu";
import { User2, ChevronUp, Building } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "src/hooks/auth/use-auth";
import { useCompany } from "src/contexts/company-context";
import { Skeleton } from "src/components/ui/skeleton";
import { routes } from "src/lib/constants/sidebar-routes";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading: isAuthLoading } = useAuth();
  const { companies, activeCompany, activeCompanyId, setActiveCompanyId, loading: isCompanyLoading } = useCompany();
  const isIdentityLoading = isAuthLoading || isCompanyLoading;


  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <div className="flex h-12 items-center justify-center font-bold text-xl">
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {routes.map((route) => {
                const isActive = route.url === "/clients"
                  ? pathname === "/clients" || pathname === "/suppliers"
                  : pathname === route.url;
                return (
                  <SidebarMenuItem key={route.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      className={isActive ? "bg-transparent text-[#FF5C00] dark:bg-[#1A1A1D] dark:text-white font-medium rounded-lg [&_svg]:text-[#FF5C00] [&>span]:text-[#FF5C00] dark:[&>span]:text-white" : "text-muted-foreground hover:bg-muted/50"}
                      render={
                        <Link href={route.url} className="flex items-center gap-2">
                          <route.icon />
                          <span>{route.title}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton className="h-12 py-2">
                    <User2 className="h-5 w-5" />
                    <div className="flex flex-col items-start text-left leading-normal">
                      {isIdentityLoading ? (
                        <div className="flex w-[120px] flex-col gap-1">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-[10px] w-16" />
                        </div>
                      ) : (
                        <>
                          <span className="text-2xs font-medium truncate max-w-[120px]">
                            {user?.email || "Usuario"}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                            {activeCompany?.name || "Sin empresa"}
                          </span>
                        </>
                      )}
                    </div>
                    <ChevronUp className="ml-auto h-4 w-4" />
                  </SidebarMenuButton>
                }
              />
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                {companies.length > 1 && (
                  <>
                    <DropdownMenuLabel>Empresas</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {companies.map((company) => (
                      <DropdownMenuItem
                        key={company.id}
                        onClick={() => setActiveCompanyId(company.id)}
                        className={activeCompanyId === company.id ? "font-bold bg-accent" : ""}
                      >
                        <Building className="mr-2 h-4 w-4" />
                        <span className="truncate">{company.name}</span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleLogout}>
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
