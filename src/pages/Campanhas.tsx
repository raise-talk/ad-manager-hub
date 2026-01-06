"use client";

import { KPICard } from "@/components/dashboard/KPICard";
import { AppLayout } from "@/components/layout/AppLayout";
import { ObjectiveBadge, StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Eye,
  Filter,
  MoreHorizontal,
  Pause,
  Play,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TimelinePoint = { date: string; spendCents: number; results: number };

type Campaign = {
  id: string;
  name: string;
  adAccountId: string;
  clientId: string | null;
  objective?: string | null;
  status?: string | null;
  dailyBudget?: number | null;
  spendCents?: number;
  leads?: number;
  timeline?: TimelinePoint[];
  updatedAt: string;
};

type Client = {
  id: string;
  name: string;
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const mapObjective = (objective?: string | null) => {
  if (!objective) return "leads";
  const normalized = objective.toLowerCase();
  if (normalized.includes("conversion")) return "conversoes";
  if (normalized.includes("traffic")) return "trafego";
  if (normalized.includes("reach")) return "alcance";
  if (normalized.includes("engagement")) return "engajamento";
  return "leads";
};

const mapStatus = (status?: string | null) => {
  if (!status) return "ativo";
  const normalized = status.toLowerCase();
  if (normalized.includes("paused")) return "pausado";
  if (normalized.includes("review")) return "em_revisao";
  if (normalized.includes("archived") || normalized.includes("completed"))
    return "encerrado";
  return "ativo";
};

export default function Campanhas() {
  const [searchQuery, setSearchQuery] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [rangeFilter, setRangeFilter] = useState<string>("today");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );

  const clientsQuery = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: () => apiFetch<Client[]>("/api/clients"),
  });

  const campaignsQuery = useQuery<Campaign[]>({
    queryKey: [
      "campaigns",
      clientFilter,
      statusFilter,
      searchQuery,
      rangeFilter,
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      if (clientFilter !== "all") params.set("clientId", clientFilter);
      if (statusFilter !== "all") {
        const mapped =
          statusFilter === "ativo"
            ? "ACTIVE"
            : statusFilter === "pausado"
            ? "PAUSED"
            : statusFilter === "em_revisao"
            ? "IN_REVIEW"
            : "ARCHIVED";
        params.set("status", mapped);
      }
      if (searchQuery) params.set("search", searchQuery);
      if (rangeFilter) params.set("range", rangeFilter);
      return apiFetch<Campaign[]>(`/api/campaigns?${params.toString()}`);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "PAUSED" }) =>
      apiFetch(`/api/campaigns/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      toast.success("Status atualizado");
      campaignsQuery.refetch();
    },
    onError: () => toast.error("Não foi possível atualizar o status"),
  });

  const clients = clientsQuery.data ?? [];
  const campaigns = useMemo(
    () => campaignsQuery.data ?? [],
    [campaignsQuery.data]
  );

  const filteredCampaigns = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    return campaigns
      .filter((campaign) => campaign.name.toLowerCase().includes(searchLower))
      .filter((campaign) =>
        clientFilter === "all" ? true : campaign.clientId === clientFilter
      )
      .filter((campaign) => {
        if (statusFilter === "all") return true;
        return mapStatus(campaign.status) === statusFilter;
      });
  }, [campaigns, clientFilter, searchQuery, statusFilter]);

  const totalGasto = filteredCampaigns.reduce(
    (acc, campaign) => acc + Number(campaign.spendCents ?? 0),
    0
  );
  const totalResultados = filteredCampaigns.reduce(
    (acc, campaign) => acc + Number(campaign.leads ?? 0),
    0
  );
  const avgCPA = totalResultados > 0 ? totalGasto / 100 / totalResultados : 0;

  const handlePauseToggle = (campaign: Campaign) => {
    const nextStatus =
      mapStatus(campaign.status) === "pausado" ? "ACTIVE" : "PAUSED";
    statusMutation.mutate({ id: campaign.id, status: nextStatus });
  };

  const getAdAccountActId = (campaign: Campaign) => {
    const raw = (campaign.adAccountId ?? "") as string;
    console.log("RAW", raw);
    const withoutPrefix = raw.replace("act_", "");

    return withoutPrefix;
  };

  const renderSkeletonRows = (rows: number) =>
    Array.from({ length: rows }).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell>
          <Skeleton className="h-4 w-40" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-28" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-20" />
        </TableCell>
        <TableCell className="text-right">
          <Skeleton className="h-4 w-16 ml-auto" />
        </TableCell>
        <TableCell className="text-right">
          <Skeleton className="h-4 w-16 ml-auto" />
        </TableCell>
        <TableCell className="text-right">
          <Skeleton className="h-4 w-12 ml-auto" />
        </TableCell>
        <TableCell className="text-right">
          <Skeleton className="h-4 w-12 ml-auto" />
        </TableCell>
        <TableCell className="w-12">
          <Skeleton className="h-8 w-8 ml-auto" />
        </TableCell>
      </TableRow>
    ));

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Campanhas</h1>
            <p className="text-muted-foreground">
              Acompanhe a performance das suas campanhas
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <KPICard
            title="Campanhas Ativas"
            value={
              filteredCampaigns.filter(
                (campaign) => mapStatus(campaign.status) === "ativo"
              ).length
            }
            icon={Play}
            loading={campaignsQuery.isLoading}
          />
          <KPICard
            title="Gasto Total"
            value={currency.format(totalGasto / 100)}
            icon={TrendingUp}
            loading={campaignsQuery.isLoading}
          />
          <KPICard
            title="Total Resultados"
            value={totalResultados}
            icon={TrendingUp}
            loading={campaignsQuery.isLoading}
          />
          <KPICard
            title="CPA Médio"
            value={currency.format(avgCPA)}
            icon={TrendingDown}
            loading={campaignsQuery.isLoading}
          />
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar campanhas..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todos os clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {clients.map((client) => (
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
                  <SelectItem value="em_revisao">Em revisão</SelectItem>
                  <SelectItem value="encerrado">Encerrados</SelectItem>
                </SelectContent>
              </Select>
              <Select value={rangeFilter} onValueChange={setRangeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="yesterday">Ontem</SelectItem>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Objetivo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Orç. diário</TableHead>
                  <TableHead className="text-right">Gasto total</TableHead>
                  <TableHead className="text-right">Resultados</TableHead>
                  <TableHead className="text-right">CPA</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignsQuery.isLoading && renderSkeletonRows(4)}

                {!campaignsQuery.isLoading &&
                  filteredCampaigns.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="py-10 text-center text-muted-foreground"
                      >
                        Nenhuma campanha encontrada para os filtros
                        selecionados.
                      </TableCell>
                    </TableRow>
                  )}

                {!campaignsQuery.isLoading &&
                  filteredCampaigns.map((campaign) => {
                    const client = clients.find(
                      (item) => item.id === campaign.clientId
                    );
                    const campaignCPA =
                      campaign.leads && campaign.leads > 0
                        ? Number(campaign.spendCents ?? 0) /
                          100 /
                          campaign.leads
                        : 0;
                    return (
                      <TableRow
                        key={campaign.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedCampaign(campaign)}
                      >
                        <TableCell className="font-medium">
                          {campaign.name}
                        </TableCell>
                        <TableCell>{client?.name ?? "Sem cliente"}</TableCell>
                        <TableCell>
                          <ObjectiveBadge
                            objective={mapObjective(campaign.objective)}
                          />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={mapStatus(campaign.status)} />
                        </TableCell>
                        <TableCell className="text-right">
                          {currency.format(
                            Number(campaign.dailyBudget ?? 0) / 100
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {currency.format(
                            Number(campaign.spendCents ?? 0) / 100
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {campaign.leads ?? 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {currency.format(campaignCPA)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              onClick={(event) => event.stopPropagation()}
                            >
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setSelectedCampaign(campaign)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handlePauseToggle(campaign)}
                              >
                                {mapStatus(campaign.status) === "pausado" ? (
                                  <>
                                    <Play className="mr-2 h-4 w-4" />
                                    Reativar
                                  </>
                                ) : (
                                  <>
                                    <Pause className="mr-2 h-4 w-4" />
                                    Pausar
                                  </>
                                )}
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

        <Sheet
          open={!!selectedCampaign}
          onOpenChange={() => setSelectedCampaign(null)}
        >
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            {selectedCampaign && (
              <>
                <SheetHeader>
                  <div className="flex items-center justify-between">
                    <SheetTitle>{selectedCampaign.name}</SheetTitle>
                    <StatusBadge status={mapStatus(selectedCampaign.status)} />
                  </div>
                  <SheetDescription>
                    {clients.find(
                      (item) => item.id === selectedCampaign.clientId
                    )?.name ?? "Sem cliente"}
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        Performance diária
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-32">
                        {selectedCampaign.timeline &&
                        selectedCampaign.timeline.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={selectedCampaign.timeline}>
                              <defs>
                                <linearGradient
                                  id="colorValue"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor="hsl(var(--primary))"
                                    stopOpacity={0.3}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor="hsl(var(--primary))"
                                    stopOpacity={0}
                                  />
                                </linearGradient>
                              </defs>
                              <XAxis
                                dataKey="date"
                                tickFormatter={(value) => value.slice(5)}
                              />
                              <YAxis
                                tickFormatter={(value) =>
                                  currency.format(value / 100)
                                }
                              />
                              <CartesianGrid strokeDasharray="3 3" />
                              <Tooltip
                                formatter={(value: number, name: string) =>
                                  name === "results"
                                    ? [`${value} resultados`, "Resultados"]
                                    : [currency.format(value / 100), "Gasto"]
                                }
                              />
                              <Area
                                type="monotone"
                                dataKey="spendCents"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                                name="Gasto"
                              />
                              <Area
                                type="monotone"
                                dataKey="results"
                                stroke="hsl(var(--muted-foreground))"
                                strokeWidth={1}
                                fillOpacity={0.05}
                                name="Resultados"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            Sem dados para o período selecionado.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">
                          Gasto Total
                        </p>
                        <p className="text-xl font-bold">
                          {currency.format(
                            Number(selectedCampaign.spendCents ?? 0) / 100
                          )}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">
                          Resultados
                        </p>
                        <p className="text-xl font-bold">
                          {selectedCampaign.leads ?? 0}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">CPA</p>
                        <p className="text-xl font-bold">
                          {currency.format(
                            selectedCampaign.leads && selectedCampaign.leads > 0
                              ? Number(selectedCampaign.spendCents ?? 0) /
                                  100 /
                                  selectedCampaign.leads
                              : 0
                          )}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">
                          Orç. diário
                        </p>
                        <p className="text-xl font-bold">
                          {currency.format(
                            Number(selectedCampaign.dailyBudget ?? 0) / 100
                          )}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Objetivo
                        </span>
                        <ObjectiveBadge
                          objective={mapObjective(selectedCampaign.objective)}
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Última alteração
                        </span>
                        <span className="text-sm">
                          {format(
                            new Date(selectedCampaign.updatedAt),
                            "dd/MM/yyyy 'às' HH:mm",
                            {
                              locale: ptBR,
                            }
                          )}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        const actId = getAdAccountActId(selectedCampaign);
                        window.open(
                          `https://www.facebook.com/adsmanager/manage/campaigns?act=${actId}&selected_campaign_ids=${selectedCampaign.id}`,
                          "_blank"
                        );
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver na Meta
                    </Button>
                    <Button
                      variant="outline"
                      disabled={statusMutation.isLoading}
                      onClick={() => handlePauseToggle(selectedCampaign)}
                    >
                      {mapStatus(selectedCampaign.status) === "pausado" ? (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Reativar
                        </>
                      ) : (
                        <>
                          <Pause className="mr-2 h-4 w-4" />
                          {statusMutation.isLoading ? "Pausando..." : "Pausar"}
                        </>
                      )}
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
