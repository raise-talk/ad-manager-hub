"use client";

import { KPICard } from "@/components/dashboard/KPICard";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { ObjectiveBadge, StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  Building2,
  DollarSign,
  ExternalLink,
  Globe,
  Instagram,
  Megaphone,
  Phone,
  Target,
  TrendingUp,
  User,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ClienteDetalhes() {
  const params = useParams();
  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params?.id[0]
      : "";
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedAdAccount, setSelectedAdAccount] = useState("");
  const [syncingCampaigns, setSyncingCampaigns] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [metricsRange, setMetricsRange] = useState<
    "today" | "7d" | "30d" | "90d"
  >("7d");
  const [campaignStatusFilter, setCampaignStatusFilter] = useState<
    "ACTIVE" | "PAUSED" | "ALL"
  >("ACTIVE");
  const [updatingCampaignId, setUpdatingCampaignId] = useState<string | null>(
    null
  );
  const [editForm, setEditForm] = useState({
    name: "",
    city: "",
    state: "",
    whatsapp: "",
    instagram: "",
    website: "",
    monthlyFee: "",
    dueDay: "",
    status: "ACTIVE",
  });
  const [savingClient, setSavingClient] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);

  const {
    data: client,
    isLoading,
    refetch: refetchClient,
  } = useQuery({
    queryKey: ["client", id],
    queryFn: () => apiFetch<any>(`/api/clients/${id}`),
    enabled: !!id,
  });

  const { data: campaigns = [], refetch: refetchCampaigns } = useQuery({
    queryKey: ["campaigns", id, metricsRange, campaignStatusFilter],
    queryFn: () =>
      apiFetch<any[]>(
        `/api/campaigns?clientId=${id}&${
          campaignStatusFilter !== "ALL"
            ? `status=${campaignStatusFilter}&`
            : ""
        }range=${metricsRange}&tz=America/Sao_Paulo`
      ),
    enabled: !!id,
  });

  const { data: allAccounts = [], refetch: refetchAccounts } = useQuery({
    queryKey: ["ad-accounts"],
    queryFn: () => apiFetch<any[]>("/api/ad-accounts"),
  });

  const { data: payments = [], refetch: refetchPayments } = useQuery({
    queryKey: ["payments", id],
    queryFn: () => apiFetch<any[]>(`/api/clients/${id}/payments`),
    enabled: !!id,
  });

  useEffect(() => {
    if (client?.notes) {
      setNotes(client.notes);
    }
    if (client) {
      setEditForm({
        name: client.name ?? "",
        city: client.city ?? "",
        state: client.state ?? "",
        whatsapp: client.whatsapp ?? "",
        instagram: client.instagram ?? "",
        website: client.website ?? "",
        monthlyFee: client.monthlyFee ? String(client.monthlyFee / 100) : "",
        dueDay: client.dueDay ? String(client.dueDay) : "",
        status: client.status ?? "ACTIVE",
      });
    }
  }, [client]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6 text-muted-foreground">Carregando cliente...</div>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout>
        <EmptyState
          icon={User}
          title="Cliente nao encontrado"
          description="O cliente que voce esta procurando nao existe ou foi removido."
          action={{
            label: "Voltar para clientes",
            onClick: () => router.push("/clientes"),
          }}
        />
      </AppLayout>
    );
  }

  const adAccounts =
    client.adAccounts?.map((item: any) => item.adAccount) ?? [];
  const linkedAccountIds = new Set(
    adAccounts.map((account: any) => account.id)
  );
  const availableAccounts = allAccounts.filter(
    (account: any) => !linkedAccountIds.has(account.id)
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const totalSpendCents = campaigns.reduce(
    (acc: number, c: any) => acc + Number(c.spendCents ?? 0),
    0
  );
  const totalLeads = campaigns.reduce(
    (acc: number, c: any) => acc + Number(c.leads ?? 0),
    0
  );
  const avgCPL = totalLeads > 0 ? totalSpendCents / 100 / totalLeads : 0;
  const spendByAdAccount = campaigns.reduce((map: Record<string, number>, c: any) => {
    const adId = c.adAccount?.id ?? "";
    if (!adId) return map;
    map[adId] = (map[adId] ?? 0) + Number(c.spendCents ?? 0);
    return map;
  }, {});

  const handleSaveNotes = async () => {
    if (!id) return;
    await apiFetch(`/api/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify({ notes }),
    });
  };

  const handleLinkAccount = async () => {
    if (!id || !selectedAdAccount) return;
    await apiFetch(`/api/clients/${id}/ad-accounts`, {
      method: "POST",
      body: JSON.stringify({
        adAccountIds: [selectedAdAccount],
        primaryAdAccountId: selectedAdAccount,
      }),
    });
    setLinkDialogOpen(false);
    setSelectedAdAccount("");
    await Promise.all([refetchAccounts(), refetchClient()]);
  };

  const handleSaveClient = async () => {
    if (!id) return;
    setSavingClient(true);
    try {
      await apiFetch(`/api/clients/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editForm.name,
          city: editForm.city,
          state: editForm.state,
          whatsapp: editForm.whatsapp || undefined,
          instagram: editForm.instagram || undefined,
          website: editForm.website || undefined,
          monthlyFee: Math.round(Number(editForm.monthlyFee || 0) * 100),
          dueDay: editForm.dueDay ? Number(editForm.dueDay) : undefined,
          status: editForm.status,
        }),
      });
      await refetchClient();
      toast.success("Dados do cliente atualizados");
    } catch (error) {
      console.error(error);
      toast.error("Nao foi possivel atualizar o cliente");
    } finally {
      setSavingClient(false);
    }
  };

  const mapObjective = (objective?: string) => {
    if (!objective) return "leads";
    const normalized = objective.toLowerCase();
    if (normalized.includes("conversion")) return "conversoes";
    if (normalized.includes("traffic")) return "trafego";
    if (normalized.includes("reach")) return "alcance";
    if (normalized.includes("engagement")) return "engajamento";
    return "leads";
  };

  const mapCampaignStatus = (status?: string) => {
    if (!status) return "ativo";
    const normalized = status.toLowerCase();
    if (normalized.includes("paused")) return "pausado";
    if (normalized.includes("review")) return "em_revisao";
    if (normalized.includes("archived") || normalized.includes("completed"))
      return "encerrado";
    return "ativo";
  };

  const activeCampaigns = campaigns.filter(
    (c: any) => mapCampaignStatus(c.status) === "ativo"
  );
  const listedCampaigns =
    campaignStatusFilter === "ALL"
      ? campaigns
      : campaigns.filter((c: any) =>
          campaignStatusFilter === "ACTIVE"
            ? mapCampaignStatus(c.status) === "ativo"
            : mapCampaignStatus(c.status) === "pausado"
        );

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const paidThisMonth = payments.find((p: any) => {
    const d = new Date(p.paidAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const paymentStatus = (() => {
    const dueDay = client.dueDay ?? null;
    if (!dueDay) return { label: "Sem vencimento", isPaid: !!paidThisMonth };
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dueDate = new Date(
      currentYear,
      currentMonth,
      Math.min(dueDay, daysInMonth)
    );
    if (paidThisMonth) {
      return {
        label: "Em dia",
        isPaid: true,
        dueDate,
        paymentDate: paidThisMonth.paidAt,
      };
    }
    if (today > dueDate) {
      return { label: "Atrasado", isPaid: false, dueDate };
    }
    return { label: "Pendente", isPaid: false, dueDate };
  })();

  const handlePaymentToggle = async (markPaid: boolean) => {
    if (!id) return;
    setUpdatingPayment(true);
    try {
      if (markPaid) {
        await apiFetch(`/api/clients/${id}/payments`, {
          method: "POST",
          body: JSON.stringify({
            amount: client.monthlyFee,
            paidAt: new Date().toISOString(),
          }),
        });
      } else {
        await apiFetch(`/api/clients/${id}/payments`, {
          method: "DELETE",
        });
      }
      await Promise.all([refetchClient(), refetchPayments()]);
    } catch (error) {
      console.error(error);
      toast.error("Nao foi possivel atualizar o status de pagamento");
    } finally {
      setUpdatingPayment(false);
    }
  };

  const handleSyncCampaigns = async () => {
    setSyncingCampaigns(true);
    try {
      await apiFetch("/api/meta/sync-campaigns", { method: "POST" });
      await refetchCampaigns();
      toast.success("Campanhas sincronizadas com a Meta");
    } catch (error: any) {
      console.error(error);
      const message =
        error?.message ?? "Nao foi possivel sincronizar as campanhas.";
      toast.error(message);
    } finally {
      setSyncingCampaigns(false);
    }
  };

  const handleToggleCampaignStatus = async (campaign: any) => {
    if (!campaign?.id) return;
    const next =
      mapCampaignStatus(campaign.status) === "ativo" ? "PAUSED" : "ACTIVE";
    try {
      setUpdatingCampaignId(campaign.id);
      await apiFetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      await refetchCampaigns();
      toast.success(
        next === "PAUSED" ? "Campanha pausada" : "Campanha reativada"
      );
    } catch (error: any) {
      console.error(error);
      const message =
        error?.message ?? "Nao foi possivel atualizar a campanha.";
      toast.error(message);
    } finally {
      setUpdatingCampaignId(null);
    }
  };

  const mapAccountStatus = (status?: string) => {
    if (!status) return "ativo";
    const normalized = status.toLowerCase();
    if (normalized.includes("paused") || normalized === "2") return "pausado";
    if (normalized.includes("active") || normalized === "1") return "ativo";
    return "erro";
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/clientes")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                {client.type === "REAL_ESTATE" ? (
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                ) : (
                  <User className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {client.name}
                  </h1>
                  <StatusBadge
                    status={
                      client.status === "ACTIVE"
                        ? "ativo"
                        : client.status === "PAUSED"
                        ? "pausado"
                        : "arquivado"
                    }
                  />
                </div>
                <p className="text-muted-foreground">
                  {client.type === "REAL_ESTATE" ? "Imobiliária" : "Corretor"} -{" "}
                  {client.city}/{client.state}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setActiveTab("edit")}>
              Editar
            </Button>
            <Button onClick={() => setActiveTab("campaigns")}>
              Ver Campanhas
            </Button>
          </div>
        </div>

        {/* Quick Info */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            {client.whatsapp}
          </div>
          {client.instagram && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Instagram className="h-4 w-4" />
              {client.instagram}
            </div>
          )}
          {client.website && (
            <a
              href={
                client.website.startsWith("http")
                  ? client.website
                  : `https://${client.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Globe className="h-4 w-4" />
              {client.website}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <div className="w-full overflow-x-auto">
            <TabsList className="inline-flex min-w-max gap-2 md:gap-3 px-2">
              <TabsTrigger className="whitespace-nowrap px-4 shrink-0" value="overview">Visao Geral</TabsTrigger>
              <TabsTrigger className="whitespace-nowrap px-4 shrink-0" value="accounts">Contas de Anuncios</TabsTrigger>
              <TabsTrigger className="whitespace-nowrap px-4 shrink-0" value="campaigns">Campanhas</TabsTrigger>
              <TabsTrigger className="whitespace-nowrap px-4 shrink-0" value="financial">Financeiro</TabsTrigger>
              <TabsTrigger className="whitespace-nowrap px-4 shrink-0" value="notes">Notas</TabsTrigger>
              <TabsTrigger className="whitespace-nowrap px-4 shrink-0" value="edit">Editar</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Periodo</span>
                <Select
                  value={metricsRange}
                  onValueChange={(v) => setMetricsRange(v as any)}
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
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KPICard
                title="Gasto no Periodo"
                value={formatCurrency(totalSpendCents / 100)}
                icon={DollarSign}
              />
              <KPICard title="Leads Gerados" value={totalLeads} icon={Target} />
              <KPICard
                title="CPL Medio"
                value={formatCurrency(avgCPL)}
                icon={TrendingUp}
              />
              <KPICard
                title="Campanhas Ativas"
                value={activeCampaigns.length}
                icon={Megaphone}
              />
            </div>

            {client.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Observacoes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {client.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="accounts">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>Contas de Anuncios</CardTitle>
                  <CardDescription>
                    Contas conectadas via Meta/Facebook
                  </CardDescription>
                </div>
                <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Vincular conta</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Vincular conta</DialogTitle>
                      <DialogDescription>
                        Selecione uma conta para associar a este cliente.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Select
                        value={selectedAdAccount}
                        onValueChange={setSelectedAdAccount}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a conta" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableAccounts.map((account: any) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleLinkAccount}
                        disabled={!selectedAdAccount}
                      >
                        Vincular
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {adAccounts.length === 0 ? (
                  <EmptyState
                    icon={Megaphone}
                    title="Nenhuma conta conectada"
                    description="Conecte uma conta de anuncios Meta para comecar a acompanhar as campanhas deste cliente."
                    action={{
                      label: "Conectar conta",
                      onClick: () => router.push("/integracoes"),
                    }}
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Conta</TableHead>
                        <TableHead>Plataforma</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">
                          Gasto (Mes)
                        </TableHead>
                        <TableHead className="text-right">Orcamento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adAccounts.map((account: any) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">
                            {account.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">Meta</Badge>
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              status={mapAccountStatus(account.status)}
                            />
                          </TableCell>
                      <TableCell className="text-right">
                            {formatCurrency(
                              Number(spendByAdAccount[account.id] ?? 0) / 100
                            )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(
                          Number(account.spendCap ?? 0) / 100
                        )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns">
              <Card>
               <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                 <div>
                   <CardTitle>Campanhas</CardTitle>
                   <CardDescription>Todas as campanhas deste cliente</CardDescription>
                 </div>
                 <div className="grid w-full gap-2 md:w-auto md:grid-flow-col md:auto-cols-max md:items-center md:justify-end">
                   <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
                     <span className="text-sm text-muted-foreground">Periodo</span>
                     <Select
                       value={metricsRange}
                       onValueChange={(v) =>
                         setMetricsRange(v as "today" | "7d" | "30d" | "90d")
                       }
                     >
                       <SelectTrigger className="w-full md:w-32">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="today">Hoje</SelectItem>
                         <SelectItem value="7d">Ultimos 7 dias</SelectItem>
                         <SelectItem value="30d">Ultimos 30 dias</SelectItem>
                         <SelectItem value="90d">Ultimos 90 dias</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
                     <span className="text-sm text-muted-foreground md:hidden">Status</span>
                     <Select
                       value={campaignStatusFilter}
                       onValueChange={(v) =>
                         setCampaignStatusFilter(
                           v as "ACTIVE" | "PAUSED" | "ALL"
                         )
                       }
                     >
                       <SelectTrigger className="w-full md:w-36">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="ACTIVE">Ativas</SelectItem>
                         <SelectItem value="PAUSED">Pausadas</SelectItem>
                         <SelectItem value="ALL">Todas</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   <Button
                     className="w-full md:w-auto"
                     variant="outline"
                     size="sm"
                     onClick={handleSyncCampaigns}
                     disabled={syncingCampaigns}
                   >
                     {syncingCampaigns
                       ? "Sincronizando..."
                       : "Sincronizar campanhas"}
                   </Button>
                 </div>
               </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campanha</TableHead>
                      <TableHead>Objetivo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Gasto</TableHead>
                      <TableHead className="text-right">Resultados</TableHead>
                      <TableHead className="text-right">CPA</TableHead>
                      <TableHead className="text-right">Acões</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listedCampaigns.map((campaign: any) => {
                      const actId = campaign.adAccount?.id
                        ? String(campaign.adAccount.id).replace(/^act_/, "")
                        : "";
                      const metaUrl = actId
                        ? `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${actId}&selected_campaign_ids=${campaign.id}`
                        : undefined;
                      const spend =
                        Number(
                          campaign.spendCents ?? campaign.dailyBudget ?? 0
                        ) / 100;
                      const cpa =
                        campaign.leads && campaign.leads > 0
                          ? spend / campaign.leads
                          : 0;
                      return (
                        <TableRow key={campaign.id}>
                          <TableCell className="font-medium">
                            {campaign.name}
                          </TableCell>
                          <TableCell>
                            <ObjectiveBadge
                              objective={mapObjective(campaign.objective)}
                            />
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              status={mapCampaignStatus(campaign.status)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(spend)}
                          </TableCell>
                          <TableCell className="text-right">
                            {campaign.leads ?? 0}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(cpa)}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            {metaUrl && (
                              <Button asChild size="sm" variant="outline">
                                <a
                                  href={metaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Ver na Meta
                                </a>
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleToggleCampaignStatus(campaign)
                              }
                              disabled={updatingCampaignId === campaign.id}
                            >
                              {updatingCampaignId === campaign.id
                                ? "..."
                                : mapCampaignStatus(campaign.status) === "ativo"
                                ? "Pausar"
                                : "Reativar"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mensalidade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Valor Mensal
                      </p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(client.monthlyFee / 100)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Vencimento:{" "}
                        {client.dueDay
                          ? `dia ${client.dueDay}`
                          : "nao definido"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant={
                          paymentStatus.isPaid ? "secondary" : "destructive"
                        }
                        className={
                          paymentStatus.isPaid
                            ? "bg-success/15 text-success border-success/30"
                            : ""
                        }
                      >
                        {paymentStatus.label}
                      </Badge>
                      <Button
                        size="sm"
                        variant={paymentStatus.isPaid ? "outline" : "default"}
                        onClick={() =>
                          handlePaymentToggle(!paymentStatus.isPaid)
                        }
                        disabled={updatingPayment}
                      >
                        {updatingPayment
                          ? "Atualizando..."
                          : paymentStatus.isPaid
                          ? "Marcar em aberto"
                          : "Marcar como pago"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Historico de Pagamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mes</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data Pagamento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="py-4 text-center text-muted-foreground"
                          >
                            Nenhum pagamento registrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        payments.map((payment: any) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              {format(new Date(payment.paidAt), "MMMM yyyy", {
                                locale: ptBR,
                              })}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(payment.amount / 100)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className="bg-success/15 text-success border-success/30"
                              >
                                Pago
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(payment.paidAt), "dd/MM/yyyy", {
                                locale: ptBR,
                              })}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="edit">
            <Card>
              <CardHeader>
                <CardTitle>Editar Cliente</CardTitle>
                <CardDescription>
                  Atualize os dados principais do cliente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Nome
                    </label>
                    <Input
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Status
                    </label>
                    <Select
                      value={editForm.status}
                      onValueChange={(v) =>
                        setEditForm({ ...editForm, status: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Ativo</SelectItem>
                        <SelectItem value="PAUSED">Pausado</SelectItem>
                        <SelectItem value="ARCHIVED">Arquivado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Cidade
                    </label>
                    <Input
                      value={editForm.city}
                      onChange={(e) =>
                        setEditForm({ ...editForm, city: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      UF
                    </label>
                    <Input
                      maxLength={2}
                      value={editForm.state}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          state: e.target.value.toUpperCase(),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Vencimento (dia)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={editForm.dueDay}
                      onChange={(e) =>
                        setEditForm({ ...editForm, dueDay: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      WhatsApp
                    </label>
                    <Input
                      value={editForm.whatsapp}
                      onChange={(e) =>
                        setEditForm({ ...editForm, whatsapp: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Instagram
                    </label>
                    <Input
                      value={editForm.instagram}
                      onChange={(e) =>
                        setEditForm({ ...editForm, instagram: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Site
                    </label>
                    <Input
                      value={editForm.website}
                      onChange={(e) =>
                        setEditForm({ ...editForm, website: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Mensalidade (R$)
                    </label>
                    <Input
                      type="number"
                      value={editForm.monthlyFee}
                      onChange={(e) =>
                        setEditForm({ ...editForm, monthlyFee: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setEditForm({
                        name: client.name ?? "",
                        city: client.city ?? "",
                        state: client.state ?? "",
                        whatsapp: client.whatsapp ?? "",
                        instagram: client.instagram ?? "",
                        website: client.website ?? "",
                        monthlyFee: client.monthlyFee
                          ? String(client.monthlyFee / 100)
                          : "",
                        dueDay: client.dueDay ? String(client.dueDay) : "",
                        status: client.status ?? "ACTIVE",
                      })
                    }
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveClient} disabled={savingClient}>
                    {savingClient ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
                <CardDescription>
                  Anotacoes e observacoes sobre o cliente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Adicione suas notas aqui..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                />
                <Button onClick={handleSaveNotes}>Salvar Notas</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}





