import type { 
  Client, 
  AdAccount, 
  Campaign, 
  Alert, 
  FinancialGoal, 
  KPIData, 
  ChartDataPoint,
  UserProfile 
} from '@/types';

export const mockUser: UserProfile = {
  nome: 'Admin',
  email: 'admin@gestortrafego.com',
  timezone: 'America/Sao_Paulo',
  moeda: 'BRL',
  nomeServico: 'Gestor de Tráfego Pro',
};

export const mockClients: Client[] = [
  {
    id: '1',
    tipo: 'imobiliaria',
    nome: 'Imobiliária Vista Mar',
    cidade: 'Florianópolis',
    uf: 'SC',
    whatsapp: '48999998888',
    instagram: '@vistamar.imob',
    site: 'www.vistamar.com.br',
    valorMensal: 3500,
    status: 'ativo',
    observacoes: 'Cliente premium, foco em alto padrão',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-12-20'),
  },
  {
    id: '2',
    tipo: 'corretor',
    nome: 'João Silva Corretor',
    cidade: 'São Paulo',
    uf: 'SP',
    whatsapp: '11999997777',
    instagram: '@joaosilva.imoveis',
    valorMensal: 1500,
    status: 'ativo',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-12-18'),
  },
  {
    id: '3',
    tipo: 'imobiliaria',
    nome: 'Prime Imóveis',
    cidade: 'Rio de Janeiro',
    uf: 'RJ',
    whatsapp: '21999996666',
    instagram: '@primeimoveis',
    site: 'www.primeimoveis.com.br',
    valorMensal: 5000,
    status: 'ativo',
    observacoes: 'Maior cliente, requer atenção especial',
    createdAt: new Date('2023-11-01'),
    updatedAt: new Date('2024-12-22'),
  },
  {
    id: '4',
    tipo: 'corretor',
    nome: 'Maria Santos',
    cidade: 'Curitiba',
    uf: 'PR',
    whatsapp: '41999995555',
    valorMensal: 1200,
    status: 'pausado',
    observacoes: 'Pausado para férias de janeiro',
    createdAt: new Date('2024-06-20'),
    updatedAt: new Date('2024-12-15'),
  },
];

export const mockAdAccounts: AdAccount[] = [
  {
    id: 'acc1',
    clientId: '1',
    nome: 'Vista Mar - Principal',
    plataforma: 'meta',
    status: 'ativo',
    gastoMensal: 8500,
    orcamento: 10000,
    ultimaAtualizacao: new Date('2024-12-22T14:30:00'),
  },
  {
    id: 'acc2',
    clientId: '2',
    nome: 'João Silva Ads',
    plataforma: 'meta',
    status: 'ativo',
    gastoMensal: 3200,
    orcamento: 4000,
    ultimaAtualizacao: new Date('2024-12-22T12:00:00'),
  },
  {
    id: 'acc3',
    clientId: '3',
    nome: 'Prime Imóveis - Vendas',
    plataforma: 'meta',
    status: 'ativo',
    gastoMensal: 15000,
    orcamento: 18000,
    ultimaAtualizacao: new Date('2024-12-22T15:45:00'),
  },
  {
    id: 'acc4',
    clientId: '3',
    nome: 'Prime Imóveis - Locação',
    plataforma: 'meta',
    status: 'pausado',
    gastoMensal: 2000,
    orcamento: 5000,
    ultimaAtualizacao: new Date('2024-12-20T10:00:00'),
  },
];

