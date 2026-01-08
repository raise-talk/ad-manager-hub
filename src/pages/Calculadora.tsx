"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowUpRight, Calculator, Info, Percent, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";

const presetTargets = [200, 500, 800, 1200, 2000];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

const round2 = (value: number) =>
  Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;

const sanitizeNumber = (value: string) => {
  if (!value) return 0;
  const normalized = value.replace(",", ".").replace(/[^0-9.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function Calculadora() {
  const [desiredNet, setDesiredNet] = useState("");
  const [manualGross, setManualGross] = useState("");
  const [issRate, setIssRate] = useState("2.9");
  const [pisRate, setPisRate] = useState("9.25");

  const netValue = sanitizeNumber(desiredNet);
  const iss = sanitizeNumber(issRate);
  const pis = sanitizeNumber(pisRate);
  const totalRate = Math.max(0, iss + pis);
  const rateDecimal = totalRate / 100;

  const canCalculate = rateDecimal < 1 && netValue > 0;

  const recommendedGross = useMemo(() => {
    if (!canCalculate) return 0;
    return round2(netValue / (1 - rateDecimal));
  }, [canCalculate, netValue, rateDecimal]);

  const breakdown = useMemo(() => {
    const gross = recommendedGross;
    const issAmount = round2(gross * (iss / 100));
    const pisAmount = round2(gross * (pis / 100));
    const taxes = round2(issAmount + pisAmount);
    const net = round2(gross - taxes);
    return { gross, net, issAmount, pisAmount, taxes };
  }, [iss, pis, recommendedGross]);

  const manualBreakdown = useMemo(() => {
    const gross = sanitizeNumber(manualGross);
    if (gross <= 0) return null;
    const issAmount = round2(gross * (iss / 100));
    const pisAmount = round2(gross * (pis / 100));
    const taxes = round2(issAmount + pisAmount);
    const net = round2(gross - taxes);
    return { gross: round2(gross), net, issAmount, pisAmount, taxes };
  }, [iss, manualGross, pis]);

  const totalRateLabel = `${totalRate.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Calculadora de Fundos
            </h1>
            <p className="text-muted-foreground">
              Saiba quanto precisa adicionar para ter o saldo líquido desejado
              depois dos impostos retidos pela Meta.
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            Taxas padrão • ISS 2,9% + PIS/COFINS 9,25%
          </Badge>
        </div>

        {/* Hero */}
        <Card className="border-primary/15 bg-gradient-to-r from-primary/10 via-background to-background shadow-lg">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Calculator className="h-4 w-4" />
                Simulação em tempo real
              </div>
              <CardTitle className="text-2xl">
                Para receber {formatCurrency(netValue || 0)}
              </CardTitle>
              <CardDescription className="max-w-2xl">
                Considerando impostos estimados de {totalRateLabel}, esta
                calculadora mostra quanto deve ser depositado para chegar ao
                valor final de saldo.
              </CardDescription>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-background/70 px-5 py-4 shadow-sm text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Total a adicionar
              </p>
              <p className="text-3xl font-bold">
                {formatCurrency(breakdown.gross)}
              </p>
              <p className="text-sm text-muted-foreground">
                Impostos estimados: {formatCurrency(breakdown.taxes)}
              </p>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Monte sua simulação</CardTitle>
                  <CardDescription>
                    Ajuste o saldo que deseja ter e as taxas cobradas para ver o
                    valor exato a ser adicionado.
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Taxa total {totalRateLabel}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Saldo líquido desejado</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={desiredNet}
                    onChange={(event) => setDesiredNet(event.target.value)}
                    placeholder="Ex: 800"
                  />
                  <div className="flex flex-wrap gap-2">
                    {presetTargets.map((preset) => (
                      <Button
                        key={preset}
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => setDesiredNet(String(preset))}
                      >
                        {formatCurrency(preset)}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Valor que pretende adicionar (opcional)</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={manualGross}
                    onChange={(event) => setManualGross(event.target.value)}
                    placeholder="Ex: 1000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use este campo para ver quanto de saldo sobra a partir de um
                    valor específico que você já pretende colocar.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="iss">ISS (%)</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          Alíquota padrão da Meta para ISS. Ajuste se sua nota
                          fiscal tiver outra retenção.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="iss"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={issRate}
                    onChange={(event) => setIssRate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="pis">PIS/COFINS (%)</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          Imposto federal estimado aplicado pela plataforma
                          sobre a adição de fundos.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="pis"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={pisRate}
                    onChange={(event) => setPisRate(event.target.value)}
                  />
                </div>
              </div>

              {!canCalculate && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  Defina um saldo desejado maior que zero e mantenha as taxas
                  abaixo de 100% para gerar a simulação.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick result */}
          <Card className="relative overflow-hidden">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/15" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" />
                Resultado rápido
              </CardTitle>
              <CardDescription>
                Veja o valor bruto necessário e os impostos estimados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative">
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Valor bruto necessário
                </p>
                <p className="text-3xl font-bold">
                  {formatCurrency(breakdown.gross)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Para chegar em {formatCurrency(netValue || 0)} líquidos.
                </p>
              </div>

              <div className="space-y-2 rounded-xl border bg-muted/50 px-4 py-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Subtotal (saldo líquido)</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(breakdown.net)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    ISS (
                    {iss.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                    %)
                  </span>
                  <span>{formatCurrency(breakdown.issAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    PIS/COFINS (
                    {pis.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                    %)
                  </span>
                  <span>{formatCurrency(breakdown.pisAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Impostos totais</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(breakdown.taxes)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
                  <span>Você adiciona</span>
                  <span>{formatCurrency(breakdown.gross)}</span>
                </div>
              </div>

              {manualBreakdown && (
                <div className="rounded-xl border border-border px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Se você adicionar{" "}
                        {formatCurrency(manualBreakdown.gross)}
                      </p>
                      <p className="text-lg font-semibold">
                        Saldo estimado: {formatCurrency(manualBreakdown.net)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      Simulação direta
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Impostos estimados: {formatCurrency(manualBreakdown.taxes)}{" "}
                    ({totalRateLabel})
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
