import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Filter,
  AlertTriangle,
  AlertCircle,
  Info,
  Eye,
  CheckCircle,
  Settings,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SeverityBadge, StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { mockAlerts } from '@/data/mockData';
import type { Alert, AlertStatus, AlertSeverity } from '@/types';

export default function Alertas() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('feed');

  const filteredAlerts = mockAlerts.filter((alert) => {
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || alert.severidade === severityFilter;
    return matchesStatus && matchesSeverity;
  });

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return AlertTriangle;
      case 'warning':
        return AlertCircle;
      default:
        return Info;
    }
  };

  const newAlertsCount = mockAlerts.filter(a => a.status === 'novo').length;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Alertas</h1>
              {newAlertsCount > 0 && (
                <Badge variant="destructive">{newAlertsCount} novos</Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Acompanhe alertas importantes sobre suas campanhas
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="feed">Feed de Alertas</TabsTrigger>
            <TabsTrigger value="config">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-6 mt-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="novo">Novos</SelectItem>
                      <SelectItem value="lido">Lidos</SelectItem>
                      <SelectItem value="resolvido">Resolvidos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Severidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="critical">Crítico</SelectItem>
                      <SelectItem value="warning">Atenção</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex-1" />
                  <Button variant="outline" size="sm">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Marcar todos como lidos
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Alerts List */}
            <div className="space-y-3">
              {filteredAlerts.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <EmptyState
                      icon={Bell}
                      title="Nenhum alerta encontrado"
                      description="Não há alertas com os filtros selecionados."
                    />
                  </CardContent>
                </Card>
              ) : (
                filteredAlerts.map((alert) => {
                  const SeverityIcon = getSeverityIcon(alert.severidade);
                  return (
                    <Card
                      key={alert.id}
                      className={`transition-all hover:shadow-md ${
                        alert.status === 'novo' ? 'border-l-4 border-l-primary' : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={`p-2 rounded-lg ${
                              alert.severidade === 'critical'
                                ? 'bg-destructive/10'
                                : alert.severidade === 'warning'
                                ? 'bg-warning/10'
                                : 'bg-info/10'
                            }`}
                          >
                            <SeverityIcon
                              className={`h-5 w-5 ${
                                alert.severidade === 'critical'
                                  ? 'text-destructive'
                                  : alert.severidade === 'warning'
                                  ? 'text-warning'
                                  : 'text-info'
                              }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{alert.clienteNome}</span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground">
                                {alert.contaNome}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {alert.mensagem}
                            </p>
                            <div className="flex items-center gap-3">
                              <SeverityBadge severity={alert.severidade} />
                              <StatusBadge status={alert.status} />
                              <span className="text-xs text-muted-foreground">
                                {format(alert.dataHora, "dd/MM 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/campanhas')}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver conta
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="config" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Limites de Orçamento</CardTitle>
                  <CardDescription>
                    Configure quando receber alertas sobre orçamento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Alerta de orçamento baixo (%)</Label>
                    <Input type="number" defaultValue={80} min={50} max={95} />
                    <p className="text-xs text-muted-foreground">
                      Receba um alerta quando o gasto atingir este percentual do orçamento
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Alerta crítico (%)</Label>
                    <Input type="number" defaultValue={95} min={80} max={100} />
                    <p className="text-xs text-muted-foreground">
                      Alerta urgente quando próximo do limite total
                    </p>
                  </div>
                  <Button>Salvar Limites</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Canais de Notificação</CardTitle>
                  <CardDescription>
                    Escolha como deseja receber os alertas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificações in-app</Label>
                      <p className="text-xs text-muted-foreground">
                        Receba alertas dentro do sistema
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email</Label>
                      <p className="text-xs text-muted-foreground">
                        Receba alertas por email (em breve)
                      </p>
                    </div>
                    <Switch disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>WhatsApp</Label>
                      <p className="text-xs text-muted-foreground">
                        Receba alertas por WhatsApp (em breve)
                      </p>
                    </div>
                    <Switch disabled />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
