import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { Topbar } from './Topbar';
import { MobileSidebar } from './MobileSidebar';
import { SidebarProvider, useSidebar } from './SidebarContext';
import { cn } from '@/lib/utils';

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
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}
