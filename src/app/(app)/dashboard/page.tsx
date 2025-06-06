
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PlusCircle, FileText, ScanLine, AlertTriangle, TrendingUp, Smile, BarChart, Loader2, DollarSign, Percent, Lightbulb, LineChartIcon } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/auth-provider';
import { ResponsiveContainer, LineChart as RechartsLineChart, XAxis, YAxis, Tooltip as RechartsTooltip, Line as RechartsLine, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { db, collection, query, where, orderBy, getDocs, Timestamp, doc, getDoc, type Firestore } from '@/lib/firebase';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, eachDayOfInterval, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TradeEntryFirestore {
  userId: string;
  date: Timestamp; 
  asset: string;
  type: 'compra' | 'venda';
  result: 'gain' | 'loss' | 'zero';
  profit: number; 
  period: 'manhã' | 'tarde' | 'noite';
  setup?: string;
  emotionBefore: number;
  emotionAfter: number;
  comment?: string;
}

interface TradeEntry extends Omit<TradeEntryFirestore, 'date'> {
  id: string;
  date: Date; 
}

interface RiskSettings {
  availableCapital: number;
  riskPerTradePercent: number;
  dailyProfitTarget: number;
  dailyLossLimit: number;
  userId: string;
  updatedAt: Date;
}


const initialWeeklyPLDataTemplate = [
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
    color: "hsl(var(--chart-1))", 
  },
} satisfies ChartConfig;


