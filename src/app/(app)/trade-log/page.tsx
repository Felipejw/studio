
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Filter, ListChecks, TrendingUp, Meh, Repeat, CalendarIcon, Loader2, Sun, Moon, CloudSun } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { db, collection, addDoc, getDocs, query, where, orderBy, Timestamp } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';

const tradeSchema = z.object({
  date: z.date({ required_error: "Data é obrigatória." }),
  asset: z.string().min(1, "Ativo é obrigatório."),
  type: z.enum(['compra', 'venda']),
  result: z.enum(['gain', 'loss', 'zero']),
  amount: z.coerce.number().min(0, { message: "O valor deve ser zero ou positivo." }),
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


export default function TradeLogPage() {
  const [trades, setTrades] = useState<TradeEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterDate, setFilterDate] = useState<Date | undefined>();
  const [isLoadingTrades, setIsLoadingTrades] = useState(true);
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
      const q = query(
        collection(db, "trades"), 
        where("userId", "==", userId),
        orderBy("date", "desc")
      );
      const querySnapshot = await getDocs(q);
      const fetchedTrades: TradeEntry[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as TradeEntryFirestore;
        fetchedTrades.push({ 
          ...data, 
          id: doc.id,
          date: data.date.toDate() 
        } as TradeEntry);
      });
      setTrades(fetchedTrades);
    } catch (error) {
      console.error("Erro ao carregar trades:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Carregar Trades",
        description: "Não foi possível buscar seus trades registrados. Verifique o console.",
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
      toast({ variant: "destructive", title: "Erro de Autenticação", description: "Usuário não autenticado. Por favor, faça login novamente." });
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
      form.reset();
      setIsDialogOpen(false);
      fetchTrades(); 
    } catch (error: any) {
      console.error("Erro detalhado ao salvar trade no Firestore:", error, error.stack);
      toast({
        variant: "destructive",
        title: "Erro ao Salvar Trade",
        description: `Não foi possível registrar sua operação. Causa: ${error.message || 'Erro desconhecido'}. Verifique o console para mais detalhes.`,
        duration: 7000,
      });
    }
  };

  const filteredTrades = useMemo(() => {
    if (!filterDate) return trades;
    return trades.filter(trade => format(trade.date, "yyyy-MM-dd") === format(filterDate, "yyyy-MM-dd"));
  }, [trades, filterDate]);

  const totalProfit = useMemo(() => {
    return filteredTrades.reduce((acc, trade) => acc + trade.profit, 0);
  }, [filteredTrades]);

  if (!user) return null;

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline">Diário de Operações</h1>
        <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
          setIsDialogOpen(isOpen);
          if (!isOpen) form.reset(); 
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
                              format(field.value, "PPP", { locale: ptBR })
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
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("2000-01-01")
                          }
                          initialFocus
                          locale={ptBR}
                        />
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

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><ListChecks className="mr-2 h-5 w-5" />Trades Registrados</CardTitle>
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
                  <TableHead>Emoção (Antes/Depois)</TableHead>
                  <TableHead>Setup</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrades.length > 0 ? filteredTrades.map(trade => (
                  <TableRow key={trade.id}>
                    <TableCell>{format(trade.date, "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                    <TableCell>{trade.asset}</TableCell>
                    <TableCell>{trade.type === 'compra' ? 'Compra' : 'Venda'}</TableCell>
                    <TableCell className="capitalize">{trade.period}</TableCell>
                    <TableCell className={trade.profit > 0 ? 'text-green-600' : trade.profit < 0 ? 'text-red-600' : ''}>
                      {trade.profit.toFixed(2)}
                    </TableCell>
                    <TableCell>{trade.emotionBefore} / {trade.emotionAfter}</TableCell>
                    <TableCell>{trade.setup || 'N/A'}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">Nenhum trade encontrado para {filterDate ? `o dia ${format(filterDate, "dd/MM/yyyy", { locale: ptBR })}` : 'o período selecionado'}.</TableCell>
                  </TableRow>
                )}
              </TableBody>
              {filteredTrades.length > 0 && (
                  <TableCaption>Total P/L do período: <span className={totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>R$ {totalProfit.toFixed(2)}</span></TableCaption>
              )}
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="font-headline flex items-center"><TrendingUp className="mr-2 h-5 w-5"/>Lucro x Perda</CardTitle></CardHeader>
          <CardContent className="h-64 flex items-center justify-center bg-muted/50 rounded-md">
            <p className="text-muted-foreground">Gráfico de Lucro x Perda (Em breve)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-headline flex items-center"><Meh className="mr-2 h-5 w-5"/>Emoção Média</CardTitle></CardHeader>
          <CardContent className="h-64 flex items-center justify-center bg-muted/50 rounded-md">
             <p className="text-muted-foreground">Gráfico de Emoção Média (Em breve)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-headline flex items-center"><Repeat className="mr-2 h-5 w-5"/>R/R Médio</CardTitle></CardHeader>
          <CardContent className="h-64 flex items-center justify-center bg-muted/50 rounded-md">
            <p className="text-muted-foreground">Gráfico de R/R Médio (Em breve)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
