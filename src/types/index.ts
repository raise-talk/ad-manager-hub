// Core Types for the SaaS

export type ClientType = 'corretor' | 'imobiliaria';
export type ClientStatus = 'ativo' | 'pausado' | 'arquivado';
export type CampaignStatus = 'ativo' | 'pausado' | 'encerrado' | 'em_revisao';
export type CampaignObjective = 'leads' | 'conversoes' | 'trafego' | 'alcance' | 'engajamento';
export type AlertType = 'orcamento_baixo' | 'campanha_pausada' | 'erro_integracao';
export type AlertStatus = 'novo' | 'lido' | 'resolvido';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Client {
  id: string;
  tipo: ClientType;
  nome: string;
  cidade: string;
  uf: string;
  whatsapp: string;
  instagram?: string;
  site?: string;
  valorMensal: number;
  status: ClientStatus;
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdAccount {
  id: string;
  clientId: string;
  nome: string;
  plataforma: 'meta' | 'google';
  status: 'ativo' | 'pausado' | 'erro';
  gastoMensal: number;
  orcamento: number;
  ultimaAtualizacao: Date;
}

export interface Campaign {
  id: string;
  adAccountId: string;
  clientId: string;
  nome: string;
  objetivo: CampaignObjective;
  status: CampaignStatus;
  orcamentoDiario: number;
  gastoTotal: number;
  resultados: number;
  cpa: number;
  ultimaAlteracao: Date;
}

export interface Alert {
  id: string;
  tipo: AlertType;
  severidade: AlertSeverity;
  status: AlertStatus;
  clienteNome: string;
  contaNome: string;
  mensagem: string;
  dataHora: Date;
  adAccountId?: string;
}

export interface FinancialGoal {
  id: string;
  mes: string;
  metaClientes: number;
  metaReceita: number;
  clientesAtingidos: number;
  receitaAtingida: number;
}

export interface KPIData {
  gastoMes: number;
  leadsMes: number;
  cpl: number;
  roas: number;
  clientesAtivos: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface UserProfile {
  nome: string;
  email: string;
  avatar?: string;
  timezone: string;
  moeda: string;
  nomeServico: string;
  logo?: string;
}
