"use client";

import { useMemo, useState } from 'react';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Pause,
  Play,
  TrendingUp,
  TrendingDown,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { StatusBadge, ObjectiveBadge } from '@/components/shared/StatusBadge';
import { KPICard } from '@/components/dashboard/KPICard';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

const miniChartData = [
  { day: '1', value: 120 },
  { day: '2', value: 180 },
  { day: '3', value: 150 },
  { day: '4', value: 210 },
  { day: '5', value: 190 },
  { day: '6', value: 240 },
  { day: '7', value: 220 },
];

export default function Campanhas() {
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => apiFetch<any[]>('/api/clients'),
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns', clientFilter, statusFilter, searchQuery],
    queryFn: () => {
      const params = new URLSearchParams();
      if (clientFilter !== 'all') params.set('clientId', clientFilter);
      if (statusFilter !== 'all') {
        const mapped =
          statusFilter === 'ativo'
            ? 'ACTIVE'
            : statusFilter === 'pausado'
            ? 'PAUSED'
            : statusFilter === 'em_revisao'
            ? 'IN_REVIEW'
            : 'ARCHIVED';
        params.set('status', mapped);
      }
      if (searchQuery) params.set('search', searchQuery);
      return apiFetch<any[]>(`/api/campaigns?${params.toString()}`);
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) =>
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [campaigns, searchQuery]);

  const totalGasto = filteredCampaigns.reduce(
    (acc: number, c: any) => acc + Number(c.dailyBudget ?? 0),
    0,
  );
  const totalResultados = filteredCampaigns.reduce((acc: number, c: any) => acc + Number(c.leads ?? 0), 0);
  const avgCPA = totalResultados > 0 ? totalGasto / totalResultados : 0;

  const mapObjective = (objective?: string) => {
    if (!objective) return 'leads';
    const normalized = objective.toLowerCase();
    if (normalized.includes('conversion')) return 'conversoes';
    if (normalized.includes('traffic')) return 'trafego';
    if (normalized.includes('reach')) return 'alcance';
    if (normalized.includes('engagement')) return 'engajamento';
    return 'leads';
  };

  const mapStatus = (status?: string) => {
    if (!status) return 'ativo';
    const normalized = status.toLowerCase();
    if (normalized.includes('paused')) return 'pausado';
    if (normalized.includes('review')) return 'em_revisao';
    if (normalized.includes('archived') || normalized.includes('completed')) return 'encerrado';
    return 'ativo';
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Campanhas</h1>
            <p className="text-muted-foreground">
              Acompanhe a performance das suas campanhas
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <KPICard
            title="Campanhas Ativas"
            value={filteredCampaigns.filter((c: any) => mapStatus(c.status) === 'ativo').length}
            icon={Play}
          />
          <KPICard
            title="Gasto Total"
            value={formatCurrency(totalGasto)}
            icon={TrendingUp}
          />
          <KPICard
            title="Total Resultados"
            value={totalResultados}
            icon={TrendingUp}
          />
          <KPICard
            title="CPA Médio"
            value={formatCurrency(avgCPA)}
            icon={TrendingDown}
          />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar campanhas..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todos os clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {clients.map((client: any) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="pausado">Pausados</SelectItem>
                  <SelectItem value="em_revisao">Em Revisão</SelectItem>
                  <SelectItem value="encerrado">Encerrados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Objetivo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Orç. Diário</TableHead>
                  <TableHead className="text-right">Gasto Total</TableHead>
                  <TableHead className="text-right">Resultados</TableHead>
                  <TableHead className="text-right">CPA</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign: any) => {
                  const client = clients.find((item: any) => item.id === campaign.clientId);
                  return (
                    <TableRow
                      key={campaign.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedCampaign(campaign)}
                    >
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>{client?.name}</TableCell>
                      <TableCell>
                        <ObjectiveBadge objective={mapObjective(campaign.objective)} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={mapStatus(campaign.status)} />
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(campaign.dailyBudget ?? 0) / 100)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(campaign.lifetimeBudget ?? 0) / 100)}
                      </TableCell>
                      <TableCell className="text-right">{campaign.leads ?? 0}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(campaign.dailyBudget ?? 0) / 100)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedCampaign(campaign)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Pause className="mr-2 h-4 w-4" />
                              Pausar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Campaign Details Sheet */}
        <Sheet open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            {selectedCampaign && (
              <>
                <SheetHeader>
                  <div className="flex items-center justify-between">
                    <SheetTitle>{selectedCampaign.name}</SheetTitle>
                    <StatusBadge status={mapStatus(selectedCampaign.status)} />
                  </div>
                  <SheetDescription>
                    {clients.find((item: any) => item.id === selectedCampaign.clientId)?.name}
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                  {/* Mini Chart */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Performance (7 dias)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={miniChartData}>
                            <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="hsl(var(--primary))"
                              strokeWidth={2}
                              fillOpacity={1}
                              fill="url(#colorValue)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Gasto Total</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(Number(selectedCampaign.lifetimeBudget ?? 0) / 100)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Resultados</p>
                        <p className="text-xl font-bold">{selectedCampaign.leads ?? 0}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">CPA</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(Number(selectedCampaign.dailyBudget ?? 0) / 100)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Orç. Diário</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(Number(selectedCampaign.dailyBudget ?? 0) / 100)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Details */}
                  <Card>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Objetivo</span>
                        <ObjectiveBadge objective={mapObjective(selectedCampaign.objective)} />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Última alteração</span>
                        <span className="text-sm">
                          {format(new Date(selectedCampaign.updatedAt), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-2">
                    <Button className="flex-1">
                      <Eye className="mr-2 h-4 w-4" />
                      Ver no Meta
                    </Button>
                    <Button variant="outline">
                      <Pause className="mr-2 h-4 w-4" />
                      Pausar
                    </Button>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}