export default function DashboardPage() {
  const { user, userId } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [dailyPlanExists, setDailyPlanExists] = useState<boolean | null>(null); // Placeholder
  
  const [tradesTodayCount, setTradesTodayCount] = useState(0);
  const [profitOrLossToday, setProfitOrLossToday] = useState(0);
  const [averageEmotionToday, setAverageEmotionToday] = useState<string | null>(null);
  
  const [lossLimitReached, setLossLimitReached] = useState(false);
  const [tradingOutsideHours, setTradingOutsideHours] = useState(false); // Placeholder

  const [winRate, setWinRate] = useState(0);
  const [avgRiskReward, setAvgRiskReward] = useState<string>("N/A");
  const [weeklyPLData, setWeeklyPLData] = useState(initialWeeklyPLDataTemplate);
  const [riskSettings, setRiskSettings] = useState<RiskSettings | null>(null);


  useEffect(() => {
    if (!userId) {
        setIsLoading(false);
        // Reset states if no user
        setTradesTodayCount(0);
        setProfitOrLossToday(0);
        setAverageEmotionToday("N/A");
        setWinRate(0);
        setAvgRiskReward("N/A");
        setWeeklyPLData(initialWeeklyPLDataTemplate);
        setLossLimitReached(false);
        setRiskSettings(null);
        return;
    }

    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch trades from the last 7 days for weekly chart and performance metrics
        const today = new Date();
        const weekStartDate = startOfWeek(today, { locale: ptBR });
        const sevenDaysAgo = subDays(weekStartDate, 1); // Fetch a bit more for full week context if needed, or adjust to exact week start
        
        const tradesQuery = query(
          collection(db, "trades"),
          where("userId", "==", userId),
          where("date", ">=", Timestamp.fromDate(sevenDaysAgo)),
          orderBy("date", "desc")
        );
        const tradesSnapshot = await getDocs(tradesQuery);
        const fetchedTrades: TradeEntry[] = [];
        tradesSnapshot.forEach((docSnap) => {
            const data = docSnap.data() as Partial<TradeEntryFirestore>;
            if (data.date && typeof (data.date as any).toDate === 'function') {
                 fetchedTrades.push({ 
                    ...(data as TradeEntryFirestore), 
                    id: docSnap.id,
                    date: (data.date as Timestamp).toDate() 
                } as TradeEntry);
            }
        });

        // Fetch risk settings
        const riskDocRef = doc(db, "risk_config", userId);
        const riskDocSnap = await getDoc(riskDocRef);
        if (riskDocSnap.exists()) {
            setRiskSettings(riskDocSnap.data() as RiskSettings);
        } else {
            setRiskSettings(null); // No specific risk settings found
        }

        // Process trades for "Today"
        const startOfToday = startOfDay(today);
        const endOfToday = endOfDay(today);
        const tradesForToday = fetchedTrades.filter(trade => trade.date >= startOfToday && trade.date <= endOfToday);

        setTradesTodayCount(tradesForToday.length);
        const plToday = tradesForToday.reduce((sum, trade) => sum + trade.profit, 0);
        setProfitOrLossToday(plToday);

        if (tradesForToday.length > 0) {
            const sumEmotionAfter = tradesForToday.reduce((sum, trade) => sum + trade.emotionAfter, 0);
            setAverageEmotionToday(`${(sumEmotionAfter / tradesForToday.length).toFixed(1)}/10`);
        } else {
            setAverageEmotionToday("N/A");
        }

        // Process trades for "Weekly P/L Chart"
        const currentWeekDays = eachDayOfInterval({ start: weekStartDate, end: endOfWeek(today, { locale: ptBR }) });
        const newWeeklyPLData = currentWeekDays.map(dayDate => {
            const dayKey = format(dayDate, 'EEE', { locale: ptBR });
            const tradesOnThisDay = fetchedTrades.filter(trade => 
                trade.date >= startOfDay(dayDate) && trade.date <= endOfDay(dayDate)
            );
            const totalPL = tradesOnThisDay.reduce((sum, trade) => sum + trade.profit, 0);
            return { day: dayKey.charAt(0).toUpperCase() + dayKey.slice(1), pl: totalPL };
        });
        setWeeklyPLData(newWeeklyPLData);
        
        // Process trades for "Performance Metrics" (using last 7 days of trades)
        const relevantTradesForMetrics = fetchedTrades; // Use all fetched trades for metrics

        const winningTrades = relevantTradesForMetrics.filter(t => t.profit > 0);
        const losingTrades = relevantTradesForMetrics.filter(t => t.profit < 0);

        if (relevantTradesForMetrics.length > 0) {
            setWinRate((winningTrades.length / relevantTradesForMetrics.length) * 100);
        } else {
            setWinRate(0);
        }

        const totalWinAmount = winningTrades.reduce((sum, t) => sum + t.profit, 0);
        const totalLossAmount = losingTrades.reduce((sum, t) => sum + Math.abs(t.profit), 0);
        const avgWin = winningTrades.length > 0 ? totalWinAmount / winningTrades.length : 0;
        const avgLoss = losingTrades.length > 0 ? totalLossAmount / losingTrades.length : 0;
        
        if (avgLoss > 0) {
            setAvgRiskReward(`${(avgWin / avgLoss).toFixed(2)}:1`);
        } else if (avgWin > 0) {
            setAvgRiskReward("Inf:1"); // All wins or no losses
        }
         else {
            setAvgRiskReward("N/A");
        }
        
        // Placeholder for daily plan
        setDailyPlanExists(false); 
        // Placeholder for trading outside hours
        setTradingOutsideHours(false);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Reset to defaults on error
        setTradesTodayCount(0);
        setProfitOrLossToday(0);
        setAverageEmotionToday("Erro");
        setWinRate(0);
        setAvgRiskReward("Erro");
        setWeeklyPLData(initialWeeklyPLDataTemplate);
        setLossLimitReached(false);
        setRiskSettings(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId]);

  // Effect for lossLimitReached, dependent on profitOrLossToday and riskSettings
  useEffect(() => {
    if (riskSettings && profitOrLossToday < 0 && Math.abs(profitOrLossToday) >= riskSettings.dailyLossLimit) {
        setLossLimitReached(true);
    } else {
        setLossLimitReached(false);
    }
  }, [profitOrLossToday, riskSettings]);


  if (!user && !isLoading) return (
    <div className="container mx-auto py-8 text-center">
        <p>Por favor, faça login para ver o dashboard.</p>
        <Button asChild className="mt-4"><Link href="/login">Login</Link></Button>
    </div>
  );
   if (!user && isLoading) return ( // Still loading auth state
     <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
     </div>
   );


  const StatCard = ({ title, value, icon, description, isLoadingCard, valueColor }: { title: string; value: string | number; icon: React.ReactNode; description: string; isLoadingCard: boolean; valueColor?: string }) => (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoadingCard ? (
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
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1,2,3].map(i => <StatCard key={i} title="Carregando..." value="" icon={<Loader2 className="h-5 w-5 animate-spin text-muted-foreground"/>} description="..." isLoadingCard={true}/>)}
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
              <StatCard title="Trades Hoje" value={tradesTodayCount} icon={<BarChart className="h-5 w-5 text-muted-foreground" />} description="Operações realizadas" isLoadingCard={isLoading} />
              <StatCard title="P/L do Dia" value={`R$ ${profitOrLossToday.toFixed(2)}`} icon={<DollarSign className="h-5 w-5 text-muted-foreground" />} description="Resultado financeiro" isLoadingCard={isLoading} valueColor={profitOrLossToday >= 0 ? 'text-green-600' : 'text-red-600'}/>
              <StatCard title="Emoção Média Hoje" value={averageEmotionToday || 'N/A'} icon={<Smile className="h-5 w-5 text-muted-foreground" />} description="Após trades (0-10)" isLoadingCard={isLoading} />
            </div>
          </>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Desempenho Recente */}
        <Card className="md:col-span-2 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Desempenho Semanal</CardTitle>
            <CardDescription className="text-sm">Métricas e P/L da semana atual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
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
                        <p className="text-lg font-semibold">{winRate.toFixed(1)}%</p>
                    </div>
                    <div className="p-3 bg-card rounded-lg border">
                        <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="text-xs text-muted-foreground">R/R Médio</p>
                        <p className="text-lg font-semibold">{avgRiskReward}</p>
                    </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2 text-center md:text-left">P/L Semanal (R$)</h4>
                  {weeklyPLData.reduce((sum, item) => sum + item.pl, 0) === 0 && weeklyPLData.every(item => item.pl === 0) ? (
                     <p className="text-center text-muted-foreground py-10">Nenhum trade registrado nesta semana para exibir o gráfico.</p>
                  ) : (
                    <ChartContainer config={chartConfig} className="h-[200px] w-full">
                      <RechartsLineChart accessibilityLayer data={weeklyPLData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} width={40}/>
                        <RechartsTooltip 
                          cursor={true}
                          content={<ChartTooltipContent indicator="line" />} 
                          formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                        />
                        <RechartsLine dataKey="pl" type="monotone" stroke="var(--color-pl)" strokeWidth={2.5} dot={{ r: 5, fill: "var(--color-pl)", strokeWidth:1, stroke: "hsl(var(--background))" }} activeDot={{r: 7, strokeWidth: 2}} name="P/L"/>
                      </RechartsLineChart>
                    </ChartContainer>
                  )}
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
              {isLoading ? (
                 <div className="flex items-center justify-center py-5">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="ml-3 text-sm">Carregando alertas...</p>
                  </div>
              ) : (
                <>
                  {!lossLimitReached && !tradingOutsideHours && (
                    <p className="text-sm text-muted-foreground">Nenhum alerta ativo. Mantenha o foco!</p>
                  )}
                  {lossLimitReached && riskSettings && (
                    <Alert variant="destructive" className="shadow-sm">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Limite de Perda Atingido!</AlertTitle>
                      <AlertDescription>
                        Você atingiu seu limite de perda diário de R$ {riskSettings.dailyLossLimit.toFixed(2)}. Considere parar e revisar.
                      </AlertDescription>
                    </Alert>
                  )}
                  {tradingOutsideHours && ( // Placeholder
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

    