"use client";

import { ReactNode, useEffect, useMemo } from 'react';
import { AppSidebar } from './AppSidebar';
import { Topbar } from './Topbar';
import { MobileSidebar } from './MobileSidebar';
import { SidebarProvider, useSidebar } from './SidebarContext';
import { cn } from '@/lib/utils';
import { useBranding } from '@/hooks/use-branding';
import { usePathname } from 'next/navigation';

function LayoutContent({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar />

      {/* Topbar */}
      <Topbar />

      {/* Main Content */}
      <main
        className={cn(
          'min-h-screen pt-16 transition-all duration-300',
          collapsed ? 'lg:pl-16' : 'lg:pl-64'
        )}
      >
        <div className="container py-6 max-w-7xl">{children}</div>
      </main>
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  function DynamicHead() {
    const { brandName, profilePhoto, brandLogo } = useBranding();
    const pathname = usePathname();

    const pageLabel = useMemo(() => {
      const current = pathname || "/";
      if (current.startsWith("/dashboard") || current === "/") return "Dashboard";
      if (current.startsWith("/clientes")) return "Clientes";
      if (current.startsWith("/campanhas")) return "Campanhas";
      if (current.startsWith("/alertas")) return "Alertas";
      if (current.startsWith("/financeiro")) return "Financeiro";
      if (current.startsWith("/calculadora")) return "Calculadora";
      if (current.startsWith("/integracoes")) return "Integrações";
      if (current.startsWith("/configuracoes")) return "Configurações";
      if (current.startsWith("/ajuda")) return "Ajuda";
      if (current.startsWith("/login")) return "Login";
      if (current.startsWith("/cadastro")) return "Cadastro";
      if (current.startsWith("/recuperar-senha")) return "Recuperar senha";
      if (current.startsWith("/resetar-senha")) return "Resetar senha";
      return "Painel";
    }, [pathname]);

    useEffect(() => {
      if (typeof document === "undefined") return;
      const brand = brandName || "Lead House";
      document.title = `${pageLabel} • ${brand}`;
    }, [brandName, pageLabel]);

    useEffect(() => {
      if (typeof document === "undefined") return;
      const faviconUrl = "/favicon-rt.svg";
      const linkId = "rt-dynamic-favicon";
      let link = document.getElementById(linkId) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.id = linkId;
        link.rel = "icon";
        document.head.appendChild(link);
      }
      if (link.href !== faviconUrl) {
        link.href = faviconUrl;
      }
    }, [brandLogo, profilePhoto]);

    return null;
  }

  return (
    <SidebarProvider>
      <DynamicHead />
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}
