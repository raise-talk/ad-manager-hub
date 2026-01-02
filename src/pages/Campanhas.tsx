import { useState } from 'react';
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
import { mockCampaigns, mockClients, mockAdAccounts, getClientById } from '@/data/mockData';
import type { Campaign, CampaignStatus } from '@/types';

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
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const filteredCampaigns = mockCampaigns.filter((campaign) => {
    const matchesSearch = campaign.nome.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClient = clientFilter === 'all' || campaign.clientId === clientFilter;
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesClient && matchesStatus;
  });

  const totalGasto = filteredCampaigns.reduce((acc, c) => acc + c.gastoTotal, 0);
  const totalResultados = filteredCampaigns.reduce((acc, c) => acc + c.resultados, 0);
  const avgCPA = totalResultados > 0 ? totalGasto / totalResultados : 0;

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
            value={filteredCampaigns.filter(c => c.status === 'ativo').length}
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
                  {mockClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nome}
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
                {filteredCampaigns.map((campaign) => {
                  const client = getClientById(campaign.clientId);
                  return (
                    <TableRow
                      key={campaign.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedCampaign(campaign)}
                    >
                      <TableCell className="font-medium">{campaign.nome}</TableCell>
                      <TableCell>{client?.nome}</TableCell>
                      <TableCell>
                        <ObjectiveBadge objective={campaign.objetivo} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={campaign.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(campaign.orcamentoDiario)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(campaign.gastoTotal)}
                      </TableCell>
                      <TableCell className="text-right">{campaign.resultados}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(campaign.cpa)}
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
                    <SheetTitle>{selectedCampaign.nome}</SheetTitle>
                    <StatusBadge status={selectedCampaign.status} />
                  </div>
                  <SheetDescription>
                    {getClientById(selectedCampaign.clientId)?.nome}
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
                          {formatCurrency(selectedCampaign.gastoTotal)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Resultados</p>
                        <p className="text-xl font-bold">{selectedCampaign.resultados}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">CPA</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(selectedCampaign.cpa)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Orç. Diário</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(selectedCampaign.orcamentoDiario)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Details */}
                  <Card>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Objetivo</span>
                        <ObjectiveBadge objective={selectedCampaign.objetivo} />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Última alteração</span>
                        <span className="text-sm">
                          {format(selectedCampaign.ultimaAlteracao, "dd/MM/yyyy 'às' HH:mm", {
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
