"use client";

import { useSidebar } from "@/components/layout/SidebarContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBranding } from "@/hooks/use-branding";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Bell, ChevronDown, LogOut, Menu, Settings } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AlertPreview = {
  id: string;
  severity?: "HIGH" | "MEDIUM" | "LOW" | string;
  message?: string;
  client?: { name?: string };
};

export function Topbar() {
  const router = useRouter();
  const { collapsed, setCollapsed, setMobileOpen } = useSidebar();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: session } = useSession();
  const { profilePhoto } = useBranding();
  const { data: alerts = [] } = useQuery<AlertPreview[]>({
    queryKey: ["alerts", "preview"],
    queryFn: () => apiFetch<AlertPreview[]>("/api/alerts?status=new"),
  });

  const unreadAlerts = alerts.length;

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <header
      className={cn(
        "fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300",
        collapsed ? "left-16" : "left-64",
        "max-lg:left-0"
      )}
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Desktop Collapse Button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn("hidden lg:flex", !collapsed && "hidden")}
          onClick={() => setCollapsed(false)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadAlerts > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1.5 text-xs"
                >
                  {unreadAlerts}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notificações
              <Badge variant="secondary">{unreadAlerts} novos</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {alerts.slice(0, 3).map((alert) => (
              <DropdownMenuItem
                key={alert.id}
                className="flex flex-col items-start gap-1 p-3"
                onClick={() => router.push("/alertas")}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-medium text-sm">
                    {alert.client?.name ?? "Conta"}
                  </span>
                  <Badge
                    variant={
                      alert.severity === "HIGH"
                        ? "destructive"
                        : alert.severity === "MEDIUM"
                        ? "secondary"
                        : "outline"
                    }
                    className="text-xs"
                  >
                    {alert.severity}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {alert.message}
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-primary"
              onClick={() => router.push("/alertas")}
            >
              Ver todos os alertas
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-2 pr-1">
              <Avatar className="h-7 w-7">
                {profilePhoto && (
                  <AvatarImage
                    src={profilePhoto}
                    alt={session?.user?.name ?? "Avatar"}
                  />
                )}
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {session?.user?.name?.charAt(0) ?? "A"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium md:inline-block">
                {session?.user?.name ?? "Admin"}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  {session?.user?.name ?? "Admin"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {session?.user?.email ?? ""}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/configuracoes")}>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
