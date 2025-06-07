
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PlusCircle, Filter, ListChecks, TrendingUp, Meh, Repeat, CalendarIcon, Loader2, Sun, Moon, CloudSun, Trash2, BarChart3, LineChart, ThumbsUp, ThumbsDown, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, subDays } from "date-fns"; // Added subDays
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { db, collection, addDoc, getDocs, query, where, orderBy, Timestamp, deleteDoc, doc } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';
import { ResponsiveContainer, LineChart as RechartsLineChart, BarChart as RechartsBarChart, XAxis, YAxis, Tooltip as RechartsTooltip, Line as RechartsLine, Bar as RechartsBar, CartesianGrid, Legend, Cell } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';


const tradeSchema = z.object({
  date: z.date({ required_error: "Data é obrigatória." }),
  asset: z.string().min(1, "Ativo é obrigatório."),
  type: z.enum(['compra', 'venda']),
  result: z.enum(['gain', 'loss', 'zero']),
  amount: z.coerce.number(), 
  period: z.enum(['manhã', 'tarde', 'noite']),
  setup: z.string().optional(),
  emotionBefore: z.number().min(0).max(10),
  emotionAfter: z.number().min(0).max(10),
  comment: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.result === 'zero' && data.amount !== 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Para 'Zero a Zero', o valor deve ser 0.",
      path: ['amount'],
    });
  }
  if ((data.result === 'gain' || data.result === 'loss') && data.amount <= 0) {
     ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Para 'Gain' ou 'Loss', o valor deve ser um número positivo e maior que zero.",
      path: ['amount'],
    });
  }
});

type TradeFormValues = z.infer<typeof tradeSchema>;

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

const chartConfigBase = {
  profit: { label: "P/L", color: "hsl(var(--chart-1))" },
  emotionBefore: { label: "Emoção (Antes)", color: "hsl(var(--chart-2))" },
  emotionAfter: { label: "Emoção (Depois)", color: "hsl(var(--chart-3))" },
  avgWin: { label: "Lucro Médio", color: "hsl(var(--chart-2))" },
  avgLoss: { label: "Prejuízo Médio", color: "hsl(var(--destructive))" },
} satisfies ChartConfig;


