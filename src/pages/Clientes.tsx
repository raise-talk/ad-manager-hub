"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import type { ClientStatus, ClientType } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Archive,
  Building2,
  Eye,
  Filter,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ClientRow = {
  id: string;
  type: "BROKER" | "REAL_ESTATE" | "OTHER";
  name: string;
  city: string;
  state: string;
  whatsapp?: string | null;
  website?: string | null;
  instagram?: string | null;
  monthlyFee: number;
  dueDay?: number | null;
  notes?: string | null;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED";
  updatedAt: string;
};

export default function Clientes() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    tipo: "corretor" as ClientType,
    nome: "",
    cidade: "",
    uf: "",
    whatsapp: "",
    instagram: "",
    site: "",
    valorMensal: "",
    vencimento: "",
    status: "ativo" as ClientStatus,
    observacoes: "",
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const {
    data: clients = [],
    refetch,
    isLoading,
  } = useQuery<ClientRow[]>({
    queryKey: ["clients", statusFilter, searchQuery],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        const mapped =
          statusFilter === "ativo"
            ? "ACTIVE"
            : statusFilter === "pausado"
            ? "PAUSED"
            : "ARCHIVED";
        params.set("status", mapped);
      }
      if (searchQuery) params.set("search", searchQuery);
      return apiFetch<ClientRow[]>(`/api/clients?${params.toString()}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mappedType =
      formData.tipo === "corretor"
        ? "BROKER"
        : formData.tipo === "imobiliaria"
        ? "REAL_ESTATE"
        : "OTHER";
    const payload = {
      type: mappedType,
      name: formData.nome,
      city: formData.cidade,
      state: formData.uf,
      whatsapp: formData.whatsapp || undefined,
      instagram: formData.instagram || undefined,
      website: formData.site || undefined,
      monthlyFee: Math.round(Number(formData.valorMensal || 0) * 100),
      dueDay: formData.vencimento ? Number(formData.vencimento) : undefined,
      status:
        formData.status === "ativo"
          ? "ACTIVE"
          : formData.status === "pausado"
          ? "PAUSED"
          : "ARCHIVED",
      notes: formData.observacoes || undefined,
    };

    if (editingId) {
      await apiFetch(`/api/clients/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      await apiFetch("/api/clients", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    await refetch();
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({
      tipo: "corretor",
      nome: "",
      cidade: "",
      uf: "",
      whatsapp: "",
      instagram: "",
      site: "",
      valorMensal: "",
      vencimento: "",
      status: "ativo",
      observacoes: "",
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
            <p className="text-muted-foreground">Gerencie seus clientes</p>
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingId(null);
                setFormData({
                  tipo: "corretor",
                  nome: "",
                  cidade: "",
                  uf: "",
                  whatsapp: "",
                  instagram: "",
                  site: "",
                  valorMensal: "",
                  vencimento: "",
                  status: "ativo",
                  observacoes: "",
                });
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Editar Cliente" : "Novo Cliente"}
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados para cadastrar um novo cliente
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(v: ClientType) =>
                        setFormData({ ...formData, tipo: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corretor">Corretor</SelectItem>
                        <SelectItem value="imobiliaria">Imobiliária</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v: ClientStatus) =>
                        setFormData({ ...formData, status: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="pausado">Pausado</SelectItem>
                        <SelectItem value="arquivado">Arquivado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    placeholder="Nome do cliente ou empresa"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input
                      placeholder="Cidade"
                      value={formData.cidade}
                      onChange={(e) =>
                        setFormData({ ...formData, cidade: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>UF</Label>
                    <Input
                      placeholder="UF"
                      maxLength={2}
                      value={formData.uf}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          uf: e.target.value.toUpperCase(),
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    <Input
                      placeholder="(00) 00000-0000"
                      value={formData.whatsapp}
                      onChange={(e) =>
                        setFormData({ ...formData, whatsapp: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Mensal</Label>
                    <Input
                      placeholder="R$ 0,00"
                      type="number"
                      value={formData.valorMensal}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          valorMensal: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vencimento (dia do mês)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      placeholder="Ex: 10"
                      value={formData.vencimento}
                      onChange={(e) =>
                        setFormData({ ...formData, vencimento: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Instagram (opcional)</Label>
                    <Input
                      placeholder="@usuario"
                      value={formData.instagram}
                      onChange={(e) =>
                        setFormData({ ...formData, instagram: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Site (opcional)</Label>
                    <Input
                      placeholder="www.site.com.br"
                      value={formData.site}
                      onChange={(e) =>
                        setFormData({ ...formData, site: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Observações (opcional)</Label>
                  <Textarea
                    placeholder="Notas sobre o cliente..."
                    value={formData.observacoes}
                    onChange={(e) =>
                      setFormData({ ...formData, observacoes: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar Cliente</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou cidade..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="pausado">Pausados</SelectItem>
                  <SelectItem value="arquivado">Arquivados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Vencimento</TableHead>
                  <TableHead className="text-right">Valor Mensal</TableHead>
                  <TableHead className="text-right">
                    Última Atualização
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 4 }).map((_, idx) => (
                    <TableRow key={`client-skel-${idx}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-lg" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-36" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-14 ml-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16 ml-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20 ml-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))}

                {!isLoading && clients.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Nenhum cliente encontrado.
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading &&
                  clients.map((client) => {
                    const readableType =
                      client.type === "REAL_ESTATE"
                        ? "Imobiliária"
                        : client.type === "BROKER"
                        ? "Corretor"
                        : "Outro";

                    return (
                      <TableRow
                        key={client.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/clientes/${client.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                              {client.type === "REAL_ESTATE" ? (
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <User className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{client.name}</p>
                              {client.instagram && (
                                <p className="text-xs text-muted-foreground">
                                  {client.instagram}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">
                          {readableType}
                        </TableCell>
                        <TableCell>
                          {client.city}/{client.state}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={
                              client.status === "ACTIVE"
                                ? "ativo"
                                : client.status === "PAUSED"
                                ? "pausado"
                                : "arquivado"
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          {client.dueDay ? `Dia ${client.dueDay}` : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(client.monthlyFee / 100)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {format(new Date(client.updatedAt), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/clientes/${client.id}`)
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setEditingId(client.id);
                                  setFormData({
                                    tipo:
                                      client.type === "BROKER"
                                        ? "corretor"
                                        : client.type === "REAL_ESTATE"
                                        ? "imobiliaria"
                                        : "outro",
                                    nome: client.name,
                                    cidade: client.city,
                                    uf: client.state,
                                    whatsapp: client.whatsapp ?? "",
                                    instagram: client.instagram ?? "",
                                    site: client.website ?? "",
                                    valorMensal: String(
                                      client.monthlyFee / 100
                                    ),
                                    vencimento: client.dueDay
                                      ? String(client.dueDay)
                                      : "",
                                    status:
                                      client.status === "ACTIVE"
                                        ? "ativo"
                                        : client.status === "PAUSED"
                                        ? "pausado"
                                        : "arquivado",
                                    observacoes: client.notes ?? "",
                                  });
                                  setIsDialogOpen(true);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={async (event) => {
                                  event.stopPropagation();
                                  await apiFetch(`/api/clients/${client.id}`, {
                                    method: "DELETE",
                                  });
                                  await refetch();
                                }}
                              >
                                <Archive className="mr-2 h-4 w-4" />
                                Arquivar
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
      </div>
    </AppLayout>
  );
}