export const mockCampaigns: Campaign[] = [
  {
    id: 'camp1',
    adAccountId: 'acc1',
    clientId: '1',
    nome: 'Lançamento Beira Mar Norte',
    objetivo: 'leads',
    status: 'ativo',
    orcamentoDiario: 300,
    gastoTotal: 4500,
    resultados: 89,
    cpa: 50.56,
    ultimaAlteracao: new Date('2024-12-22T10:00:00'),
  },
  {
    id: 'camp2',
    adAccountId: 'acc1',
    clientId: '1',
    nome: 'Captação Alto Padrão',
    objetivo: 'conversoes',
    status: 'ativo',
    orcamentoDiario: 200,
    gastoTotal: 2800,
    resultados: 34,
    cpa: 82.35,
    ultimaAlteracao: new Date('2024-12-21T16:30:00'),
  },
  {
    id: 'camp3',
    adAccountId: 'acc2',
    clientId: '2',
    nome: 'Apartamentos Centro SP',
    objetivo: 'leads',
    status: 'ativo',
    orcamentoDiario: 150,
    gastoTotal: 3200,
    resultados: 78,
    cpa: 41.03,
    ultimaAlteracao: new Date('2024-12-22T09:15:00'),
  },
  {
    id: 'camp4',
    adAccountId: 'acc3',
    clientId: '3',
    nome: 'Imóveis Zona Sul RJ',
    objetivo: 'leads',
    status: 'ativo',
    orcamentoDiario: 500,
    gastoTotal: 12000,
    resultados: 156,
    cpa: 76.92,
    ultimaAlteracao: new Date('2024-12-22T14:00:00'),
  },
  {
    id: 'camp5',
    adAccountId: 'acc3',
    clientId: '3',
    nome: 'Remarketing Leads Quentes',
    objetivo: 'conversoes',
    status: 'em_revisao',
    orcamentoDiario: 100,
    gastoTotal: 800,
    resultados: 12,
    cpa: 66.67,
    ultimaAlteracao: new Date('2024-12-20T11:00:00'),
  },
];

export const mockAlerts: Alert[] = [
  {
    id: 'alert1',
    tipo: 'orcamento_baixo',
    severidade: 'warning',
    status: 'novo',
    clienteNome: 'Imobiliária Vista Mar',
    contaNome: 'Vista Mar - Principal',
    mensagem: 'Orçamento atingiu 85% do limite mensal',
    dataHora: new Date('2024-12-22T14:30:00'),
    adAccountId: 'acc1',
  },
  {
    id: 'alert2',
    tipo: 'orcamento_baixo',
    severidade: 'critical',
    status: 'novo',
    clienteNome: 'Prime Imóveis',
    contaNome: 'Prime Imóveis - Vendas',
    mensagem: 'Orçamento atingiu 95% do limite mensal',
    dataHora: new Date('2024-12-22T15:45:00'),
    adAccountId: 'acc3',
  },
  {
    id: 'alert3',
    tipo: 'orcamento_baixo',
    severidade: 'info',
    status: 'lido',
    clienteNome: 'João Silva Corretor',
    contaNome: 'João Silva Ads',
    mensagem: 'Orçamento atingiu 80% do limite mensal',
    dataHora: new Date('2024-12-21T10:00:00'),
    adAccountId: 'acc2',
  },
];

export const mockKPIs: KPIData = {
  gastoMes: 28700,
  leadsMes: 369,
  cpl: 77.78,
  roas: 4.2,
  clientesAtivos: 3,
};

export const mockGastoTimeline: ChartDataPoint[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    value: Math.floor(Math.random() * 800) + 600,
  };
});

export const mockReceitaMensal: ChartDataPoint[] = [
  { date: 'Jul', value: 8500 },
  { date: 'Ago', value: 9200 },
  { date: 'Set', value: 10500 },
  { date: 'Out', value: 10200 },
  { date: 'Nov', value: 11200 },
  { date: 'Dez', value: 11200 },
];

export const mockFinancialGoals: FinancialGoal[] = [
  {
    id: 'goal1',
    mes: 'Dezembro 2024',
    metaClientes: 5,
    metaReceita: 15000,
    clientesAtingidos: 3,
    receitaAtingida: 11200,
  },
];

export const getClientById = (id: string) => mockClients.find(c => c.id === id);
export const getAdAccountsByClient = (clientId: string) => mockAdAccounts.filter(a => a.clientId === clientId);
export const getCampaignsByClient = (clientId: string) => mockCampaigns.filter(c => c.clientId === clientId);
export const getCampaignsByAdAccount = (adAccountId: string) => mockCampaigns.filter(c => c.adAccountId === adAccountId);
