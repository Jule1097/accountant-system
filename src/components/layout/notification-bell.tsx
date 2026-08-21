"use client";

import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "src/components/ui/dropdown-menu";
import { buttonVariants } from "src/components/ui/button";
import { useNotifications } from "src/hooks/use-notifications";
import { cn } from "src/lib/utils";

export function NotificationBell() {
  const { notifications, isLoading, handleOpenNotification } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        nativeButton
        render={
          <button
            type="button"
            className={cn("relative", buttonVariants({ variant: "outline", size: "icon" }))}
          >
            <Bell className="h-4 w-4" />
            {notifications.length > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF5C00] px-1 text-[10px] font-medium text-white">
                {notifications.length}
              </span>
            )}
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-[320px]">
        <div className="px-2 py-1.5 text-xs text-muted-foreground border-b">Notificaciones</div>
        {isLoading ? (
          <div className="px-2 py-3 text-xs text-muted-foreground">Cargando notificaciones...</div>
        ) : notifications.length === 0 ? (
          <div className="px-2 py-3 text-xs text-muted-foreground">No hay notificaciones pendientes.</div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              onClick={() => {
                void handleOpenNotification(notification);
              }}
              className="flex flex-col items-start gap-1 py-2"
            >
              <span className="text-xs font-medium text-foreground">{notification.title}</span>
              <span className="whitespace-normal text-[11px] text-muted-foreground">{notification.message}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
