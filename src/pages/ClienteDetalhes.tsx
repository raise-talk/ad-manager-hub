import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
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
import {
  getClientById,
  getAdAccountsByClient,
  getCampaignsByClient,
} from '@/data/mockData';

export default function ClienteDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');

  const client = getClientById(id || '');
  const adAccounts = getAdAccountsByClient(id || '');
  const campaigns = getCampaignsByClient(id || '');

  if (!client) {
    return (
      <AppLayout>
        <EmptyState
          icon={User}
          title="Cliente não encontrado"
          description="O cliente que você está procurando não existe ou foi removido."
          action={{ label: 'Voltar para clientes', onClick: () => navigate('/clientes') }}
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

  const totalGasto = adAccounts.reduce((acc, a) => acc + a.gastoMensal, 0);
  const totalLeads = campaigns.reduce((acc, c) => acc + c.resultados, 0);
  const avgCPL = totalLeads > 0 ? totalGasto / totalLeads : 0;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/clientes')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                {client.tipo === 'imobiliaria' ? (
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                ) : (
                  <User className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight">{client.nome}</h1>
                  <StatusBadge status={client.status} />
                </div>
                <p className="text-muted-foreground">
                  {client.tipo === 'imobiliaria' ? 'Imobiliária' : 'Corretor'} •{' '}
                  {client.cidade}/{client.uf}
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
          {client.site && (
            <a
              href={`https://${client.site}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Globe className="h-4 w-4" />
              {client.site}
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

            {client.observacoes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{client.observacoes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="accounts">
            <Card>
              <CardHeader>
                <CardTitle>Contas de Anúncios</CardTitle>
                <CardDescription>
                  Contas conectadas via Meta/Facebook
                </CardDescription>
              </CardHeader>
              <CardContent>
                {adAccounts.length === 0 ? (
                  <EmptyState
                    icon={Megaphone}
                    title="Nenhuma conta conectada"
                    description="Conecte uma conta de anúncios Meta para começar a acompanhar as campanhas deste cliente."
                    action={{
                      label: 'Conectar conta',
                      onClick: () => navigate('/integracoes'),
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
                      {adAccounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">{account.nome}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">Meta</Badge>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={account.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(account.gastoMensal)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(account.orcamento)}
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
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.nome}</TableCell>
                        <TableCell>
                          <ObjectiveBadge objective={campaign.objetivo} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={campaign.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(campaign.gastoTotal)}
                        </TableCell>
                        <TableCell className="text-right">{campaign.resultados}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(campaign.cpa)}
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
                      <p className="text-2xl font-bold">{formatCurrency(client.valorMensal)}</p>
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
                        <TableCell>{formatCurrency(client.valorMensal)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-success/15 text-success">
                            Pago
                          </Badge>
                        </TableCell>
                        <TableCell>05/12/2024</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Novembro 2024</TableCell>
                        <TableCell>{formatCurrency(client.valorMensal)}</TableCell>
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
                <Button>Salvar Notas</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
