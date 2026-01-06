"use client";

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DollarSign,
  Users,
  TrendingUp,
  Target,
  Plus,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/dashboard/KPICard';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

type FinanceSummary = {
  mrr: number;
  clientesAtivos: number;
  ticketMedio: number;
  progressClients: number;
  progressRevenue: number;
};

type Goal = {
  targetClients: number;
  targetRevenue: number;
};

type FinanceClient = {
  id: string;
  name: string;
  monthlyFee: number;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  dueDay?: number | null;
  lastPaymentAt?: string | null;
  paidThisMonth?: boolean;
};

export default function Financeiro() {
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    metaClientes: '',
    metaReceita: '',
  });

  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();

  const { data: finance, isLoading: financeLoading } = useQuery<FinanceSummary>({
    queryKey: ['finance', month, year],
    queryFn: () => apiFetch<FinanceSummary>(`/api/finance/summary?month=${month}&year=${year}`),
  });

  const { data: goal, refetch, isLoading: goalLoading } = useQuery<Goal>({
    queryKey: ['goals', month, year],
    queryFn: () => apiFetch<Goal>(`/api/goals?month=${month}&year=${year}`),
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery<FinanceClient[]>({
    queryKey: ['clients'],
    queryFn: () => apiFetch<FinanceClient[]>('/api/clients'),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const mrr = finance?.mrr ?? 0;
  const clientesAtivos = finance?.clientesAtivos ?? 0;
  const ticketMedio = finance?.ticketMedio ?? 0;
  const progressClientes = Math.round((finance?.progressClients ?? 0) * 100);
  const progressReceita = Math.round((finance?.progressRevenue ?? 0) * 100);

  const receitaMensal = useMemo(() => {
    const months = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      return {
        key: `${date.getFullYear()}-${date.getMonth() + 1}`,
        label: date.toLocaleDateString('pt-BR', { month: 'short' }),
        value: 0,
      };
    });
    // Distribui pagamentos por mês
    clients.forEach((client) => {
      if (client.lastPaymentAt) {
        const paidDate = new Date(client.lastPaymentAt);
        const key = `${paidDate.getFullYear()}-${paidDate.getMonth() + 1}`;
        const bucket = months.find((m) => m.key === key);
        if (bucket) {
          bucket.value += client.monthlyFee;
        }
      }
    });
    return months;
  }, [clients]);

  const computePaymentStatus = (client: FinanceClient) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const lastPaid = client.lastPaymentAt ? new Date(client.lastPaymentAt) : null;
    const paidThisMonth =
      client.paidThisMonth !== undefined
        ? client.paidThisMonth
        : !!(
            lastPaid &&
            lastPaid.getMonth() === currentMonth &&
            lastPaid.getFullYear() === currentYear
          );

    const dueDay = client.dueDay ?? null;
    if (!dueDay) {
      return { label: paidThisMonth ? 'Em dia' : 'Pendente', variant: paidThisMonth ? 'secondary' : 'outline', dueDate: null };
    }
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dueDate = new Date(currentYear, currentMonth, Math.min(dueDay, daysInMonth));
    if (paidThisMonth) {
      return { label: 'Em dia', variant: 'secondary' as const, dueDate };
    }
    if (today > dueDate) {
      return { label: 'Atrasado', variant: 'destructive' as const, dueDate };
    }
    return { label: 'Pendente', variant: 'outline' as const, dueDate };
  };

  const formatDueDate = (dueDay?: number | null) => {
    if (!dueDay) return 'N/A';
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const target = new Date(
      today.getFullYear(),
      today.getMonth(),
      Math.min(dueDay, daysInMonth)
    );
    if (today > target) {
      // next month
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const nextDays = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
      const nextTarget = new Date(
        nextMonth.getFullYear(),
        nextMonth.getMonth(),
        Math.min(dueDay, nextDays)
      );
      return format(nextTarget, 'dd/MM/yyyy', { locale: ptBR });
    }
    return format(target, 'dd/MM/yyyy', { locale: ptBR });
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/goals', {
      method: 'POST',
      body: JSON.stringify({
        month,
        year,
        targetClients: Number(newGoal.metaClientes),
        targetRevenue: Math.round(Number(newGoal.metaReceita) * 100),
      }),
    });
    await refetch();
    setIsGoalDialogOpen(false);
    setNewGoal({ metaClientes: '', metaReceita: '' });
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
            <p className="text-muted-foreground">
              Acompanhe a saúde financeira do seu negócio
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="MRR"
            value={formatCurrency(mrr / 100)}
            icon={DollarSign}
            change={{ value: 8.5, trend: 'up' }}
            loading={financeLoading}
          />
          <KPICard
            title="Clientes Ativos"
            value={clientesAtivos}
            icon={Users}
            subtitle="total ativo"
            loading={financeLoading}
          />
          <KPICard
            title="Ticket Médio"
            value={formatCurrency(ticketMedio / 100)}
            icon={TrendingUp}
            loading={financeLoading}
          />
          <KPICard
            title="Meta do Mês"
            value={`${progressReceita}%`}
            icon={Target}
            subtitle={
              goal
                ? `${formatCurrency(mrr / 100)} / ${formatCurrency(goal.targetRevenue / 100)}`
                : 'Sem meta'
            }
            loading={financeLoading || goalLoading}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Receita Mensal</CardTitle>
              <CardDescription>Últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {financeLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={receitaMensal}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [formatCurrency(value), 'Receita']}
                      />
                      <Bar
                        dataKey="value"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Goals */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Metas do Mês</CardTitle>
                <CardDescription>
                  {goal ? `${month}/${year}` : 'Defina suas metas'}
                </CardDescription>
              </div>
              <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Editar Metas
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Definir Metas do Mês</DialogTitle>
                    <DialogDescription>
                      Configure suas metas de clientes e receita
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSaveGoal} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Meta de Clientes</Label>
                      <Input
                        type="number"
                        placeholder="Ex: 5"
                        value={newGoal.metaClientes}
                        onChange={(e) =>
                          setNewGoal({ ...newGoal, metaClientes: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Meta de Receita (R$)</Label>
                      <Input
                        type="number"
                        placeholder="Ex: 15000"
                        value={newGoal.metaReceita}
                        onChange={(e) =>
                          setNewGoal({ ...newGoal, metaReceita: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsGoalDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit">Salvar Metas</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-6">
              {goalLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
              ) : goal ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Clientes</span>
                      <span className="font-medium">
                        {clientesAtivos} / {goal.targetClients}
                      </span>
                    </div>
                    <Progress value={progressClientes} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {progressClientes}% da meta atingida
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Receita</span>
                      <span className="font-medium">
                        {formatCurrency(mrr / 100)} / {formatCurrency(goal.targetRevenue / 100)}
                      </span>
                    </div>
                    <Progress value={progressReceita} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {progressReceita}% da meta atingida
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhuma meta definida</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Clients x Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Clientes x Mensalidades</CardTitle>
            <CardDescription>
              Status de pagamento dos seus clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Próximo Vencimento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientsLoading &&
                  Array.from({ length: 4 }).map((_, idx) => (
                    <TableRow key={`finance-skel-${idx}`}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>
                  ))}

                {!clientsLoading &&
                  clients
                    .filter((client) => client.status !== 'ARCHIVED')
                    .map((client) => {
                      const paymentStatus = computePaymentStatus(client);
                      const badgeClass =
                        paymentStatus.label === 'Em dia'
                          ? 'bg-success/15 text-success border-success/30'
                          : paymentStatus.label === 'Atrasado'
                            ? 'bg-destructive/15 text-destructive border-destructive/30'
                            : 'bg-warning/15 text-warning border-warning/30';
                      const nextDue =
                        paymentStatus.dueDate
                          ? format(paymentStatus.dueDate, 'dd/MM/yyyy', { locale: ptBR })
                          : formatDueDate(client.dueDay);

                      return (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">{client.name}</TableCell>
                          <TableCell>{formatCurrency(client.monthlyFee / 100)}</TableCell>
                          <TableCell>
                            <Badge variant={paymentStatus.variant} className={badgeClass}>
                              {paymentStatus.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{nextDue}</TableCell>
                        </TableRow>
                      );
                    })}

                {!clientsLoading && clients.filter((client) => client.status !== 'ARCHIVED').length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      Nenhum cliente ativo encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

