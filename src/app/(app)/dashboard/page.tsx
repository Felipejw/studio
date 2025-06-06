
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PlusCircle, FileText, ScanLine, AlertTriangle, TrendingUp, Smile, BarChart, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
// TODO: Import functions to fetch real data from Firestore

export default function DashboardPage() {
  const { user } = useAuth();

  // States for real data - initialized to default/loading values
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [dailyPlanExists, setDailyPlanExists] = useState<boolean | null>(null);
  const [tradesToday, setTradesToday] = useState(0);
  const [profitOrLoss, setProfitOrLoss] = useState(0);
  const [averageEmotion, setAverageEmotion] = useState<string | null>(null);
  
  // States for alerts - these might still be derived or fetched
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);
  const [lossLimitReached, setLossLimitReached] = useState(false);
  const [tradingOutsideHours, setTradingOutsideHours] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Simulate fetching summary data
    // TODO: Replace with actual data fetching logic from Firestore
    const fetchDashboardData = async () => {
      setIsLoadingSummary(true);
      setIsLoadingAlerts(true);
      try {
        // Placeholder for fetching daily plan status
        // Example: const plan = await getDailyPlanStatus(user.uid); setDailyPlanExists(!!plan);
        setDailyPlanExists(false); // Default to false until implemented

        // Placeholder for fetching trades summary
        // Example: const summary = await getTradesSummary(user.uid);
        // setTradesToday(summary.count);
        // setProfitOrLoss(summary.totalPL);
        // setAverageEmotion(summary.avgEmotion);
        setTradesToday(0);
        setProfitOrLoss(0.00);
        setAverageEmotion("N/A");
        
        // Placeholder for fetching alert conditions
        // Example: const alerts = await getUserAlertConditions(user.uid);
        // setLossLimitReached(alerts.lossLimit);
        // setTradingOutsideHours(alerts.tradingHours);
        setLossLimitReached(false);
        setTradingOutsideHours(false);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Set to default error states or show toast
        setDailyPlanExists(false);
        setTradesToday(0);
        setProfitOrLoss(0.00);
        setAverageEmotion("Erro");
      } finally {
        setIsLoadingSummary(false);
        setIsLoadingAlerts(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (!user) return null; // Should be handled by AppLayout, but good practice

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
            {isLoadingSummary ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3">Carregando resumo...</p>
              </div>
            ) : (
              <>
                {dailyPlanExists === false && (
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
              </>
            )}
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
              <Link href="/market-overview" className="flex flex-col items-center text-center">
                <TrendingUp className="h-8 w-8 mb-1" /> {/* Icon Changed */}
                <span>Painel Mercado</span>
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
        <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="font-headline">Alertas do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoadingAlerts ? (
                 <div className="flex items-center justify-center py-5">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="ml-3 text-sm">Carregando alertas...</p>
                  </div>
              ) : (
                <>
                  {!lossLimitReached && !tradingOutsideHours && (
                    <p className="text-sm text-muted-foreground">Nenhum alerta ativo no momento.</p>
                  )}
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
                </>
              )}
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