export default function TradeLogPage() {
  const [trades, setTrades] = useState<TradeEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterDate, setFilterDate] = useState<Date | undefined>();
  const [isLoadingTrades, setIsLoadingTrades] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState<TradeEntry | null>(null);

  const { toast } = useToast();
  const { userId, user } = useAuth();

  const form = useForm<TradeFormValues>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      date: new Date(),
      asset: '',
      type: 'compra',
      result: 'gain',
      amount: 0,
      period: 'manhã',
      emotionBefore: 5,
      emotionAfter: 5,
      setup: '',
      comment: ''
    },
  });
  
  const fetchTrades = async () => {
    if (!userId) {
      setIsLoadingTrades(false);
      setTrades([]);
      return;
    }
    setIsLoadingTrades(true);
    try {
      const ninetyDaysAgo = subDays(new Date(), 90);
      const q = query(
        collection(db, "trades"), 
        where("userId", "==", userId),
        where("date", ">=", Timestamp.fromDate(ninetyDaysAgo)), // Filter for last 90 days
        orderBy("date", "desc")
      );
      const querySnapshot = await getDocs(q);
      const fetchedTrades: TradeEntry[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as Partial<TradeEntryFirestore>; 
        if (data.date && typeof (data.date as any).toDate === 'function') {
          fetchedTrades.push({ 
            ...(data as TradeEntryFirestore), 
            id: docSnap.id,
            date: (data.date as Timestamp).toDate() 
          } as TradeEntry); 
        } else {
          console.warn(`Document ${docSnap.id} has an invalid or missing 'date' field that is not a Firestore Timestamp. Data:`, data);
        }
      });
      setTrades(fetchedTrades);
    } catch (error: any) {
      console.error("Erro DETALHADO ao CARREGAR trades (objeto completo):", error);
      let description = `Não foi possível buscar seus trades.`;
      if (error.code === 'failed-precondition' && error.message && error.message.includes("index")) {
        description = `O Firestore requer um ÍNDICE para esta consulta. Verifique o CONSOLE do navegador para o LINK para criar o índice. Cód: ${error.code || 'failed-precondition'}`;
      } else if (error.code) {
         description = `Não foi possível buscar seus trades. Cód: ${error.code}. Msg: ${error.message || String(error)}. Verifique o console.`;
      }
      
      toast({
        variant: "destructive",
        title: "Erro ao Carregar Trades",
        description: description,
        duration: 15000, 
      });
    }
    setIsLoadingTrades(false);
  };

  useEffect(() => {
    if (userId) {
      fetchTrades();
    } else {
      setIsLoadingTrades(false); 
      setTrades([]); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);


  const onSubmit: SubmitHandler<TradeFormValues> = async (data) => {
    if (!userId) {
      toast({ variant: "destructive", title: "Erro de Autenticação", description: "Usuário não autenticado. Por favor, faça login novamente.", duration: 7000 });
      return;
    }
    try {
      let calculatedProfit = 0;
      if (data.result === 'gain') {
        calculatedProfit = Math.abs(data.amount);
      } else if (data.result === 'loss') {
        calculatedProfit = -Math.abs(data.amount);
      }

      const tradeToSave: TradeEntryFirestore = {
        userId: userId,
        date: Timestamp.fromDate(data.date), 
        asset: data.asset,
        type: data.type,
        result: data.result,
        profit: calculatedProfit,
        period: data.period,
        setup: data.setup,
        emotionBefore: data.emotionBefore,
        emotionAfter: data.emotionAfter,
        comment: data.comment,
      };
      await addDoc(collection(db, "trades"), tradeToSave);
      toast({
        title: "Trade Salvo!",
        description: "Sua operação foi registrada com sucesso.",
      });
      form.reset({
        date: new Date(),
        asset: '',
        type: 'compra',
        result: 'gain',
        amount: 0,
        period: 'manhã',
        emotionBefore: 5,
        emotionAfter: 5,
        setup: '',
        comment: ''
      });
      setIsDialogOpen(false);
      fetchTrades(); 
    } catch (error: any) {
      console.error("Erro DETALHADO ao SALVAR trade (objeto completo):", error);
      toast({
        variant: "destructive",
        title: "Erro ao Salvar Trade",
        description: `Não foi possível registrar sua operação. Cód: ${error.code || 'Desconhecido'}. Msg: ${error.message || String(error)}. Verifique o console.`,
        duration: 9000,
      });
    }
  };

  const handleDeleteTrade = async () => {
    if (!tradeToDelete || !userId) {
      toast({ variant: "destructive", title: "Erro", description: "Nenhum trade selecionado para exclusão ou usuário não autenticado." });
      return;
    }
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "trades", tradeToDelete.id));
      toast({
        title: "Trade Excluído!",
        description: `O trade do ativo ${tradeToDelete.asset} foi excluído.`,
      });
      setTrades(prevTrades => prevTrades.filter(trade => trade.id !== tradeToDelete.id));
      setTradeToDelete(null);
    } catch (error: any) {
      console.error("Erro ao excluir trade:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Excluir",
        description: `Não foi possível excluir o trade. ${error.message || ""}`,
      });
    }
    setIsDeleting(false);
  };

  const filteredTrades = useMemo(() => {
    if (!filterDate) return trades;
    const filterDayStart = new Date(filterDate);
    filterDayStart.setHours(0, 0, 0, 0);
    const filterDayEnd = new Date(filterDate);
    filterDayEnd.setHours(23, 59, 59, 999);

    return trades.filter(trade => {
        const tradeDate = trade.date;
        return tradeDate >= filterDayStart && tradeDate <= filterDayEnd;
    });
  }, [trades, filterDate]);

  const totalProfit = useMemo(() => {
    return filteredTrades.reduce((acc, trade) => acc + trade.profit, 0);
  }, [filteredTrades]);

  const chartDataPL = useMemo(() => {
    if (filteredTrades.length === 0) return [];
    if (filterDate) {
      return filteredTrades
        .sort((a,b) => a.date.getTime() - b.date.getTime()) 
        .map((trade) => ({
          name: `${format(trade.date, 'HH:mm')} (${trade.asset.substring(0,6)})`,
          profit: trade.profit
        }));
    } else {
        const dailyData = filteredTrades.reduce((acc, trade) => {
        const day = format(trade.date, 'yyyy-MM-dd');
        if (!acc[day]) {
            acc[day] = { date: day, profit: 0, count: 0 };
        }
        acc[day].profit += trade.profit;
        acc[day].count++;
        return acc;
        }, {} as Record<string, { date: string; profit: number; count: number }>);

        return Object.values(dailyData)
        .sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
        .map(d => ({
            name: format(parseISO(d.date), 'dd/MM', { locale: ptBR }),
            profit: d.profit,
        }));
    }
  }, [filteredTrades, filterDate]);

  const chartDataEmotion = useMemo(() => {
    if (filteredTrades.length === 0) return [];
     if (filterDate) {
        return filteredTrades
            .sort((a,b) => a.date.getTime() - b.date.getTime())
            .map((trade) => ({
            name: `${format(trade.date, 'HH:mm')} (${trade.asset.substring(0,6)})`,
            emotionBefore: trade.emotionBefore,
            emotionAfter: trade.emotionAfter,
            }));
    } else {
        const dailyData = filteredTrades.reduce((acc, trade) => {
            const day = format(trade.date, 'yyyy-MM-dd');
            if (!acc[day]) {
                acc[day] = { date: day, emotionBeforeSum: 0, emotionAfterSum: 0, count: 0 };
            }
            acc[day].emotionBeforeSum += trade.emotionBefore;
            acc[day].emotionAfterSum += trade.emotionAfter;
            acc[day].count++;
            return acc;
        }, {} as Record<string, { date: string; emotionBeforeSum: number; emotionAfterSum: number; count: number }>);

        return Object.values(dailyData)
            .sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
            .map(d => ({
            name: format(parseISO(d.date), 'dd/MM', { locale: ptBR }),
            emotionBefore: d.count > 0 ? parseFloat((d.emotionBeforeSum / d.count).toFixed(1)) : 0,
            emotionAfter: d.count > 0 ? parseFloat((d.emotionAfterSum / d.count).toFixed(1)) : 0,
            }));
    }
  }, [filteredTrades, filterDate]);

  const performanceMetrics = useMemo(() => {
    const winningTrades = filteredTrades.filter(t => t.profit > 0);
    const losingTrades = filteredTrades.filter(t => t.profit < 0);

    const totalWinAmount = winningTrades.reduce((sum, t) => sum + t.profit, 0);
    const totalLossAmount = losingTrades.reduce((sum, t) => sum + Math.abs(t.profit), 0);

    const avgWin = winningTrades.length > 0 ? totalWinAmount / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalLossAmount / losingTrades.length : 0;
    
    const payoffRatio = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? Infinity : 0);

    const highestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.profit)) : 0;
    const biggestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.profit)) : 0; // Will be negative or zero

    return {
      avgWin,
      avgLoss,
      payoffRatio,
      numWinningTrades: winningTrades.length,
      numLosingTrades: losingTrades.length,
      highestWin,
      biggestLoss: Math.abs(biggestLoss), // Display as positive value
    };
  }, [filteredTrades]);

  const payoffChartData = [
    { name: "Lucro Médio", value: performanceMetrics.avgWin },
    { name: "Prejuízo Médio", value: performanceMetrics.avgLoss },
  ];

  if (!user) return null;

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold font-headline">Diário de Operações</h1>
        <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
          setIsDialogOpen(isOpen);
          if (!isOpen) {
            form.reset({
              date: new Date(),
              asset: '',
              type: 'compra',
              result: 'gain',
              amount: 0,
              period: 'manhã',
              emotionBefore: 5,
              emotionAfter: 5,
              setup: '',
              comment: ''
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button disabled={!userId}>
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Trade
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-headline">Registrar Novo Trade</DialogTitle>
            </DialogHeader>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data da Operação</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP HH:mm", { locale: ptBR })
                            ) : (
                              <span>Escolha uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            const newDate = date ? new Date(date) : new Date();
                            if (field.value) { 
                                newDate.setHours(field.value.getHours());
                                newDate.setMinutes(field.value.getMinutes());
                                newDate.setSeconds(field.value.getSeconds());
                            } else { 
                                const now = new Date();
                                newDate.setHours(now.getHours());
                                newDate.setMinutes(now.getMinutes());
                            }
                            field.onChange(newDate);
                          }}
                          disabled={(date) =>
                            date > new Date() || date < new Date("2000-01-01")
                          }
                          initialFocus
                          locale={ptBR}
                        />
                        <div className="p-2 border-t">
                            <FormLabel className="text-sm">Hora (HH:MM)</FormLabel>
                            <Input 
                                type="time" 
                                defaultValue={field.value ? format(field.value, "HH:mm") : format(new Date(), "HH:mm")}
                                onChange={(e) => {
                                    const currentTime = field.value || new Date();
                                    const [hours, minutes] = e.target.value.split(':');
                                    const updatedDate = new Date(currentTime);
                                    updatedDate.setHours(parseInt(hours, 10));
                                    updatedDate.setMinutes(parseInt(minutes, 10));
                                    field.onChange(updatedDate);
                                }}
                                className="w-full mt-1"
                            />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="asset" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ativo</FormLabel>
                      <FormControl><Input placeholder="Ex: WINQ24, AAPL" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="compra">Compra</SelectItem>
                          <SelectItem value="venda">Venda</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="result" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resultado</FormLabel>
                      <FormControl>
                        <RadioGroup 
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (value === 'zero') {
                              form.setValue('amount', 0, { shouldValidate: true });
                            } else if (form.getValues('amount') === 0 && (value === 'gain' || value === 'loss')) {
                               form.setValue('amount', undefined as any, { shouldValidate: true }); 
                            }
                          }} 
                          defaultValue={field.value} 
                          className="flex space-x-4 items-center pt-2"
                        >
                          <FormItem className="flex items-center space-x-2"><RadioGroupItem value="gain" id="r-gain" /><FormLabel htmlFor="r-gain" className="font-normal">Gain</FormLabel></FormItem>
                          <FormItem className="flex items-center space-x-2"><RadioGroupItem value="loss" id="r-loss" /><FormLabel htmlFor="r-loss" className="font-normal">Loss</FormLabel></FormItem>
                          <FormItem className="flex items-center space-x-2"><RadioGroupItem value="zero" id="r-zero" /><FormLabel htmlFor="r-zero" className="font-normal">Zero a Zero</FormLabel></FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor do Resultado (R$)</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} disabled={form.watch('result') === 'zero'} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField control={form.control} name="period" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Período da Operação</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="manhã"><Sun className="inline mr-2 h-4 w-4"/>Manhã</SelectItem>
                          <SelectItem value="tarde"><CloudSun className="inline mr-2 h-4 w-4"/>Tarde</SelectItem>
                          <SelectItem value="noite"><Moon className="inline mr-2 h-4 w-4"/>Noite</SelectItem>
                        </SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField control={form.control} name="setup" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setup Usado (Opcional)</FormLabel>
                    <FormControl><Input placeholder="Ex: Pivot de alta" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="emotionBefore" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emoção Antes (0-10): {field.value}</FormLabel>
                    <FormControl><Slider defaultValue={[field.value]} max={10} step={1} onValueChange={(v) => field.onChange(v[0])} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="emotionAfter" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emoção Depois (0-10): {field.value}</FormLabel>
                    <FormControl><Slider defaultValue={[field.value]} max={10} step={1} onValueChange={(v) => field.onChange(v[0])} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="comment" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comentário (Opcional)</FormLabel>
                    <FormControl><Textarea placeholder="Notas sobre o trade..." {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Trade
                </Button>
              </DialogFooter>
            </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="mb-6 flex items-center space-x-2">
        <Filter className="h-5 w-5 text-muted-foreground" />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !filterDate && "text-muted-foreground"
              )}
              disabled={isLoadingTrades}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filterDate ? format(filterDate, "PPP", { locale: ptBR }) : <span>Filtrar por data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filterDate}
              onSelect={setFilterDate}
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
        {filterDate && <Button variant="ghost" onClick={() => setFilterDate(undefined)} disabled={isLoadingTrades}>Limpar filtro</Button>}
      </div>

      <AlertDialog>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><ListChecks className="mr-2 h-5 w-5" />Trades Registrados</CardTitle>
            <CardDescription>Trades dos últimos 90 dias. Use o filtro para ver um dia específico.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTrades ? (
              <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-2">Carregando trades...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Resultado (R$)</TableHead>
                    <TableHead>Emoção (A/D)</TableHead>
                    <TableHead>Setup</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrades.length > 0 ? filteredTrades.map(trade => (
                    <TableRow key={trade.id}>
                      <TableCell>{format(trade.date, "dd/MM/yy HH:mm", { locale: ptBR })}</TableCell>
                      <TableCell>{trade.asset}</TableCell>
                      <TableCell>{trade.type === 'compra' ? 'Compra' : 'Venda'}</TableCell>
                      <TableCell className="capitalize">{trade.period}</TableCell>
                      <TableCell className={trade.profit > 0 ? 'text-green-600' : trade.profit < 0 ? 'text-red-600' : ''}>
                        {trade.profit.toFixed(2)}
                      </TableCell>
                      <TableCell>{trade.emotionBefore}/{trade.emotionAfter}</TableCell>
                      <TableCell>{trade.setup || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setTradeToDelete(trade)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center h-24">Nenhum trade encontrado para {filterDate ? `o dia ${format(filterDate, "dd/MM/yyyy", { locale: ptBR })}` : 'os últimos 90 dias'}.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
                {filteredTrades.length > 0 && (
                    <TableCaption>Total P/L {filterDate ? `do dia ${format(filterDate, "dd/MM/yyyy", {locale: ptBR})}` : "dos últimos 90 dias"}: <span className={totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>R$ {totalProfit.toFixed(2)}</span></TableCaption>
                )}
              </Table>
            )}
          </CardContent>
        </Card>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                Tem certeza que deseja excluir o trade do ativo "{tradeToDelete?.asset}" de {tradeToDelete?.date ? format(tradeToDelete.date, "dd/MM/yyyy HH:mm", {locale: ptBR}) : ''}? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setTradeToDelete(null)} disabled={isDeleting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteTrade} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Excluir
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><BarChart3 className="mr-2 h-5 w-5 text-primary"/>Lucro x Perda {filterDate ? `(Dia ${format(filterDate, "dd/MM", {locale: ptBR})})` : "(Agregado Diário - Últimos 90 Dias)"}</CardTitle>
            <CardDescription>Resultado financeiro dos trades.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {isLoadingTrades ? (<Loader2 className="mx-auto mt-12 h-8 w-8 animate-spin text-primary" />) : 
             chartDataPL.length > 0 ? (
              <ChartContainer config={chartConfigBase} className="h-full w-full">
                <RechartsBarChart data={chartDataPL} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} width={40}/>
                  <RechartsTooltip 
                    cursor={{fill: 'hsl(var(--muted))'}}
                    content={<ChartTooltipContent indicator="dot" />} 
                    formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  />
                  <RechartsBar dataKey="profit" radius={[4, 4, 0, 0]}>
                    {chartDataPL.map((entry, index) => (
                        <Cell key={`cell-pl-${index}`} fill={entry.profit >= 0 ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"} />
                    ))}
                  </RechartsBar>
                </RechartsBarChart>
              </ChartContainer>
            ) : (<p className="text-center text-muted-foreground pt-10">Sem dados de P/L para exibir.</p>)}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><LineChart className="mr-2 h-5 w-5 text-primary"/>Emoção Média {filterDate ? `(Dia ${format(filterDate, "dd/MM", {locale: ptBR})})` : "(Agregado Diário - Últimos 90 Dias)"}</CardTitle>
             <CardDescription>Variação da emoção antes e depois dos trades.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
             {isLoadingTrades ? (<Loader2 className="mx-auto mt-12 h-8 w-8 animate-spin text-primary" />) : 
             chartDataEmotion.length > 0 ? (
              <ChartContainer config={chartConfigBase} className="h-full w-full">
                <RechartsLineChart data={chartDataEmotion} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                  <YAxis domain={[0, 10]} tickLine={false} axisLine={false} tickMargin={8} fontSize={12} width={40}/>
                  <RechartsTooltip 
                    cursor={{strokeDasharray: '3 3'}}
                    content={<ChartTooltipContent indicator="dot" />} 
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <RechartsLine type="monotone" dataKey="emotionBefore" stroke="var(--color-emotionBefore)" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Antes" />
                  <RechartsLine type="monotone" dataKey="emotionAfter" stroke="var(--color-emotionAfter)" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Depois"/>
                </RechartsLineChart>
              </ChartContainer>
            ) : (<p className="text-center text-muted-foreground pt-10">Sem dados de emoção para exibir.</p>)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><Repeat className="mr-2 h-5 w-5 text-primary"/>Desempenho Detalhado</CardTitle>
             <CardDescription>Métricas chave ({filterDate ? `dia ${format(filterDate, "dd/MM", {locale: ptBR})}` : "últimos 90 dias"})</CardDescription>
          </CardHeader>
          <CardContent className="h-80 text-sm">
            {isLoadingTrades ? (<Loader2 className="mx-auto mt-12 h-8 w-8 animate-spin text-primary" />) : 
             filteredTrades.length > 0 ? (
            <>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center"><ThumbsUp className="mr-2 h-4 w-4 text-green-500"/>Trades Vencedores:</span> 
                      <span className="font-semibold">{performanceMetrics.numWinningTrades}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center"><ThumbsDown className="mr-2 h-4 w-4 text-red-500"/>Trades Perdedores:</span> 
                      <span className="font-semibold">{performanceMetrics.numLosingTrades}</span>
                    </div>
                     <hr className="my-1"/>
                    <div className="flex justify-between"><span>Lucro Médio (Gain):</span> <span className="font-semibold text-green-600">R$ {performanceMetrics.avgWin.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Prejuízo Médio (Loss):</span> <span className="font-semibold text-red-600">R$ {performanceMetrics.avgLoss.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Taxa Lucro/Prejuízo (Payoff):</span> <span className="font-semibold">{performanceMetrics.payoffRatio === Infinity ? "Infinito" : performanceMetrics.payoffRatio.toFixed(2)}</span></div>
                    <hr className="my-1"/>
                    <div className="flex justify-between items-center">
                        <span className="flex items-center"><ArrowUpCircle className="mr-2 h-4 w-4 text-green-500"/>Maior Ganho:</span> 
                        <span className="font-semibold text-green-600">R$ {performanceMetrics.highestWin.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="flex items-center"><ArrowDownCircle className="mr-2 h-4 w-4 text-red-500"/>Maior Perda:</span> 
                        <span className="font-semibold text-red-600">R$ {performanceMetrics.biggestLoss.toFixed(2)}</span>
                    </div>
                </div>
                {payoffChartData[0].value > 0 || payoffChartData[1].value > 0 ? (
                    <ChartContainer config={chartConfigBase} className="h-[100px] w-full mt-3">
                        <RechartsBarChart data={payoffChartData} layout="vertical" margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" hide />
                            <RechartsTooltip 
                                cursor={{fill: 'hsl(var(--muted))'}}
                                content={<ChartTooltipContent indicator="dot" hideLabel />} 
                                formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                            />
                            <RechartsBar dataKey="value" radius={[4, 4, 4, 4]} barSize={20}>
                                <Cell fill="hsl(var(--chart-2))" />
                                <Cell fill="hsl(var(--destructive))" />
                            </RechartsBar>
                        </RechartsBarChart>
                    </ChartContainer>
                ) : null}
            </>
            ) : (<p className="text-center text-muted-foreground pt-10">Sem dados de desempenho para exibir.</p>)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
    

    