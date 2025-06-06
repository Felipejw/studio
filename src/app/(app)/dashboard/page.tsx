
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
  { day: 'Seg', pl: 20 },
  { day: 'Ter', pl: -10 },
  { day: 'Qua', pl: 50 },
  { day: 'Qui', pl: 30 },
  { day: 'Sex', pl: -5 },
  { day: 'Sáb', pl: 0 },
];

const chartConfig = {
  pl: {
    label: "P/L",
    color: "hsl(var(--chart-1))", 
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
        // Simulate data fetching
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setDailyPlanExists(false); 
        setTradesToday(5); 
        setProfitOrLoss(125.70); 
        setAverageEmotion("7/10"); 
        
        setLossLimitReached(false); 
        setTradingOutsideHours(false); 

        setWinRate(60); 
        setAvgRiskReward("2.5:1"); 
        setWeeklyPLData(initialWeeklyPLData);


      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setDailyPlanExists(false);
        setTradesToday(0);
        setProfitOrLoss(0.00);
        setAverageEmotion("Erro");
        setWinRate(0);
        setAvgRiskReward("Erro");
        setWeeklyPLData(initialWeeklyPLData.map(d => ({...d, pl:0}))); // Zero out chart on error
      } finally {
        setIsLoadingSummary(false);
        setIsLoadingAlerts(false);
        setIsLoadingPerformance(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (!user) return null;

  const StatCard = ({ title, value, icon, description, isLoading, valueColor }: { title: string; value: string | number; icon: React.ReactNode; description: string; isLoading: boolean; valueColor?: string }) => (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : (
          <>
            <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 font-headline">Painel de Controle</h1>

      {/* Resumo do Dia */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 font-headline">Resumo do Dia</h2>
        {isLoadingSummary ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1,2,3].map(i => <StatCard key={i} title="Carregando..." value="" icon={<Loader2 className="h-5 w-5 animate-spin text-muted-foreground"/>} description="..." isLoading={true}/>)}
          </div>
        ) : (
          <>
            {dailyPlanExists === false && (
              <Alert variant="default" className="mb-4 shadow-sm">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="font-semibold">Plano Diário Pendente</AlertTitle>
                <AlertDescription>
                  Você ainda não registrou seu Plano Diário para hoje.{' '}
                  <Link href="/daily-plan" className="font-semibold text-primary hover:underline">
                    Criar plano agora
                  </Link>
                </AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard title="Trades Hoje" value={tradesToday} icon={<BarChart className="h-5 w-5 text-muted-foreground" />} description="Operações realizadas" isLoading={isLoadingSummary} />
              <StatCard title="P/L do Dia" value={`R$ ${profitOrLoss.toFixed(2)}`} icon={<DollarSign className="h-5 w-5 text-muted-foreground" />} description="Resultado financeiro" isLoading={isLoadingSummary} valueColor={profitOrLoss >= 0 ? 'text-green-600' : 'text-red-600'}/>
              <StatCard title="Emoção Média" value={averageEmotion || 'N/A'} icon={<Smile className="h-5 w-5 text-muted-foreground" />} description="Psicólogo IA" isLoading={isLoadingSummary} />
            </div>
          </>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Desempenho Recente */}
        <Card className="md:col-span-2 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Desempenho Recente</CardTitle>
            <CardDescription className="text-sm">Métricas e P/L dos últimos 7 dias.</CardDescription>
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
                        <Percent className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="text-xs text-muted-foreground">Taxa de Acerto</p>
                        <p className="text-lg font-semibold">{winRate}%</p>
                    </div>
                    <div className="p-3 bg-card rounded-lg border">
                        <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="text-xs text-muted-foreground">R/R Médio</p>
                        <p className="text-lg font-semibold">{avgRiskReward}</p>
                    </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2 text-center md:text-left">P/L Semanal (R$)</h4>
                  <ChartContainer config={chartConfig} className="h-[200px] w-full">
                    <RechartsLineChart accessibilityLayer data={weeklyPLData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} />
                      <YAxis tickLine={false} axisLine={false} tickMargin={8} width={40}/>
                      <RechartsTooltip 
                        cursor={true}
                        content={<ChartTooltipContent indicator="line" />} 
                      />
                      <RechartsLine dataKey="pl" type="monotone" stroke="var(--color-pl)" strokeWidth={2.5} dot={{ r: 5, fill: "var(--color-pl)", strokeWidth:1, stroke: "hsl(var(--background))" }} activeDot={{r: 7, strokeWidth: 2}} />
                    </RechartsLineChart>
                  </ChartContainer>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Acesso Rápido */}
        <Card className="md:col-span-1 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Acesso Rápido</CardTitle>
            <CardDescription className="text-sm">Principais ferramentas.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button asChild variant="outline" className="h-auto py-3 text-xs sm:text-sm flex-col items-center text-center hover:bg-primary/10">
              <Link href="/trade-log">
                <PlusCircle className="h-5 w-5 mb-1" />
                <span>Novo Trade</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-3 text-xs sm:text-sm flex-col items-center text-center hover:bg-primary/10">
              <Link href="/daily-plan">
                <FileText className="h-5 w-5 mb-1" />
                <span>Plano Diário</span>
              </Link>
            </Button>
             <Button asChild variant="outline" className="h-auto py-3 text-xs sm:text-sm flex-col items-center text-center hover:bg-primary/10">
              <Link href="/market-overview">
                <LineChartIcon className="h-5 w-5 mb-1" /> 
                <span>Mercado</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-3 text-xs sm:text-sm flex-col items-center text-center hover:bg-primary/10">
              <Link href="/print-analysis">
                <ScanLine className="h-5 w-5 mb-1" />
                <span>Análise Print</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mt-6">
        {/* Alertas do Sistema */}
        <Card className="md:col-span-2 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Alertas do Sistema</CardTitle>
              <CardDescription className="text-sm">Notificações importantes.</CardDescription>
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
                    <p className="text-sm text-muted-foreground">Nenhum alerta ativo. Mantenha o foco!</p>
                  )}
                  {lossLimitReached && (
                    <Alert variant="destructive" className="shadow-sm">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Limite de Perda Atingido!</AlertTitle>
                      <AlertDescription>
                        Você atingiu seu limite de perda diário. Considere parar e revisar.
                      </AlertDescription>
                    </Alert>
                  )}
                  {tradingOutsideHours && (
                    <Alert variant="destructive" className="shadow-sm">
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

          {/* Dica do Dia / Foco Mental */}
          <Card className="md:col-span-1 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center"><Lightbulb className="mr-2 h-5 w-5 text-accent"/>Foco Mental</CardTitle>
                <CardDescription className="text-sm">Lembrete para seu dia.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm leading-relaxed text-foreground/90">
                    "A disciplina é a ponte entre metas e realizações. Mantenha-se fiel ao seu plano, mesmo quando for difícil. Pequenas vitórias consistentes constroem grandes resultados."
                </p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
