
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Percent, FileText, AlertTriangle, TrendingUp, Smile, BarChart, Loader2, DollarSign, Lightbulb, LineChartIcon, CalendarIcon, Clock, Tag, CheckCircle, XCircle, PlusCircle, Brain } from 'lucide-react'; // Added PlusCircle, Brain, CheckCircle, XCircle
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/auth-provider';
import { ResponsiveContainer, LineChart as RechartsLineChart, XAxis, YAxis, Tooltip as RechartsTooltip, Line as RechartsLine, CartesianGrid, BarChart as RechartsBarChart, Bar as RechartsBar, Cell } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { db, collection, query, where, orderBy, getDocs, Timestamp, doc, getDoc } from '@/lib/firebase';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, eachDayOfInterval, subDays, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useDashboardHeader } from '@/contexts/dashboard-header-context';

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
  pl: { label: "P/L", color: "hsl(var(--chart-1))" },
  profit: { label: "P/L", color: "hsl(var(--chart-1))" }, // Alias for consistency
} satisfies ChartConfig;


export default function DashboardPage() {
  const { user, userId } = useAuth();
  const { setDailyResult, setIsLoadingDailyResult } = useDashboardHeader();

  const [isLoading, setIsLoading] = useState(true);
  
  const [allTrades, setAllTrades] = useState<TradeEntry[]>([]);
  const [riskSettings, setRiskSettings] = useState<RiskSettings | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // States for metrics based on selectedDate or today
  const [tradesForPeriodCount, setTradesForPeriodCount] = useState(0);
  const [profitOrLossForPeriod, setProfitOrLossForPeriod] = useState(0);
  const [averageEmotionForPeriod, setAverageEmotionForPeriod] = useState<string | null>(null);
  const [mostTradedAssetForPeriod, setMostTradedAssetForPeriod] = useState<string>("N/A");
  const [mostTradedPeriodForPeriod, setMostTradedPeriodForPeriod] = useState<string>("N/A");
  const [winRateForPeriod, setWinRateForPeriod] = useState(0);

  // States for metrics based on last 7 days (performance)
  const [winRate7Days, setWinRate7Days] = useState(0);
  const [avgRiskReward7Days, setAvgRiskReward7Days] = useState<string>("N/A");
  const [weeklyPLChartData, setWeeklyPLChartData] = useState(initialWeeklyPLDataTemplate);
  const [winningTrades7DaysCount, setWinningTrades7DaysCount] = useState(0);
  const [losingTrades7DaysCount, setLosingTrades7DaysCount] = useState(0);
  
  const [lossLimitReached, setLossLimitReached] = useState(false);
  const [tradingOutsideHours, setTradingOutsideHours] = useState(false); 

  useEffect(() => {
    if (!userId) {
        setIsLoading(false);
        setAllTrades([]);
        setRiskSettings(null);
        setTradesForPeriodCount(0);
        setProfitOrLossForPeriod(0);
        setAverageEmotionForPeriod("N/A");
        setMostTradedAssetForPeriod("N/A");
        setMostTradedPeriodForPeriod("N/A");
        setWinRateForPeriod(0);
        setWinRate7Days(0);
        setAvgRiskReward7Days("N/A");
        setWeeklyPLChartData(initialWeeklyPLDataTemplate);
        setWinningTrades7DaysCount(0);
        setLosingTrades7DaysCount(0);
        setLossLimitReached(false);
        setIsLoadingDailyResult(false);
        setDailyResult(0);
        return;
    }

    const fetchDashboardData = async () => {
      setIsLoading(true);
      setIsLoadingDailyResult(true);
      try {
        const today = new Date();
        // Fetch data for roughly the last 1.5-2 weeks to cover 7-day calcs and weekly chart
        const fetchDataSince = subDays(startOfWeek(today, { locale: ptBR }), 8); // Go back a bit further to ensure enough data for rolling 7 days
        
        const tradesQuery = query(
          collection(db, "trades"),
          where("userId", "==", userId),
          where("date", ">=", Timestamp.fromDate(fetchDataSince)),
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
        setAllTrades(fetchedTrades);

        const riskDocRef = doc(db, "risk_config", userId);
        const riskDocSnap = await getDoc(riskDocRef);
        if (riskDocSnap.exists()) {
            setRiskSettings(riskDocSnap.data() as RiskSettings);
        } else {
            setRiskSettings(null);
        }
        
        setTradingOutsideHours(false);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setAllTrades([]);
        setRiskSettings(null);
      } finally {
        setIsLoading(false);
        setIsLoadingDailyResult(false);
      }
    };
    fetchDashboardData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (isLoading) {
        setIsLoadingDailyResult(true);
        return;
    }

    const today = new Date();
    const periodDate = selectedDate || today;
    const startOfPeriod = startOfDay(periodDate);
    const endOfPeriod = endOfDay(periodDate);

    const tradesForSelectedPeriod = allTrades.filter(trade => {
        const tradeDate = trade.date;
        return tradeDate >= startOfPeriod && tradeDate <= endOfPeriod;
    });

    setTradesForPeriodCount(tradesForSelectedPeriod.length);
    const plForPeriod = tradesForSelectedPeriod.reduce((sum, trade) => sum + trade.profit, 0);
    setProfitOrLossForPeriod(plForPeriod);
    
    if (!selectedDate || format(selectedDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      setDailyResult(plForPeriod);
    } else if (selectedDate) {
      setDailyResult(plForPeriod);
    }
    setIsLoadingDailyResult(isLoading);


    const winningTradesForPeriod = tradesForSelectedPeriod.filter(t => t.profit > 0);
    const newWinRateForPeriod = tradesForSelectedPeriod.length > 0 ? (winningTradesForPeriod.length / tradesForSelectedPeriod.length) * 100 : 0;
    setWinRateForPeriod(newWinRateForPeriod);

    if (tradesForSelectedPeriod.length > 0) {
        const sumEmotionAfter = tradesForSelectedPeriod.reduce((sum, trade) => sum + trade.emotionAfter, 0);
        setAverageEmotionForPeriod(`${(sumEmotionAfter / tradesForSelectedPeriod.length).toFixed(1)}/10`);

        const assetCounts = tradesForSelectedPeriod.reduce((acc, trade) => {
            acc[trade.asset] = (acc[trade.asset] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const mostAsset = Object.keys(assetCounts).sort((a,b) => assetCounts[b] - assetCounts[a])[0];
        setMostTradedAssetForPeriod(mostAsset || "N/A");

        const periodCounts = tradesForSelectedPeriod.reduce((acc, trade) => {
            acc[trade.period] = (acc[trade.period] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const mostPeriod = Object.keys(periodCounts).sort((a,b) => periodCounts[b] - periodCounts[a])[0];
        setMostTradedPeriodForPeriod(mostPeriod ? mostPeriod.charAt(0).toUpperCase() + mostPeriod.slice(1) : "N/A");
    } else {
        setAverageEmotionForPeriod("N/A");
        setMostTradedAssetForPeriod("N/A");
        setMostTradedPeriodForPeriod("N/A");
    }

    // Calculate metrics for the actual last 7 days (rolling)
    const todayFor7DayMetrics = new Date();
    const actualSevenDaysAgoDate = startOfDay(subDays(todayFor7DayMetrics, 6)); // Includes today
    const endOfTodayFor7DayMetrics = endOfDay(todayFor7DayMetrics);

    const tradesActuallyLast7Days = allTrades.filter(trade => {
        const tradeDate = trade.date;
        return tradeDate >= actualSevenDaysAgoDate && tradeDate <= endOfTodayFor7DayMetrics;
    });
    
    const winningTradesActual7 = tradesActuallyLast7Days.filter(t => t.profit > 0);
    const losingTradesActual7 = tradesActuallyLast7Days.filter(t => t.profit < 0);
    setWinningTrades7DaysCount(winningTradesActual7.length);
    setLosingTrades7DaysCount(losingTradesActual7.length);

    if (tradesActuallyLast7Days.length > 0) {
        setWinRate7Days((winningTradesActual7.length / tradesActuallyLast7Days.length) * 100);
    } else {
        setWinRate7Days(0);
    }

    const totalWinAmountActual7 = winningTradesActual7.reduce((sum, t) => sum + t.profit, 0);
    const totalLossAmountActual7 = losingTradesActual7.reduce((sum, t) => sum + Math.abs(t.profit), 0);
    const avgWinActual7 = winningTradesActual7.length > 0 ? totalWinAmountActual7 / winningTradesActual7.length : 0;
    const avgLossActual7 = losingTradesActual7.length > 0 ? totalLossAmountActual7 / losingTradesActual7.length : 0;
    
    if (avgLossActual7 > 0) {
        setAvgRiskReward7Days(`${(avgWinActual7 / avgLossActual7).toFixed(2)}:1`);
    } else if (avgWinActual7 > 0) {
        setAvgRiskReward7Days("Inf:1");
    } else {
        setAvgRiskReward7Days("N/A");
    }


    // Weekly P/L Chart Data Logic (remains mostly the same)
    if (selectedDate && isValid(selectedDate)) {
        const tradesOnSelectedDay = allTrades
            .filter(trade => trade.date >= startOfDay(selectedDate) && trade.date <= endOfDay(selectedDate))
            .sort((a,b) => a.date.getTime() - b.date.getTime());
        
        const chartDataForDay = tradesOnSelectedDay.map(trade => ({
            day: format(trade.date, 'HH:mm'), 
            pl: trade.profit,
            asset: trade.asset
        }));
        setWeeklyPLChartData(chartDataForDay);
    } else {
        const weekStartDate = startOfWeek(today, { locale: ptBR });
        const currentWeekDays = eachDayOfInterval({ start: weekStartDate, end: endOfWeek(today, { locale: ptBR }) });
        const newWeeklyPLData = currentWeekDays.map(dayDate => {
            const dayKey = format(dayDate, 'EEE', { locale: ptBR });
            const tradesOnThisDay = allTrades.filter(trade => 
                trade.date >= startOfDay(dayDate) && trade.date <= endOfDay(dayDate)
            );
            const totalPL = tradesOnThisDay.reduce((sum, trade) => sum + trade.profit, 0);
            return { day: dayKey.charAt(0).toUpperCase() + dayKey.slice(1), pl: totalPL };
        });
        setWeeklyPLChartData(newWeeklyPLData);
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTrades, selectedDate, isLoading, userId, setDailyResult, setIsLoadingDailyResult]);

  useEffect(() => {
    if (riskSettings && profitOrLossForPeriod < 0 && Math.abs(profitOrLossForPeriod) >= riskSettings.dailyLossLimit) {
        setLossLimitReached(true);
    } else {
        setLossLimitReached(false);
    }
  }, [profitOrLossForPeriod, riskSettings]);
  
  useEffect(() => {
    return () => {
      setDailyResult(null);
      setIsLoadingDailyResult(true); 
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  if (!user && !isLoading) return (
    <div className="container mx-auto py-8 text-center">
        <p>Por favor, faça login para ver o dashboard.</p>
        <Button asChild className="mt-4"><Link href="/login">Login</Link></Button>
    </div>
  );
   if (isLoading && !allTrades.length) return ( 
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
        {isLoadingCard && value === "..." ? ( 
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
  
  const periodChartTitle = selectedDate && isValid(selectedDate)
    ? `Trades do Dia: ${format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}`
    : "Resultado Semanal";

  const noTradesForChart = weeklyPLChartData.length === 0 || weeklyPLChartData.every(item => item.pl === 0);

  const summaryTitle = selectedDate && isValid(selectedDate) 
    ? `Resumo de ${format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}` 
    : "Resumo do Dia de Hoje";
  
  const resultTitle = selectedDate && isValid(selectedDate)
    ? `Resultado de ${format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}`
    : "Resultado do Dia";


  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold font-headline">Painel de Controle</h1>
        <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : <span>Filtrar por data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    if (!date) { 
                        const today = new Date();
                        const startOfToday = startOfDay(today);
                        const endOfToday = endOfDay(today);
                        const tradesForToday = allTrades.filter(trade => trade.date >= startOfToday && trade.date <= endOfToday);
                        const plForToday = tradesForToday.reduce((sum, trade) => sum + trade.profit, 0);
                        setDailyResult(plForToday);
                    }
                  }}
                  initialFocus
                  locale={ptBR}
                  disabled={(date) => date > new Date() || date < new Date("2020-01-01")}
                />
              </PopoverContent>
            </Popover>
            {selectedDate && <Button variant="ghost" onClick={() => {
                setSelectedDate(undefined);
                const today = new Date();
                const startOfToday = startOfDay(today);
                const endOfToday = endOfDay(today);
                const tradesForToday = allTrades.filter(trade => trade.date >= startOfToday && trade.date <= endOfToday);
                const plForToday = tradesForToday.reduce((sum, trade) => sum + trade.profit, 0);
                setDailyResult(plForToday);
                setIsLoadingDailyResult(isLoading); 
            }}>Limpar filtro</Button>}
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 font-headline">{summaryTitle}</h2>
        {isLoading && allTrades.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[...Array(6)].map((_,i) => <StatCard key={i} title="Carregando..." value="..." icon={<Loader2 className="h-5 w-5 animate-spin text-muted-foreground"/>} description="..." isLoadingCard={true}/>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard title="Trades Realizados" value={tradesForPeriodCount} icon={<BarChart className="h-5 w-5 text-muted-foreground" />} description="Operações no período" isLoadingCard={isLoading && allTrades.length === 0} />
            <StatCard title={resultTitle} value={`R$ ${profitOrLossForPeriod.toFixed(2)}`} icon={<DollarSign className="h-5 w-5 text-muted-foreground" />} description="Financeiro do período" isLoadingCard={isLoading && allTrades.length === 0} valueColor={profitOrLossForPeriod >= 0 ? 'text-green-600' : 'text-red-600'}/>
            <StatCard title="Taxa de Acerto" value={`${winRateForPeriod.toFixed(1)}%`} icon={<Percent className="h-5 w-5 text-muted-foreground" />} description="Acertos no período" isLoadingCard={isLoading && allTrades.length === 0} />
            <StatCard title="Emoção Média" value={averageEmotionForPeriod || 'N/A'} icon={<Smile className="h-5 w-5 text-muted-foreground" />} description="Pós-trades (0-10)" isLoadingCard={isLoading && allTrades.length === 0} />
            <StatCard title="Ativo Mais Operado" value={mostTradedAssetForPeriod} icon={<Tag className="h-5 w-5 text-muted-foreground" />} description="Mais frequente no período" isLoadingCard={isLoading && allTrades.length === 0} />
            <StatCard title="Horário Mais Operado" value={mostTradedPeriodForPeriod} icon={<Clock className="h-5 w-5 text-muted-foreground" />} description="Período no dia" isLoadingCard={isLoading && allTrades.length === 0} />
          </div>
        )}
      </section>

      <section className="mb-8">
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button asChild variant="outline" className="h-auto text-left p-4 hover:shadow-md transition-shadow">
              <Link href="/trade-log" className="flex flex-col items-start space-y-1 w-full">
                <div className="flex items-center gap-2 mb-1">
                  <PlusCircle className="h-6 w-6 text-primary" />
                  <span className="text-base font-semibold">Registrar Trade</span>
                </div>
                <p className="text-xs text-muted-foreground">Adicione uma nova operação ao seu diário de forma rápida.</p>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto text-left p-4 hover:shadow-md transition-shadow">
              <Link href="/daily-plan" className="flex flex-col items-start space-y-1 w-full">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-6 w-6 text-primary" />
                  <span className="text-base font-semibold">Plano Diário com IA</span>
                </div>
                <p className="text-xs text-muted-foreground">Defina suas metas e deixe a IA criar seu plano.</p>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto text-left p-4 hover:shadow-md transition-shadow">
              <Link href="/ai-psychologist" className="flex flex-col items-start space-y-1 w-full">
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="h-6 w-6 text-primary" />
                  <span className="text-base font-semibold">Psicólogo Virtual</span>
                </div>
                <p className="text-xs text-muted-foreground">Converse com a IA para obter apoio emocional.</p>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card className="md:col-span-3 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="font-headline text-lg">{periodChartTitle}</CardTitle>
            <CardDescription className="text-sm">
                {selectedDate && isValid(selectedDate) ? "Trades individuais do dia selecionado." : "P/L agregado de cada dia da semana atual."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading && allTrades.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3">Carregando dados do gráfico...</p>
              </div>
            ) : noTradesForChart ? (
                <p className="text-center text-muted-foreground py-10">
                    {selectedDate && isValid(selectedDate)
                        ? `Nenhum trade registrado para ${format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}.`
                        : "Nenhum trade registrado nesta semana para exibir o gráfico."
                    }
                </p>
            ) : selectedDate && isValid(selectedDate) ? ( 
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <RechartsBarChart data={weeklyPLChartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} interval={0} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} width={40}/>
                    <RechartsTooltip 
                        cursor={true}
                        content={<ChartTooltipContent indicator="line" />} 
                        formatter={(value: number, name: string, props: any) => [`R$ ${value.toFixed(2)} (${props.payload.asset})`, "Resultado"]}
                    />
                    <RechartsBar dataKey="pl" name="Resultado">
                        {weeklyPLChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.pl >= 0 ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"} />
                        ))}
                    </RechartsBar>
                  </RechartsBarChart>
                </ChartContainer>
            ) : ( 
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <RechartsLineChart accessibilityLayer data={weeklyPLChartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
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
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 mt-6">
         <Card className="md:col-span-1 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Desempenho (Últimos 7 dias)</CardTitle>
            <CardDescription className="text-sm">Métricas de performance do período.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {isLoading && allTrades.length === 0 ? (
                <div className="flex items-center justify-center py-5">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="ml-3 text-sm">Carregando desempenho...</p>
                </div>
             ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatCard title="Trades Vencedores" value={winningTrades7DaysCount} icon={<CheckCircle className="h-5 w-5 text-green-500" />} description="Ganhos no período" isLoadingCard={isLoading && allTrades.length === 0}/>
                    <StatCard title="Trades Perdedores" value={losingTrades7DaysCount} icon={<XCircle className="h-5 w-5 text-red-500" />} description="Perdas no período" isLoadingCard={isLoading && allTrades.length === 0}/>
                    <StatCard title="Taxa de Acerto" value={`${winRate7Days.toFixed(1)}%`} icon={<Percent className="h-5 w-5 text-muted-foreground" />} description="Percentual de acertos" isLoadingCard={isLoading && allTrades.length === 0}/>
                    <StatCard title="R/R Médio" value={avgRiskReward7Days} icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />} description="Risco/Retorno" isLoadingCard={isLoading && allTrades.length === 0}/>
                </div>
             )}
          </CardContent>
        </Card>

        <div className="md:col-span-1 space-y-6">
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="font-headline text-lg">Alertas do Sistema</CardTitle>
                  <CardDescription className="text-sm">Notificações importantes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isLoading && allTrades.length === 0 && !riskSettings ? (
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
                            Você atingiu seu limite de perda de R$ {riskSettings.dailyLossLimit.toFixed(2)} para o período selecionado. Considere parar e revisar.
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

            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
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
    </div>
  );
}

