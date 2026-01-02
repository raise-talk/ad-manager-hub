import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Bell,
  Wallet,
  Plug,
  Settings,
  HelpCircle,
  ChevronLeft,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSidebar } from '@/components/layout/SidebarContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Campanhas', href: '/campanhas', icon: Megaphone },
  { name: 'Alertas', href: '/alertas', icon: Bell, badge: 2 },
  { name: 'Financeiro', href: '/financeiro', icon: Wallet },
  { name: 'Integrações', href: '/integracoes', icon: Plug },
];

const secondaryNavigation = [
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
  { name: 'Ajuda', href: '/ajuda', icon: HelpCircle },
];

export function AppSidebar() {
  const location = useLocation();
  const { collapsed, setCollapsed } = useSidebar();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-border bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="font-semibold text-sidebar-foreground">
                TrafegoAds
              </span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent',
              collapsed && 'hidden'
            )}
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <Badge
                        variant="destructive"
                        className="h-5 min-w-5 justify-center px-1.5 text-xs"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Secondary Navigation */}
        <div className="border-t border-sidebar-border px-2 py-4">
          {secondaryNavigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
