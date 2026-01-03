"use client";

import { useMemo, useState } from 'react';
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

export default function Financeiro() {
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    metaClientes: '',
    metaReceita: '',
  });

  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();

  const { data: finance } = useQuery({
    queryKey: ['finance', month, year],
    queryFn: () => apiFetch<any>(`/api/finance/summary?month=${month}&year=${year}`),
  });

  const { data: goal, refetch } = useQuery({
    queryKey: ['goals', month, year],
    queryFn: () => apiFetch<any>(`/api/goals?month=${month}&year=${year}`),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => apiFetch<any[]>('/api/clients'),
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
    return Array.from({ length: 6 }).map((_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      return {
        date: date.toLocaleDateString('pt-BR', { month: 'short' }),
        value: mrr,
      };
    });
  }, [mrr]);

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
          />
          <KPICard
            title="Clientes Ativos"
            value={clientesAtivos}
            icon={Users}
            subtitle="total ativo"
          />
          <KPICard
            title="Ticket Médio"
            value={formatCurrency(ticketMedio / 100)}
            icon={TrendingUp}
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
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={receitaMensal}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
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
              {goal ? (
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
                {clients
                  .filter((client: any) => client.status !== 'ARCHIVED')
                  .map((client: any) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{formatCurrency(client.monthlyFee / 100)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            client.status === 'ACTIVE'
                              ? 'bg-success/15 text-success border-success/30'
                              : 'bg-warning/15 text-warning border-warning/30'
                          }
                        >
                          {client.status === 'ACTIVE' ? 'Em dia' : 'Pausado'}
                        </Badge>
                      </TableCell>
                      <TableCell>05/01/2025</TableCell>
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
