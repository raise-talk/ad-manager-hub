"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  User,
  Phone,
  Globe,
  Instagram,
  DollarSign,
  Target,
  TrendingUp,
  Megaphone,
  CreditCard,
  StickyNote,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { KPICard } from '@/components/dashboard/KPICard';
import { StatusBadge, ObjectiveBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export default function ClienteDetalhes() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [notes, setNotes] = useState('');
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedAdAccount, setSelectedAdAccount] = useState('');

  const { data: client, isLoading, refetch: refetchClient } = useQuery({
    queryKey: ['client', id],
    queryFn: () => apiFetch<any>(`/api/clients/${id}`),
    enabled: !!id,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns', id],
    queryFn: () => apiFetch<any[]>(`/api/campaigns?clientId=${id}`),
    enabled: !!id,
  });

  const { data: allAccounts = [], refetch: refetchAccounts } = useQuery({
    queryKey: ['ad-accounts'],
    queryFn: () => apiFetch<any[]>('/api/ad-accounts'),
  });

  const adAccounts = client?.adAccounts?.map((item: any) => item.adAccount) ?? [];
  const linkedAccountIds = new Set(adAccounts.map((account: any) => account.id));
  const availableAccounts = allAccounts.filter(
    (account: any) => !linkedAccountIds.has(account.id),
  );

  useEffect(() => {
    if (client?.notes) {
      setNotes(client.notes);
    }
  }, [client?.notes]);

  if (!client && !isLoading) {
    return (
      <AppLayout>
        <EmptyState
          icon={User}
          title="Cliente não encontrado"
          description="O cliente que você está procurando não existe ou foi removido."
          action={{ label: 'Voltar para clientes', onClick: () => router.push('/clientes') }}
        />
      </AppLayout>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const totalGasto = adAccounts.reduce((acc: number, a: any) => acc + Number(a.spendCap ?? 0), 0);
  const totalLeads = campaigns.reduce((acc: number, c: any) => acc + Number(c.leads ?? 0), 0);
  const avgCPL = totalLeads > 0 ? totalGasto / totalLeads : 0;

  const handleSaveNotes = async () => {
    if (!id) return;
    await apiFetch(`/api/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    });
  };

  const handleLinkAccount = async () => {
    if (!id || !selectedAdAccount) return;
    await apiFetch(`/api/clients/${id}/ad-accounts`, {
      method: 'POST',
      body: JSON.stringify({
        adAccountIds: [selectedAdAccount],
        primaryAdAccountId: selectedAdAccount,
      }),
    });
    setLinkDialogOpen(false);
    setSelectedAdAccount('');
    await Promise.all([refetchAccounts(), refetchClient()]);
  };

  const mapObjective = (objective?: string) => {
    if (!objective) return 'leads';
    const normalized = objective.toLowerCase();
    if (normalized.includes('conversion')) return 'conversoes';
    if (normalized.includes('traffic')) return 'trafego';
    if (normalized.includes('reach')) return 'alcance';
    if (normalized.includes('engagement')) return 'engajamento';
    return 'leads';
  };

  const mapCampaignStatus = (status?: string) => {
    if (!status) return 'ativo';
    const normalized = status.toLowerCase();
    if (normalized.includes('paused')) return 'pausado';
    if (normalized.includes('review')) return 'em_revisao';
    if (normalized.includes('archived') || normalized.includes('completed')) return 'encerrado';
    return 'ativo';
  };

  const mapAccountStatus = (status?: string) => {
    if (!status) return 'ativo';
    const normalized = status.toLowerCase();
    if (normalized.includes('paused') || normalized === '2') return 'pausado';
    if (normalized.includes('active') || normalized === '1') return 'ativo';
    return 'erro';
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
              onClick={() => router.push('/clientes')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                {client.type === 'REAL_ESTATE' ? (
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                ) : (
                  <User className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
                  <StatusBadge
                    status={
                      client.status === 'ACTIVE'
                        ? 'ativo'
                        : client.status === 'PAUSED'
                        ? 'pausado'
                        : 'arquivado'
                    }
                  />
                </div>
                <p className="text-muted-foreground">
                  {client.type === 'REAL_ESTATE' ? 'Imobiliária' : 'Corretor'} •{' '}
                  {client.city}/{client.state}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Editar</Button>
            <Button>Ver Campanhas</Button>
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
              href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
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
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="accounts">Contas de Anúncios</TabsTrigger>
            <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
            <TabsTrigger value="notes">Notas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KPICard
                title="Gasto Total (Mês)"
                value={formatCurrency(totalGasto)}
                icon={DollarSign}
              />
              <KPICard
                title="Leads Gerados"
                value={totalLeads}
                icon={Target}
              />
              <KPICard
                title="CPL Médio"
                value={formatCurrency(avgCPL)}
                icon={TrendingUp}
              />
              <KPICard
                title="Campanhas Ativas"
                value={campaigns.filter(c => c.status === 'ativo').length}
                icon={Megaphone}
              />
            </div>

            {client.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{client.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="accounts">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>Contas de Anúncios</CardTitle>
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
                      <Button onClick={handleLinkAccount} disabled={!selectedAdAccount}>
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
                    description="Conecte uma conta de anúncios Meta para começar a acompanhar as campanhas deste cliente."
                    action={{
                      label: 'Conectar conta',
                      onClick: () => router.push('/integracoes'),
                    }}
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Conta</TableHead>
                        <TableHead>Plataforma</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Gasto (Mês)</TableHead>
                        <TableHead className="text-right">Orçamento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adAccounts.map((account: any) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">{account.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">Meta</Badge>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={mapAccountStatus(account.status)} />
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(Number(account.spendCap ?? 0) / 100)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(Number(account.spendCap ?? 0) / 100)}
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
              <CardHeader>
                <CardTitle>Campanhas</CardTitle>
                <CardDescription>
                  Todas as campanhas ativas deste cliente
                </CardDescription>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign: any) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>
                          <ObjectiveBadge objective={mapObjective(campaign.objective)} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={mapCampaignStatus(campaign.status)} />
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(campaign.dailyBudget ?? 0) / 100)}
                        </TableCell>
                        <TableCell className="text-right">{campaign.leads ?? 0}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(campaign.dailyBudget ?? 0) / 100)}
                        </TableCell>
                      </TableRow>
                    ))}
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
                      <p className="text-sm text-muted-foreground">Valor Mensal</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(client.monthlyFee / 100)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-success/15 text-success border-success/30">
                      Em dia
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Pagamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mês</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data Pagamento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Dezembro 2024</TableCell>
                        <TableCell>{formatCurrency(client.monthlyFee / 100)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-success/15 text-success">
                            Pago
                          </Badge>
                        </TableCell>
                        <TableCell>05/12/2024</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Novembro 2024</TableCell>
                        <TableCell>{formatCurrency(client.monthlyFee / 100)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-success/15 text-success">
                            Pago
                          </Badge>
                        </TableCell>
                        <TableCell>03/11/2024</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
                <CardDescription>
                  Anotações e observações sobre o cliente
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
