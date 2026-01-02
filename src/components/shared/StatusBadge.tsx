import type { ClientStatus, CampaignStatus, AlertSeverity, AlertStatus, CampaignObjective } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusStyles = {
  ativo: 'bg-success/15 text-success border-success/30',
  pausado: 'bg-warning/15 text-warning border-warning/30',
  arquivado: 'bg-muted text-muted-foreground border-muted',
  encerrado: 'bg-muted text-muted-foreground border-muted',
  em_revisao: 'bg-info/15 text-info border-info/30',
  erro: 'bg-destructive/15 text-destructive border-destructive/30',
};

const severityStyles = {
  info: 'bg-info/15 text-info border-info/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  critical: 'bg-destructive/15 text-destructive border-destructive/30',
};

const alertStatusStyles = {
  novo: 'bg-primary/15 text-primary border-primary/30',
  lido: 'bg-muted text-muted-foreground border-muted',
  resolvido: 'bg-success/15 text-success border-success/30',
};

const objectiveLabels: Record<CampaignObjective, string> = {
  leads: 'Leads',
  conversoes: 'Conversões',
  trafego: 'Tráfego',
  alcance: 'Alcance',
  engajamento: 'Engajamento',
};

const statusLabels: Record<string, string> = {
  ativo: 'Ativo',
  pausado: 'Pausado',
  arquivado: 'Arquivado',
  encerrado: 'Encerrado',
  em_revisao: 'Em Revisão',
  erro: 'Erro',
  novo: 'Novo',
  lido: 'Lido',
  resolvido: 'Resolvido',
};

interface StatusBadgeProps {
  status: ClientStatus | CampaignStatus | AlertStatus | 'erro';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium capitalize border',
        statusStyles[status] || alertStatusStyles[status as AlertStatus],
        className
      )}
    >
      {statusLabels[status] || status}
    </Badge>
  );
}

interface SeverityBadgeProps {
  severity: AlertSeverity;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const labels = { info: 'Info', warning: 'Atenção', critical: 'Crítico' };
  return (
    <Badge
      variant="outline"
      className={cn('font-medium capitalize border', severityStyles[severity], className)}
    >
      {labels[severity]}
    </Badge>
  );
}

interface ObjectiveBadgeProps {
  objective: CampaignObjective;
  className?: string;
}

export function ObjectiveBadge({ objective, className }: ObjectiveBadgeProps) {
  return (
    <Badge variant="secondary" className={cn('font-medium', className)}>
      {objectiveLabels[objective]}
    </Badge>
  );
}
