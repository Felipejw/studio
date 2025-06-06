'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PlusCircle, FileText, ScanLine, AlertTriangle, TrendingUp, Smile, BarChart } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
  // Mock data - replace with actual data fetching and state management
  const [dailyPlanExists, setDailyPlanExists] = useState(false);
  const [tradesToday, setTradesToday] = useState(0);
  const [profitOrLoss, setProfitOrLoss] = useState(0);
  const [averageEmotion, setAverageEmotion] = useState<string | null>(null);
  const [lossLimitReached, setLossLimitReached] = useState(false);
  const [tradingOutsideHours, setTradingOutsideHours] = useState(false);

  useEffect(() => {
    // Simulate fetching data
    setDailyPlanExists(Math.random() > 0.5);
    setTradesToday(Math.floor(Math.random() * 10));
    setProfitOrLoss(Math.random() * 200 - 100); // Random P/L between -100 and 100
    const emotions = ['Feliz', 'Neutro', 'Ansioso'];
    setAverageEmotion(emotions[Math.floor(Math.random() * emotions.length)]);
    setLossLimitReached(Math.random() > 0.8);
    setTradingOutsideHours(Math.random() > 0.7);
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 font-headline">Dashboard Principal</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Resumo do Dia */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-headline">Resumo do Dia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!dailyPlanExists && (
              <Alert variant="default">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Plano Diário</AlertTitle>
                <AlertDescription>
                  Você já registrou seu Plano Diário?{' '}
                  <Link href="/daily-plan" className="font-semibold text-primary hover:underline">
                    Criar plano
                  </Link>
                </AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-card rounded-lg border">
                <BarChart className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Trades Hoje</p>
                <p className="text-2xl font-semibold">{tradesToday}</p>
              </div>
              <div className="p-4 bg-card rounded-lg border">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">P/L do Dia</p>
                <p className={`text-2xl font-semibold ${profitOrLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {profitOrLoss.toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-card rounded-lg border">
                <Smile className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Emoção Média</p>
                <p className="text-2xl font-semibold">{averageEmotion || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Acesso Rápido */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Acesso Rápido</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button asChild variant="outline" className="h-auto py-3">
              <Link href="/trade-log" className="flex flex-col items-center text-center">
                <PlusCircle className="h-8 w-8 mb-1" />
                <span>Novo Trade</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-3">
              <Link href="/daily-plan" className="flex flex-col items-center text-center">
                <FileText className="h-8 w-8 mb-1" />
                <span>Novo Plano Diário</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-3">
              <Link href="/print-analysis" className="flex flex-col items-center text-center">
                <ScanLine className="h-8 w-8 mb-1" />
                <span>Análise de Print</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Alertas do Sistema */}
        {(lossLimitReached || tradingOutsideHours) && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="font-headline">Alertas do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {lossLimitReached && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Limite de Perda Atingido!</AlertTitle>
                  <AlertDescription>
                    Você atingiu seu limite de perda diário. Considere parar por hoje.
                  </AlertDescription>
                </Alert>
              )}
              {tradingOutsideHours && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Operando Fora do Horário!</AlertTitle>
                  <AlertDescription>
                    Você está operando fora do horário planejado. Mantenha a disciplina.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
