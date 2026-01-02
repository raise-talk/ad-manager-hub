import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Menu,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useSidebar } from '@/components/layout/SidebarContext';
import { mockUser, mockAlerts } from '@/data/mockData';
import { cn } from '@/lib/utils';

export function Topbar() {
  const navigate = useNavigate();
  const { collapsed, setCollapsed, setMobileOpen } = useSidebar();
  const [searchQuery, setSearchQuery] = useState('');
  
  const unreadAlerts = mockAlerts.filter(a => a.status === 'novo').length;

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <header
      className={cn(
        'fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300',
        collapsed ? 'left-16' : 'left-64',
        'max-lg:left-0'
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
          className={cn('hidden lg:flex', !collapsed && 'hidden')}
          onClick={() => setCollapsed(false)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search */}
        <div className="relative hidden w-64 md:block lg:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes, campanhas..."
            className="h-9 pl-9 bg-muted/50 border-0 focus-visible:ring-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
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
            {mockAlerts.slice(0, 3).map((alert) => (
              <DropdownMenuItem
                key={alert.id}
                className="flex flex-col items-start gap-1 p-3"
                onClick={() => navigate('/alertas')}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-medium text-sm">{alert.clienteNome}</span>
                  <Badge
                    variant={
                      alert.severidade === 'critical'
                        ? 'destructive'
                        : alert.severidade === 'warning'
                        ? 'secondary'
                        : 'outline'
                    }
                    className="text-xs"
                  >
                    {alert.severidade}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {alert.mensagem}
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-primary"
              onClick={() => navigate('/alertas')}
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
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {mockUser.nome.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium md:inline-block">
                {mockUser.nome}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{mockUser.nome}</p>
                <p className="text-xs text-muted-foreground">{mockUser.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
              <User className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
