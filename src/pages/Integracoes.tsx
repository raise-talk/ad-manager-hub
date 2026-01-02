import { useState } from 'react';
import {
  Facebook,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Shield,
  ExternalLink,
  Link2,
  Unlink,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

export default function Integracoes() {
  const [isConnected, setIsConnected] = useState(true);

  const mockAccounts = [
    { id: '1', name: 'Vista Mar Imobiliária', accountId: 'act_123456789', status: 'ativo' },
    { id: '2', name: 'João Silva Ads', accountId: 'act_987654321', status: 'ativo' },
    { id: '3', name: 'Prime Imóveis - Vendas', accountId: 'act_456789123', status: 'ativo' },
    { id: '4', name: 'Prime Imóveis - Locação', accountId: 'act_789123456', status: 'pausado' },
  ];

  const handleConnect = () => {
    // Mock connect action
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
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
              {isConnected ? (
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
            {isConnected ? (
              <div className="space-y-6">
                {/* Connected Profile */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Facebook className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Gestor de Tráfego Pro</p>
                      <p className="text-sm text-muted-foreground">
                        Business ID: 1234567890
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reconectar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleDisconnect}>
                      <Unlink className="mr-2 h-4 w-4" />
                      Desconectar
                    </Button>
                  </div>
                </div>

                {/* Connected Accounts */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Contas de Anúncio Disponíveis</h3>
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
                      {mockAccounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">{account.name}</TableCell>
                          <TableCell className="text-muted-foreground font-mono text-sm">
                            {account.accountId}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                account.status === 'ativo'
                                  ? 'bg-success/15 text-success border-success/30'
                                  : 'bg-warning/15 text-warning border-warning/30'
                              }
                            >
                              {account.status === 'ativo' ? 'Ativo' : 'Pausado'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Permissions Info */}
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Permissões de Acesso</AlertTitle>
                  <AlertDescription className="text-sm">
                    Esta integração tem acesso a: leitura de campanhas, métricas de desempenho, 
                    orçamentos e configurações das contas conectadas. Nenhuma alteração é feita 
                    automaticamente em suas campanhas.
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
                    Ao conectar, você terá acesso às métricas de todas as contas de anúncio 
                    que gerencia, permitindo acompanhar a performance dos seus clientes.
                  </p>
                  <Button size="lg" onClick={handleConnect}>
                    <Facebook className="mr-2 h-5 w-5" />
                    Conectar com Facebook
                  </Button>
                </div>

                <div className="border-t pt-6">
                  <h4 className="text-sm font-medium mb-3">O que você terá acesso:</h4>
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
                    Utilizamos autenticação OAuth oficial do Facebook. Suas credenciais 
                    nunca são armazenadas. Você pode revogar o acesso a qualquer momento.
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
              Conecte suas contas do Google Ads para gerenciar campanhas de pesquisa e display
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
