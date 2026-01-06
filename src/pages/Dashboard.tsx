"use client";

import { useEffect, useMemo, useState } from "react";
import { DollarSign, Users, Target, TrendingUp, RefreshCcw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type ClientOption = { id: string; name: string };
type Highlight = {
  id: string;
  nome: string;
  cliente: string;
  status: string;
  gastoMensal: number;
  orcamento: number;
  ultimaAtualizacao: string;
};
type TimelinePoint = { date: string; value: number };
type DashboardResponse = {
  kpis: {
    gastoMes: number;
    leadsMes: number;
    cpl: number;
    taxaResposta: number;
    clientesAtivos: number;
  };
  timeline: TimelinePoint[];
  highlights: Highlight[];
};

export default function Dashboard() {
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [dateRange, setDateRange] = useState<"today" | "7d" | "30d" | "90d">("today");
  const [page, setPage] = useState<number>(1);

  const { data: clients = [], isLoading: loadingClients } = useQuery<ClientOption[]>({
    queryKey: ["clients"],
    queryFn: () => apiFetch<ClientOption[]>("/api/clients"),
  });

  const {
    data: dashboard,
    refetch,
    isFetching,
  } = useQuery<DashboardResponse>({
    queryKey: ["dashboard", selectedClient, dateRange],
    queryFn: () => {
      const to = new Date();
      if (dateRange === "today") {
        to.setHours(23, 59, 59, 999);
      } else {
        to.setHours(0, 0, 0, 0);
        to.setDate(to.getDate() - 1); // ontem
      }

      const from = new Date(to);
      if (dateRange === "today") {
        from.setHours(0, 0, 0, 0);
      } else {
        const days = dateRange === "7d" ? 7 : dateRange === "90d" ? 90 : 30;
        from.setDate(from.getDate() - days + 1);
      }

      const params = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
      });
      if (selectedClient !== "all") {
        params.set("clientId", selectedClient);
      }
      return apiFetch<DashboardResponse>(`/api/dashboard?${params.toString()}`);
    },
  });

  const { mutate: syncNow, isPending: isSyncing } = useMutation({
    mutationFn: () => apiFetch<{ created: number }>("/api/sync-now", { method: "POST" }),
    onSuccess: () => {
      refetch();
    },
  });

  const isRefreshing = isFetching || isSyncing;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const mapStatus = (status: string) => {
    const normalized = String(status).toLowerCase();
    if (normalized.includes("active") || normalized === "1") return "ativo";
    if (normalized.includes("paused") || normalized === "2") return "pausado";
    return "erro";
  };

  const topAccounts = useMemo(() => dashboard?.highlights ?? [], [dashboard]);
  const timeline = useMemo(() => dashboard?.timeline ?? [], [dashboard]);
  const kpis = dashboard?.kpis ?? {
    gastoMes: 0,
    leadsMes: 0,
    cpl: 0,
    taxaResposta: 0,
    clientesAtivos: 0,
  };

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(topAccounts.length / pageSize));
  const paginatedAccounts = useMemo(
    () => topAccounts.slice((page - 1) * pageSize, page * pageSize),
    [topAccounts, page]
  );

  useEffect(() => {
    // Reset or clamp page when filters change or data size shrinks
    setPage((current) => Math.min(Math.max(current, 1), totalPages));
  }, [topAccounts.length, totalPages]);

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
                {loadingClients ? (
                  <SelectItem value="loading" disabled>
                    Carregando...
                  </SelectItem>
                ) : (
                  clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Select
              value={dateRange}
              onValueChange={(v: "today" | "7d" | "30d" | "90d") => setDateRange(v)}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => syncNow()}
              disabled={isRefreshing}
            >
              <RefreshCcw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {isFetching ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <Skeleton key={idx} className="h-24 w-full rounded-xl" />
            ))
          ) : (
            <>
              <KPICard
                title="Gasto no Mês"
                value={formatCurrency(kpis.gastoMes)}
                icon={DollarSign}
              />
              <KPICard
                title="Leads (Mês)"
                value={kpis.leadsMes.toLocaleString("pt-BR")}
                icon={Target}
              />
              <KPICard
                title="CPL Médio"
                value={formatCurrency(kpis.cpl)}
                icon={TrendingUp}
              />
              <KPICard
                title="Taxa de Resposta"
                value={`${kpis.taxaResposta.toFixed(1)}%`}
                icon={TrendingUp}
              />
              <KPICard
                title="Clientes Ativos"
                value={kpis.clientesAtivos}
                icon={Users}
              />
            </>
          )}
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Gasto ao Longo do Tempo</CardTitle>
            <CardDescription>
              {dateRange === "today"
                ? "Hoje"
                : `Últimos ${dateRange === "7d" ? "7" : dateRange === "90d" ? "90" : "30"} dias`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isFetching ? (
              <Skeleton className="h-80 w-full rounded-xl" />
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeline}>
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
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [formatCurrency(value), "Gasto"]}
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
            )}
          </CardContent>
        </Card>

        {/* Top Accounts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Contas em Destaque</CardTitle>
            <CardDescription>Performance das principais contas de anúncio</CardDescription>
          </CardHeader>
          <CardContent>
            {isFetching ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : topAccounts.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Nenhuma conta encontrada.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Conta</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Gasto (Mês)</TableHead>
                      <TableHead className="text-right">Limite da Conta</TableHead>
                      <TableHead className="text-right">Última Atualização</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAccounts.map((account) => (
                      <TableRow key={account.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {account.cliente ?? "—"}
                        </TableCell>
                        <TableCell>{account.nome ?? "—"}</TableCell>
                        <TableCell>
                          <StatusBadge status={mapStatus(account.status)} />
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(account.gastoMensal)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(account.orcamento)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {account.ultimaAtualizacao
                            ? format(new Date(account.ultimaAtualizacao), "dd/MM 'às' HH:mm", {
                                locale: ptBR,
                              })
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
