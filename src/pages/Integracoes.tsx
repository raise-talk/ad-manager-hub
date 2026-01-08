"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  ExternalLink,
  Facebook,
  Link2,
  Loader2,
  RefreshCw,
  Shield,
  Unlink,
} from "lucide-react";
import { useMemo, useState } from "react";

type Integration = {
  status?: string;
  metaUserName?: string;
  metaUserId?: string;
};

type AdAccount = {
  id: string;
  name: string;
  status?: string;
};

function IntegrationContentSkeleton() {
  return (
    <div className="space-y-6">
      {/* Connected Profile Skeleton */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <div className="hidden md:flex gap-2">
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-9 w-52" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div>
        <Skeleton className="h-4 w-56 mb-3" />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome da Conta</TableHead>
              <TableHead>ID da Conta</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 3 }).map((_, idx) => (
              <TableRow key={`acc-skel-${idx}`}>
                <TableCell>
                  <Skeleton className="h-4 w-48" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-8 w-10 ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Permissions Skeleton */}
      <div className="rounded-lg border p-4 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

export default function Integracoes() {
  const {
    data: integration,
    refetch,
    isLoading: integrationLoading,
  } = useQuery<Integration>({
    queryKey: ["meta", "integration"],
    queryFn: () => apiFetch<Integration>("/api/meta/integration"),
  });

  const {
    data: adAccounts = [],
    refetch: refetchAccounts,
    isLoading: accountsLoading,
  } = useQuery<AdAccount[]>({
    queryKey: ["ad-accounts"],
    queryFn: () => apiFetch<AdAccount[]>("/api/ad-accounts"),
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingCampaigns, setIsSyncingCampaigns] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const isConnected = integration?.status === "CONNECTED";

  const connectedName = integration?.metaUserName ?? "Conta Meta";
  const connectedId = integration?.metaUserId ?? "—";

  const handleConnect = () => {
    window.location.href = "/api/meta/oauth/start";
  };

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      await apiFetch("/api/meta/integration", { method: "DELETE" });
      toast.success("Integração desconectada");
      await refetch();
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível desconectar agora.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleSyncAccounts = async () => {
    try {
      setIsSyncing(true);
      await apiFetch("/api/meta/sync-accounts", { method: "POST" });
      toast.success("Contas sincronizadas com sucesso");
      await refetchAccounts();
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível sincronizar as contas.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncCampaigns = async () => {
    try {
      setIsSyncingCampaigns(true);
      await apiFetch("/api/meta/sync-campaigns", { method: "POST" });
      toast.success("Campanhas sincronizadas com sucesso");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível sincronizar as campanhas.");
    } finally {
      setIsSyncingCampaigns(false);
    }
  };

  const accounts = useMemo(() => adAccounts, [adAccounts]);

  const openInMeta = (adAccountId: string) => {
    const actId = adAccountId.replace("act_", "");
    const url = `https://www.facebook.com/adsmanager/manage/campaigns?act=${actId}`;
    window.open(url, "_blank");
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Integrações</h1>
            <p className="text-muted-foreground">
              Conecte suas contas de anúncios para sincronizar dados
            </p>
          </div>
        </div>

        {/* Meta Integration Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-[#1877F2] to-[#0866FF] p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                <Facebook className="h-6 w-6" />
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-bold">Meta / Facebook Ads</h2>
                <p className="text-white/80">
                  Conecte suas contas de anúncios do Facebook e Instagram
                </p>
              </div>

              {/* Status (com placeholder durante loading) */}
              {integrationLoading ? (
                <div className="h-8 w-28 rounded-full bg-white/20 animate-pulse" />
              ) : isConnected ? (
                <div className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Conectado</span>
                </div>
              ) : (
                <Badge variant="secondary" className="bg-white/20 text-white">
                  Desconectado
                </Badge>
              )}
            </div>
          </div>

          <CardContent className="p-6">
            {/* Skeleton abaixo enquanto carrega os dados da integração */}
            {integrationLoading ? (
              <IntegrationContentSkeleton />
            ) : isConnected ? (
              <div className="space-y-6">
                {/* Connected Profile */}
                <div className="flex flex-col gap-3 rounded-lg bg-muted p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Facebook className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{connectedName}</p>
                      <p className="text-sm text-muted-foreground">
                        Business ID: {connectedId}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSyncAccounts}
                      disabled={isSyncing}
                      className="w-full sm:w-auto"
                    >
                      {isSyncing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      {isSyncing ? "Sincronizando..." : "Sincronizar contas"}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSyncCampaigns}
                      disabled={isSyncingCampaigns}
                      className="w-full sm:w-auto"
                    >
                      {isSyncingCampaigns ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      {isSyncingCampaigns
                        ? "Sincronizando campanhas..."
                        : "Sincronizar campanhas"}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDisconnect}
                      disabled={isDisconnecting}
                      className="w-full sm:w-auto"
                    >
                      {isDisconnecting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Unlink className="mr-2 h-4 w-4" />
                      )}
                      {isDisconnecting ? "Desconectando..." : "Desconectar"}
                    </Button>
                  </div>
                </div>

                {/* Connected Accounts */}
                <div>
                  <h3 className="text-sm font-medium mb-3">
                    Contas de Anúncio Disponíveis
                  </h3>
                  <div className="rounded-lg border">
                    <div className="w-full overflow-x-auto">
                      <Table className="min-w-[640px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome da Conta</TableHead>
                            <TableHead>ID da Conta</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {accountsLoading &&
                            Array.from({ length: 3 }).map((_, idx) => (
                              <TableRow key={`acc-skel-${idx}`}>
                                <TableCell>
                                  <Skeleton className="h-4 w-48" />
                                </TableCell>
                                <TableCell>
                                  <Skeleton className="h-4 w-32" />
                                </TableCell>
                                <TableCell>
                                  <Skeleton className="h-6 w-20" />
                                </TableCell>
                                <TableCell className="text-right">
                                  <Skeleton className="h-8 w-10 ml-auto" />
                                </TableCell>
                              </TableRow>
                            ))}

                          {!accountsLoading &&
                            accounts.map((account: AdAccount) => (
                              <TableRow key={account.id}>
                                <TableCell className="font-medium">
                                  {account.name}
                                </TableCell>
                                <TableCell className="text-muted-foreground font-mono text-sm">
                                  {account.id}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={
                                      String(account.status).toUpperCase() ===
                                      "ACTIVE"
                                        ? "bg-success/15 text-success border-success/30"
                                        : "bg-warning/15 text-warning border-warning/30"
                                    }
                                  >
                                    {String(account.status).toUpperCase() ===
                                    "ACTIVE"
                                      ? "Ativo"
                                      : "Pausado"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openInMeta(account.id)}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}

                          {!accountsLoading && accounts.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                className="py-6 text-center text-muted-foreground"
                              >
                                Nenhuma conta sincronizada. Clique em “Sincronizar
                                contas”.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>

                {/* Permissions Info */}
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Permissões de Acesso</AlertTitle>
                  <AlertDescription className="text-sm">
                    Esta integração tem acesso a: leitura de campanhas, métricas
                    de desempenho, orçamentos e configurações das contas
                    conectadas. Nenhuma alteração é feita automaticamente em
                    suas campanhas.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Link2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Conecte sua conta Meta Business
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    Ao conectar, você terá acesso às métricas de todas as contas
                    de anúncio que gerencia, permitindo acompanhar a performance
                    dos seus clientes.
                  </p>
                  <Button size="lg" onClick={handleConnect}>
                    <Facebook className="mr-2 h-5 w-5" />
                    Conectar com Facebook
                  </Button>
                </div>

                <div className="border-t pt-6">
                  <h4 className="text-sm font-medium mb-3">
                    O que você terá acesso:
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Métricas de campanhas em tempo real
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Informações de orçamento e gastos
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Dados de leads e conversões
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Alertas automáticos de orçamento
                    </li>
                  </ul>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Seus dados estão seguros</AlertTitle>
                  <AlertDescription className="text-sm">
                    Utilizamos autenticação OAuth oficial do Facebook. Suas
                    credenciais nunca são armazenadas. Você pode revogar o
                    acesso a qualquer momento.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Future Integrations */}
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Google Ads</CardTitle>
              <Badge variant="secondary">Em breve</Badge>
            </div>
            <CardDescription>
              Conecte suas contas do Google Ads para gerenciar campanhas de
              pesquisa e display
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled variant="outline">
              Em desenvolvimento
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
