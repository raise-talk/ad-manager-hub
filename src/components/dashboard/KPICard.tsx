import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
  };
  subtitle?: string;
  className?: string;
}

export function KPICard({
  title,
  value,
  icon: Icon,
  change,
  subtitle,
  className,
}: KPICardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {change && (
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    'text-xs font-medium',
                    change.trend === 'up' && 'text-success',
                    change.trend === 'down' && 'text-destructive',
                    change.trend === 'neutral' && 'text-muted-foreground'
                  )}
                >
                  {change.trend === 'up' && '+'}
                  {change.value}%
                </span>
                <span className="text-xs text-muted-foreground">vs mês anterior</span>
              </div>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
