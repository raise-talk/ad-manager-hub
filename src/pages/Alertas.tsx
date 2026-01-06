"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Filter,
  AlertTriangle,
  AlertCircle,
  Info,
  Eye,
  CheckCircle,
  Settings,
  Loader2,
  Pause,
  Play,
  ExternalLink,
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
import type { Alert, AlertSeverity } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/sonner';

type AlertConfig = {
  budgetLowThreshold: number;
  enabled: boolean;
};

type AlertItem = Alert & {
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'NEW' | 'READ' | 'RESOLVED';
  adAccount?: { name?: string; id?: string };
  client?: { name?: string };
  campaign?: { id: string; name?: string; status?: string | null; adAccountId?: string | null };
  createdAt: string;
};

export default function Alertas() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('feed');
  const [threshold, setThreshold] = useState(0);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const { data: alertConfig, refetch: refetchConfig, isLoading: configLoading } = useQuery<AlertConfig>({
    queryKey: ['alerts', 'config'],
    queryFn: () => apiFetch<AlertConfig>('/api/alerts/config'),
  });

  useEffect(() => {
    if (alertConfig) {
      setThreshold(alertConfig.budgetLowThreshold / 100);
      setAlertsEnabled(alertConfig.enabled);
    }
  }, [alertConfig]);

  const { data: alerts = [], refetch, isLoading } = useQuery<AlertItem[]>({
    queryKey: ['alerts', statusFilter, severityFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        const mapped = statusFilter === 'novo' ? 'NEW' : statusFilter === 'lido' ? 'READ' : 'RESOLVED';
        params.set('status', mapped);
      }
      return apiFetch<AlertItem[]>(`/api/alerts?${params.toString()}`);
    },
  });

  const mapSeverity = (severity: 'LOW' | 'MEDIUM' | 'HIGH'): AlertSeverity => {
    if (severity === 'HIGH') return 'critical';
    if (severity === 'MEDIUM') return 'warning';
    return 'info';
  };

  const mapStatus = (status: 'NEW' | 'READ' | 'RESOLVED') => {
    if (status === 'NEW') return 'novo';
    if (status === 'READ') return 'lido';
    return 'resolvido';
  };

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSeverity =
      severityFilter === 'all' || mapSeverity(alert.severity) === severityFilter;
    return matchesSeverity;
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

  const newAlertsCount = alerts.filter((alert) => alert.status === 'NEW').length;

  const handleMarkAllRead = async () => {
    const unread = alerts.filter((alert) => alert.status === 'NEW');
    await Promise.all(
      unread.map((alert) =>
        apiFetch(`/api/alerts/${alert.id}/read`, { method: 'POST' }),
      ),
    );
    await refetch();
  };

  const handleToggleCampaignStatus = async (alert: AlertItem) => {
    if (!alert.campaign?.id) return;
    try {
      setActioningId(alert.id);
      const current = String(alert.campaign.status ?? '').toUpperCase();
      const next = current.includes('PAUSED') ? 'ACTIVE' : 'PAUSED';
      await apiFetch(`/api/campaigns/${alert.campaign.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      });
      toast.success(next === 'ACTIVE' ? 'Campanha reativada' : 'Campanha pausada');
      await refetch();
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível atualizar a campanha');
    } finally {
      setActioningId(null);
    }
  };

  const handleOpenMeta = (alert: AlertItem) => {
    if (!alert.campaign?.id) return;
    const ad = alert.campaign.adAccountId ?? alert.adAccount?.id ?? '';
    const actId = ad ? (ad.startsWith('act_') ? ad : `act_${ad}`) : '';
    const url = actId
      ? `https://www.facebook.com/adsmanager/manage/campaigns?act=${actId}&selected_campaign_ids=${alert.campaign.id}`
      : `https://www.facebook.com/adsmanager/manage/campaigns`;
    window.open(url, '_blank');
  };

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
                  <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Marcar todos como lidos
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Alerts List */}
            <div className="space-y-3">
              {isLoading &&
                Array.from({ length: 3 }).map((_, idx) => (
                  <Card key={`alert-skel-${idx}`}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start gap-4">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-3/4" />
                          <div className="flex gap-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                        </div>
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {!isLoading && filteredAlerts.length === 0 && (
                <Card>
                  <CardContent className="py-12">
                    <EmptyState
                      icon={Bell}
                      title="Nenhum alerta encontrado"
                      description="Não há alertas com os filtros selecionados."
                    />
                  </CardContent>
                </Card>
              )}

              {!isLoading &&
                filteredAlerts.map((alert) => {
                  const severity = mapSeverity(alert.severity);
                  const status = mapStatus(alert.status);
                  const SeverityIcon = getSeverityIcon(severity);
                  return (
                    <Card
                      key={alert.id}
                      className={`transition-all hover:shadow-md ${
                        status === 'novo' ? 'border-l-4 border-l-primary' : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={`p-2 rounded-lg ${
                              severity === 'critical'
                                ? 'bg-destructive/10'
                                : severity === 'warning'
                                ? 'bg-warning/10'
                                : 'bg-info/10'
                            }`}
                          >
                            <SeverityIcon
                              className={`h-5 w-5 ${
                                severity === 'critical'
                                  ? 'text-destructive'
                                  : severity === 'warning'
                                  ? 'text-warning'
                                  : 'text-info'
                              }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{alert.client?.name ?? 'Conta'}</span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground">
                                {alert.adAccount?.name ?? 'Meta'}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {alert.message}
                            </p>
                            <div className="flex items-center gap-3">
                              <SeverityBadge severity={severity} />
                              <StatusBadge status={status} />
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(alert.createdAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {alert.campaign?.id && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenMeta(alert)}
                                >
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  Ver na Meta
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={actioningId === alert.id}
                                  onClick={() => handleToggleCampaignStatus(alert)}
                                >
                                  {actioningId === alert.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : mapStatus(alert.campaign?.status) === 'pausado' ? (
                                    <Play className="mr-2 h-4 w-4" />
                                  ) : (
                                    <Pause className="mr-2 h-4 w-4" />
                                  )}
                                  {mapStatus(alert.campaign?.status) === 'pausado'
                                    ? 'Reativar'
                                    : 'Pausar'}
                                </Button>
                              </>
                            )}
                            {alert.status === 'NEW' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  await apiFetch(`/api/alerts/${alert.id}/read`, { method: 'POST' });
                                  await refetch();
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Marcar lido
                              </Button>
                            )}
                            {alert.status !== 'RESOLVED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  await apiFetch(`/api/alerts/${alert.id}/resolve`, { method: 'POST' });
                                  await refetch();
                                }}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Resolver
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push('/campanhas')}
                            >
                              Ver conta
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
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
                  {configLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Limite de orçamento baixo (R$)</Label>
                      <Input
                        type="number"
                        value={threshold}
                        min={0}
                        onChange={(event) => setThreshold(Number(event.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Alertas são gerados quando o orçamento diário estiver abaixo deste valor.
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Alertas ativos</Label>
                      <p className="text-xs text-muted-foreground">
                        Ative ou desative o monitoramento automático.
                      </p>
                    </div>
                    <Switch checked={alertsEnabled} onCheckedChange={setAlertsEnabled} />
                  </div>
                  <Button
                    onClick={async () => {
                      await apiFetch('/api/alerts/config', {
                        method: 'POST',
                        body: JSON.stringify({
                          budgetLowThreshold: Math.round(threshold * 100),
                          enabled: alertsEnabled,
                        }),
                      });
                      await refetchConfig();
                    }}
                  >
                    Salvar configurações
                  </Button>
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
