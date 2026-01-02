import { useState } from 'react';
import { DollarSign, Users, Target, TrendingUp, RefreshCcw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { AppLayout } from '@/components/layout/AppLayout';
import { KPICard } from '@/components/dashboard/KPICard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  mockKPIs,
  mockGastoTimeline,
  mockClients,
  mockAdAccounts,
  getClientById,
} from '@/data/mockData';

export default function Dashboard() {
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [dateRange, setDateRange] = useState('30d');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const topAccounts = mockAdAccounts
    .filter(acc => selectedClient === 'all' || acc.clientId === selectedClient)
    .map(acc => ({
      ...acc,
      cliente: getClientById(acc.clientId),
    }));

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral das suas campanhas de tráfego pago
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
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
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <KPICard
            title="Gasto no Mês"
            value={formatCurrency(mockKPIs.gastoMes)}
            icon={DollarSign}
            change={{ value: 12.5, trend: 'up' }}
          />
          <KPICard
            title="Leads (Mês)"
            value={mockKPIs.leadsMes.toLocaleString('pt-BR')}
            icon={Target}
            change={{ value: 8.2, trend: 'up' }}
          />
          <KPICard
            title="CPL Médio"
            value={formatCurrency(mockKPIs.cpl)}
            icon={TrendingUp}
            change={{ value: -5.3, trend: 'down' }}
          />
          <KPICard
            title="ROAS"
            value={`${mockKPIs.roas.toFixed(1)}x`}
            icon={TrendingUp}
            change={{ value: 2.1, trend: 'up' }}
          />
          <KPICard
            title="Clientes Ativos"
            value={mockKPIs.clientesAtivos}
            icon={Users}
            subtitle="de 4 cadastrados"
          />
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Gasto ao Longo do Tempo</CardTitle>
            <CardDescription>Últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockGastoTimeline}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    tickFormatter={(v) => `R$${v}`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Gasto']}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Accounts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Contas em Destaque</CardTitle>
            <CardDescription>Performance das principais contas de anúncio</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Gasto (Mês)</TableHead>
                  <TableHead className="text-right">Orçamento</TableHead>
                  <TableHead className="text-right">Última Atualização</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topAccounts.map((account) => (
                  <TableRow key={account.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {account.cliente?.nome}
                    </TableCell>
                    <TableCell>{account.nome}</TableCell>
                    <TableCell>
                      <StatusBadge status={account.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(account.gastoMensal)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(account.orcamento)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {format(account.ultimaAtualizacao, "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
