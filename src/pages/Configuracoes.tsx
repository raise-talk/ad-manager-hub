"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  User,
  Bell,
  Palette,
  Building2,
  Upload,
  Save,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { apiFetch } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export default function Configuracoes() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState({
    nome: '',
    email: '',
    senha: '',
  });
  const [preferences, setPreferences] = useState({
    timezone: 'America/Sao_Paulo',
    moeda: 'BRL',
    tema: 'light',
  });
  const [notifications, setNotifications] = useState({
    alertas: true,
    relatorios: true,
    marketing: false,
  });
  const [business, setBusiness] = useState({
    nomeServico: 'TrafegoAds',
    metaPadrao: '10000',
  });

  const { data: notificationSettings } = useQuery({
    queryKey: ['settings', 'notifications'],
    queryFn: () => apiFetch<any>('/api/settings/notifications'),
  });

  const { data: businessSettings } = useQuery({
    queryKey: ['settings', 'business'],
    queryFn: () => apiFetch<any>('/api/settings/business'),
  });

  const handleSaveProfile = async () => {
    await apiFetch('/api/settings/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name: profile.nome,
        email: profile.email,
        password: profile.senha || undefined,
      }),
    });
    setProfile((prev) => ({ ...prev, senha: '' }));
  };

  const handleSavePreferences = async () => {
    await apiFetch('/api/settings/preferences', {
      method: 'PUT',
      body: JSON.stringify({
        timezone: preferences.timezone,
        currency: preferences.moeda,
      }),
    });
  };

  const handleSaveNotifications = async () => {
    await apiFetch('/api/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify({
        notifyAlerts: notifications.alertas,
        notifyReports: notifications.relatorios,
        notifyMarketing: notifications.marketing,
      }),
    });
  };

  const handleSaveBusiness = async () => {
    await apiFetch('/api/settings/business', {
      method: 'PUT',
      body: JSON.stringify({
        serviceName: business.nomeServico,
        defaultGoal: Number(business.metaPadrao),
      }),
    });
  };

  const { data: storedPreferences } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => apiFetch<any>('/api/settings/preferences'),
  });

  useEffect(() => {
    if (session?.user) {
      setProfile((prev) => ({
        ...prev,
        nome: session.user.name ?? '',
        email: session.user.email ?? '',
      }));
    }
  }, [session]);

  useEffect(() => {
    if (storedPreferences) {
      setPreferences((prev) => ({
        ...prev,
        timezone: storedPreferences.timezone ?? prev.timezone,
        moeda: storedPreferences.currency ?? prev.moeda,
      }));
    }
  }, [storedPreferences]);

  useEffect(() => {
    if (notificationSettings) {
      setNotifications({
        alertas: notificationSettings.notifyAlerts ?? true,
        relatorios: notificationSettings.notifyReports ?? true,
        marketing: notificationSettings.notifyMarketing ?? false,
      });
    }
  }, [notificationSettings]);

  useEffect(() => {
    if (businessSettings) {
      setBusiness({
        nomeServico: businessSettings.serviceName ?? 'TrafegoAds',
        metaPadrao: String(businessSettings.defaultGoal ?? 0),
      });
    }
  }, [businessSettings]);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie sua conta e preferências
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2 hidden sm:block" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <Palette className="h-4 w-4 mr-2 hidden sm:block" />
              Preferências
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2 hidden sm:block" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="business">
              <Building2 className="h-4 w-4 mr-2 hidden sm:block" />
              Negócio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Perfil</CardTitle>
                <CardDescription>
                  Atualize suas informações pessoais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {profile.nome.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm">
                      <Upload className="mr-2 h-4 w-4" />
                      Alterar foto
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      JPG, PNG ou GIF. Máximo 2MB.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nome completo</Label>
                      <Input
                        value={profile.nome}
                        onChange={(e) =>
                          setProfile({ ...profile, nome: e.target.value })
                        }
                      />
                    </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Alterar Senha</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nova senha</Label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={profile.senha}
                        onChange={(e) =>
                          setProfile({ ...profile, senha: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Preferências</CardTitle>
                <CardDescription>
                  Personalize sua experiência no sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tema</Label>
                    <Select
                      value={preferences.tema}
                      onValueChange={(v) =>
                        setPreferences({ ...preferences, tema: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Escuro</SelectItem>
                        <SelectItem value="system">Sistema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Fuso Horário</Label>
                    <Select
                      value={preferences.timezone}
                      onValueChange={(v) =>
                        setPreferences({ ...preferences, timezone: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Sao_Paulo">
                          Brasília (GMT-3)
                        </SelectItem>
                        <SelectItem value="America/Manaus">
                          Manaus (GMT-4)
                        </SelectItem>
                        <SelectItem value="America/Noronha">
                          Fernando de Noronha (GMT-2)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Moeda</Label>
                    <Select
                      value={preferences.moeda}
                      onValueChange={(v) =>
                        setPreferences({ ...preferences, moeda: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRL">Real (R$)</SelectItem>
                        <SelectItem value="USD">Dólar (US$)</SelectItem>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSavePreferences}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Preferências
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>
                  Configure como deseja receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Alertas de campanhas</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba alertas sobre orçamento baixo e problemas
                      </p>
                    </div>
                    <Switch
                      checked={notifications.alertas}
                      onCheckedChange={(v) =>
                        setNotifications({ ...notifications, alertas: v })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Relatórios semanais</Label>
                      <p className="text-sm text-muted-foreground">
                        Resumo semanal de performance por email
                      </p>
                    </div>
                    <Switch
                      checked={notifications.relatorios}
                      onCheckedChange={(v) =>
                        setNotifications({ ...notifications, relatorios: v })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Novidades e dicas</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba dicas de otimização e novidades do sistema
                      </p>
                    </div>
                    <Switch
                      checked={notifications.marketing}
                      onCheckedChange={(v) =>
                        setNotifications({ ...notifications, marketing: v })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveNotifications}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Notificações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business">
            <Card>
              <CardHeader>
                <CardTitle>Dados do Negócio</CardTitle>
                <CardDescription>
                  Configure informações do seu serviço de gestão
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <Button variant="outline" size="sm">
                      <Upload className="mr-2 h-4 w-4" />
                      Carregar logo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Usado em relatórios e documentos. PNG ou SVG.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nome do Serviço</Label>
                    <Input
                      value={business.nomeServico}
                      onChange={(e) =>
                        setBusiness({ ...business, nomeServico: e.target.value })
                      }
                      placeholder="Ex: Gestor de Tráfego Pro"
                    />
                    <p className="text-xs text-muted-foreground">
                      Como seu serviço aparece para clientes
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Meta de Receita Padrão (R$)</Label>
                    <Input
                      type="number"
                      value={business.metaPadrao}
                      onChange={(e) =>
                        setBusiness({ ...business, metaPadrao: e.target.value })
                      }
                      placeholder="10000"
                    />
                    <p className="text-xs text-muted-foreground">
                      Meta mensal padrão para novos meses
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveBusiness}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Dados
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
