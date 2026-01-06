"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import Image from "next/image";
import {
  Bell,
  Building2,
  Loader2,
  Palette,
  Save,
  Upload,
  User,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";

const notifyBrandingChange = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("rt-branding-updated"));
};

export default function Configuracoes() {
  const { data: session, update: updateSession } = useSession();
  const { resolvedTheme, setTheme } = useTheme();

  const [profile, setProfile] = useState({
    nome: "",
    email: "",
    senha: "",
  });
  const [preferences, setPreferences] = useState({
    timezone: "America/Sao_Paulo",
    moeda: "BRL",
    tema: "system",
  });
  const [notifications, setNotifications] = useState({
    alertas: true,
    relatorios: true,
    marketing: false,
  });
  const [business, setBusiness] = useState({
    nomeServico: "Seu negócio",
    metaPadrao: "10000",
  });
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [businessLogo, setBusinessLogo] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);
  const profileInputRef = useRef<HTMLInputElement | null>(null);
  const businessInputRef = useRef<HTMLInputElement | null>(null);

  const { data: storedPreferences } = useQuery<{ timezone?: string; currency?: string }>({
    queryKey: ["preferences"],
    queryFn: () => apiFetch<{ timezone: string; currency: string }>("/api/settings/preferences"),
  });
  const { data: profileData } = useQuery<{
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
  }>({
    queryKey: ["profile"],
    queryFn: () => apiFetch("/api/settings/profile"),
  });
  const { data: businessData } = useQuery<{
    businessName: string;
    businessLogo: string | null;
  }>({
    queryKey: ["business"],
    queryFn: () => apiFetch("/api/settings/business"),
  });

  useEffect(() => {
    if (session?.user) {
      setProfile((prev) => ({
        ...prev,
        nome: session.user.name ?? "",
        email: session.user.email ?? "",
      }));
    }
  }, [session]);

  useEffect(() => {
    if (profileData) {
      setProfile((prev) => ({
        ...prev,
        nome: profileData.name ?? prev.nome,
        email: profileData.email ?? prev.email,
      }));
      setProfilePhoto(profileData.profileImage ?? null);
    }
  }, [profileData]);

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
    if (resolvedTheme) {
      setPreferences((prev) => ({ ...prev, tema: resolvedTheme }));
    }
  }, [resolvedTheme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedNotifications = localStorage.getItem("rt-notifications");

    if (storedNotifications) {
      try {
        setNotifications(JSON.parse(storedNotifications));
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    if (businessData) {
      setBusiness((prev) => ({
        ...prev,
        nomeServico: businessData.businessName || prev.nomeServico,
      }));
      setBusinessLogo(businessData.businessLogo ?? null);
    }
  }, [businessData]);

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      const updated = await apiFetch<{ name: string; email: string; profileImage?: string | null }>(
        "/api/settings/profile",
        {
          method: "PUT",
          body: JSON.stringify({
            name: profile.nome,
            email: profile.email,
            password: profile.senha || undefined,
            profileImage: profilePhoto || undefined,
          }),
        }
      );
      setProfile((prev) => ({
        ...prev,
        senha: "",
        nome: updated.name,
        email: updated.email,
      }));
      // Atualiza sessão para refletir imediatamente no topo
      updateSession?.({
        name: updated.name,
        email: updated.email,
        image: updated.profileImage ?? profilePhoto ?? undefined,
      });
      toast.success("Perfil atualizado");
      notifyBrandingChange();
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível atualizar o perfil");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setIsSavingPreferences(true);
      await apiFetch("/api/settings/preferences", {
        method: "PUT",
        body: JSON.stringify({
          timezone: preferences.timezone,
          currency: preferences.moeda,
        }),
      });
      setTheme(preferences.tema);
      toast.success("Preferências salvas");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível salvar preferências");
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setIsSavingNotifications(true);
      localStorage.setItem("rt-notifications", JSON.stringify(notifications));
      toast.success("Notificações salvas");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível salvar as notificações");
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleSaveBusiness = async () => {
    try {
      setIsSavingBusiness(true);
      const updated = await apiFetch<{
        businessName: string;
        businessLogo: string | null;
      }>("/api/settings/business", {
        method: "PUT",
        body: JSON.stringify({
          name: business.nomeServico,
          logo: businessLogo ?? undefined,
        }),
      });
      setBusiness((prev) => ({
        ...prev,
        nomeServico: updated.businessName || prev.nomeServico,
      }));
      setBusinessLogo(updated.businessLogo ?? null);
      toast.success("Dados do negócio salvos");
      notifyBrandingChange();
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível salvar os dados do negócio");
    } finally {
      setIsSavingBusiness(false);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error("Imagem muito grande (máx. 2MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setter(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
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
                    {profilePhoto && <AvatarImage src={profilePhoto} alt="Foto do perfil" />}
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {profile.nome.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={profileInputRef}
                      onChange={(e) =>
                        handleFileChange(e, (val) => setProfilePhoto(val))
                      }
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => profileInputRef.current?.click()}
                    >
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
                        placeholder="********"
                        value={profile.senha}
                        onChange={(e) =>
                          setProfile({ ...profile, senha: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                  >
                    {isSavingProfile ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {isSavingProfile ? "Salvando..." : "Salvar Alterações"}
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
                      onValueChange={(v) => {
                        setPreferences({ ...preferences, tema: v });
                        setTheme(v);
                      }}
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
                  <Button
                    onClick={handleSavePreferences}
                    disabled={isSavingPreferences}
                  >
                    {isSavingPreferences ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {isSavingPreferences
                      ? "Salvando..."
                      : "Salvar Preferências"}
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
                  <Button
                    onClick={handleSaveNotifications}
                    disabled={isSavingNotifications}
                  >
                    {isSavingNotifications ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {isSavingNotifications
                      ? "Salvando..."
                      : "Salvar Notificações"}
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
                  <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden relative">
                    {businessLogo ? (
                      <Image
                        src={businessLogo}
                        alt="Logo do negócio"
                        fill
                        sizes="80px"
                        className="object-cover"
                        priority={false}
                      />
                    ) : (
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={businessInputRef}
                      onChange={(e) =>
                        handleFileChange(e, (val) => setBusinessLogo(val))
                      }
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => businessInputRef.current?.click()}
                    >
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
                        setBusiness({
                          ...business,
                          nomeServico: e.target.value,
                        })
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
                  <Button
                    onClick={handleSaveBusiness}
                    disabled={isSavingBusiness}
                  >
                    {isSavingBusiness ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {isSavingBusiness ? "Salvando..." : "Salvar Dados"}
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
