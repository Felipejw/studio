
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PlusCircle, FileText, ScanLine, AlertTriangle, TrendingUp, Smile, BarChart, Loader2, DollarSign, Percent, Lightbulb, LineChartIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { ResponsiveContainer, LineChart as RechartsLineChart, XAxis, YAxis, Tooltip as RechartsTooltip, Line as RechartsLine, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';


const initialWeeklyPLData = [
  { day: 'Dom', pl: 0 },
  { day: 'Seg', pl: 0 },
  { day: 'Ter', pl: 0 },
  { day: 'Qua', pl: 0 },
  { day: 'Qui', pl: 0 },
  { day: 'Sex', pl: 0 },
  { day: 'Sáb', pl: 0 },
];

const chartConfig = {
  pl: {
    label: "P/L",
    color: "hsl(var(--chart-1))", // Changed from primary to chart-1
  },
} satisfies ChartConfig;


export default function DashboardPage() {
  const { user } = useAuth();

  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [dailyPlanExists, setDailyPlanExists] = useState<boolean | null>(null);
  const [tradesToday, setTradesToday] = useState(0);
  const [profitOrLoss, setProfitOrLoss] = useState(0);
  const [averageEmotion, setAverageEmotion] = useState<string | null>(null);
  
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);
  const [lossLimitReached, setLossLimitReached] = useState(false);
  const [tradingOutsideHours, setTradingOutsideHours] = useState(false);

  const [isLoadingPerformance, setIsLoadingPerformance] = useState(true);
  const [winRate, setWinRate] = useState(0);
  const [avgRiskReward, setAvgRiskReward] = useState<string>("N/A");
  const [weeklyPLData, setWeeklyPLData] = useState(initialWeeklyPLData);


  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      setIsLoadingSummary(true);
      setIsLoadingAlerts(true);
      setIsLoadingPerformance(true);
      try {
        // TODO: Replace with actual data fetching logic from Firestore
        
        setDailyPlanExists(false); 
        setTradesToday(0); 
        setProfitOrLoss(0.00); 
        setAverageEmotion("N/A"); 
        
        setLossLimitReached(false); 
        setTradingOutsideHours(false); 

        setWinRate(0); 
        setAvgRiskReward("0:0"); 
        setWeeklyPLData(initialWeeklyPLData);


      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setDailyPlanExists(false);
        setTradesToday(0);
        setProfitOrLoss(0.00);
        setAverageEmotion("Erro");
        setWinRate(0);
        setAvgRiskReward("Erro");
        setWeeklyPLData(initialWeeklyPLData);
      } finally {
        setIsLoadingSummary(false);
        setIsLoadingAlerts(false);
        setIsLoadingPerformance(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (!user) return null;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 font-headline">Dashboard Principal</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Resumo do Dia */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-headline">Resumo do Dia</CardTitle>
            <CardDescription>Seu desempenho e estado emocional de hoje.</CardDescription>
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
                  <Alert variant="default" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Plano Diário Pendente</AlertTitle>
                    <AlertDescription>
                      Você ainda não registrou seu Plano Diário para hoje.{' '}
                      <Link href="/daily-plan" className="font-semibold text-primary hover:underline">
                        Criar plano agora
                      </Link>
                    </AlertDescription>
                  </Alert>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Trades Hoje</CardTitle>
                      <BarChart className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{tradesToday}</div>
                      <p className="text-xs text-muted-foreground">Operações realizadas</p>
                    </CardContent>
                  </Card>
                  <Card className="p-4">
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">P/L do Dia</CardTitle>
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${profitOrLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        R$ {profitOrLoss.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground">Resultado financeiro</p>
                    </CardContent>
                  </Card>
                  <Card className="p-4">
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Emoção Média</CardTitle>
                      <Smile className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{averageEmotion || 'N/A'}</div>
                      <p className="text-xs text-muted-foreground">Registro no Psicólogo IA</p>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Desempenho Recente */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline">Desempenho Recente</CardTitle>
            <CardDescription>Métricas e evolução do seu P/L nos últimos 7 dias.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoadingPerformance ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3">Carregando desempenho...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-card rounded-lg border">
                        <Percent className="h-6 w-6 mx-auto mb-1 text-primary" />
                        <p className="text-sm text-muted-foreground">Taxa de Acerto</p>
                        <p className="text-xl font-semibold">{winRate}%</p>
                    </div>
                    <div className="p-3 bg-card rounded-lg border">
                        <TrendingUp className="h-6 w-6 mx-auto mb-1 text-primary" />
                        <p className="text-sm text-muted-foreground">R/R Médio</p>
                        <p className="text-xl font-semibold">{avgRiskReward}</p>
                    </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">P/L nos Últimos 7 Dias (R$)</h4>
                  <ChartContainer config={chartConfig} className="h-[200px] w-full">
                    <RechartsLineChart accessibilityLayer data={weeklyPLData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} />
                      <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                      <RechartsTooltip 
                        cursor={false}
                        content={<ChartTooltipContent indicator="line" />} 
                      />
                      <RechartsLine dataKey="pl" type="monotone" stroke="var(--color-pl)" strokeWidth={2} dot={{ r: 4, fill: "var(--color-pl)" }} />
                    </RechartsLineChart>
                  </ChartContainer>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Acesso Rápido */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-headline">Acesso Rápido</CardTitle>
            <CardDescription>Principais ações da plataforma.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button asChild variant="outline" className="h-auto py-3 text-xs sm:text-sm">
              <Link href="/trade-log" className="flex flex-col items-center text-center">
                <PlusCircle className="h-6 w-6 mb-1" />
                <span>Novo Trade</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-3 text-xs sm:text-sm">
              <Link href="/daily-plan" className="flex flex-col items-center text-center">
                <FileText className="h-6 w-6 mb-1" />
                <span>Plano Diário</span>
              </Link>
            </Button>
             <Button asChild variant="outline" className="h-auto py-3 text-xs sm:text-sm">
              <Link href="/market-overview" className="flex flex-col items-center text-center">
                <LineChartIcon className="h-6 w-6 mb-1" /> 
                <span>Mercado</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-3 text-xs sm:text-sm">
              <Link href="/print-analysis" className="flex flex-col items-center text-center">
                <ScanLine className="h-6 w-6 mb-1" />
                <span>Análise Print</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Alertas do Sistema */}
        <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-headline">Alertas do Sistema</CardTitle>
              <CardDescription>Notificações importantes sobre sua operação.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingAlerts ? (
                 <div className="flex items-center justify-center py-5">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="ml-3 text-sm">Carregando alertas...</p>
                  </div>
              ) : (
                <>
                  {!lossLimitReached && !tradingOutsideHours && (
                    <p className="text-sm text-muted-foreground">Nenhum alerta ativo no momento. Mantenha o foco!</p>
                  )}
                  {lossLimitReached && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Limite de Perda Atingido!</AlertTitle>
                      <AlertDescription>
                        Você atingiu seu limite de perda diário. Considere parar por hoje e revisar suas operações.
                      </AlertDescription>
                    </Alert>
                  )}
                  {tradingOutsideHours && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Operando Fora do Horário!</AlertTitle>
                      <AlertDescription>
                        Você está operando fora do horário planejado. Mantenha a disciplina e siga seu plano.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Dica do Dia / Foco Mental */}
          <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle className="font-headline flex items-center"><Lightbulb className="mr-2 h-5 w-5 text-accent"/>Foco Mental</CardTitle>
                <CardDescription>Lembrete para o seu dia.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm leading-relaxed">
                    "A disciplina é a ponte entre metas e realizações. Mantenha-se fiel ao seu plano, mesmo quando for difícil. Pequenas vitórias consistentes constroem grandes resultados."
                </p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

    