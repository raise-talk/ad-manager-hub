import { useState } from 'react';
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
import { mockClients, mockReceitaMensal, mockFinancialGoals } from '@/data/mockData';

export default function Financeiro() {
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    metaClientes: '',
    metaReceita: '',
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const clientesAtivos = mockClients.filter(c => c.status === 'ativo');
  const mrr = clientesAtivos.reduce((acc, c) => acc + c.valorMensal, 0);
  const ticketMedio = clientesAtivos.length > 0 ? mrr / clientesAtivos.length : 0;
  
  const currentGoal = mockFinancialGoals[0];
  const progressClientes = currentGoal ? (currentGoal.clientesAtingidos / currentGoal.metaClientes) * 100 : 0;
  const progressReceita = currentGoal ? (currentGoal.receitaAtingida / currentGoal.metaReceita) * 100 : 0;

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
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
            value={formatCurrency(mrr)}
            icon={DollarSign}
            change={{ value: 8.5, trend: 'up' }}
          />
          <KPICard
            title="Clientes Ativos"
            value={clientesAtivos.length}
            icon={Users}
            subtitle={`de ${mockClients.length} cadastrados`}
          />
          <KPICard
            title="Ticket Médio"
            value={formatCurrency(ticketMedio)}
            icon={TrendingUp}
          />
          <KPICard
            title="Meta do Mês"
            value={`${Math.round(progressReceita)}%`}
            icon={Target}
            subtitle={currentGoal ? `${formatCurrency(currentGoal.receitaAtingida)} / ${formatCurrency(currentGoal.metaReceita)}` : 'Sem meta'}
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
                  <BarChart data={mockReceitaMensal}>
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
                <CardDescription>{currentGoal?.mes || 'Defina suas metas'}</CardDescription>
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
              {currentGoal ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Clientes</span>
                      <span className="font-medium">
                        {currentGoal.clientesAtingidos} / {currentGoal.metaClientes}
                      </span>
                    </div>
                    <Progress value={progressClientes} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {Math.round(progressClientes)}% da meta atingida
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Receita</span>
                      <span className="font-medium">
                        {formatCurrency(currentGoal.receitaAtingida)} /{' '}
                        {formatCurrency(currentGoal.metaReceita)}
                      </span>
                    </div>
                    <Progress value={progressReceita} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {Math.round(progressReceita)}% da meta atingida
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
                {mockClients
                  .filter((c) => c.status !== 'arquivado')
                  .map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.nome}</TableCell>
                      <TableCell>{formatCurrency(client.valorMensal)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            client.status === 'ativo'
                              ? 'bg-success/15 text-success border-success/30'
                              : 'bg-warning/15 text-warning border-warning/30'
                          }
                        >
                          {client.status === 'ativo' ? 'Em dia' : 'Pausado'}
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
