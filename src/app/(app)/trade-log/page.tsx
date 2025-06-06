'use client';

import { useState, useMemo } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Filter, BarChart2, TrendingUp, TrendingDown, Minus, ListChecks, Briefcase, Repeat, Meh } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// TODO: Define this type more robustly, perhaps in src/types
interface TradeEntry {
  id: string;
  date: Date;
  asset: string;
  type: 'compra' | 'venda';
  entryPrice: number;
  exitPrice: number;
  result: 'gain' | 'loss' | 'zero';
  stopPrice?: number;
  targetPrice?: number;
  setup?: string;
  rrEstimate?: string; // e.g., "1:2"
  emotionBefore: number;
  emotionAfter: number;
  comment?: string;
  profit: number;
}

const tradeSchema = z.object({
  asset: z.string().min(1, "Ativo é obrigatório."),
  type: z.enum(['compra', 'venda']),
  entryPrice: z.coerce.number().positive("Preço de entrada deve ser positivo."),
  exitPrice: z.coerce.number().positive("Preço de saída deve ser positivo."),
  result: z.enum(['gain', 'loss', 'zero']),
  stopPrice: z.coerce.number().optional(),
  targetPrice: z.coerce.number().optional(),
  setup: z.string().optional(),
  emotionBefore: z.number().min(0).max(10),
  emotionAfter: z.number().min(0).max(10),
  comment: z.string().optional(),
});

type TradeFormValues = z.infer<typeof tradeSchema>;

export default function TradeLogPage() {
  const [trades, setTrades] = useState<TradeEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterDate, setFilterDate] = useState<Date | undefined>();

  const form = useForm<TradeFormValues>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      asset: '',
      type: 'compra',
      entryPrice: undefined,
      exitPrice: undefined,
      result: 'zero',
      emotionBefore: 5,
      emotionAfter: 5,
    },
  });
  
  const calculateProfit = (entry: number, exit: number, type: 'compra' | 'venda'): number => {
    if (type === 'compra') return exit - entry;
    return entry - exit;
  };

  const onSubmit: SubmitHandler<TradeFormValues> = (data) => {
    const newTrade: TradeEntry = {
      id: new Date().toISOString(), // Simple ID
      date: new Date(),
      ...data,
      profit: calculateProfit(data.entryPrice, data.exitPrice, data.type),
      // rrEstimate can be calculated or manually input if another field is added
    };
    setTrades(prevTrades => [newTrade, ...prevTrades]);
    form.reset();
    setIsDialogOpen(false);
  };

  const filteredTrades = useMemo(() => {
    if (!filterDate) return trades;
    return trades.filter(trade => format(trade.date, "yyyy-MM-dd") === format(filterDate, "yyyy-MM-dd"));
  }, [trades, filterDate]);

  const totalProfit = useMemo(() => {
    return filteredTrades.reduce((acc, trade) => acc + trade.profit, 0);
  }, [filteredTrades]);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline">Diário de Operações</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Trade
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-headline">Registrar Novo Trade</DialogTitle>
            </DialogHeader>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <FormField control={form.control} name="entryPrice" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço de Entrada</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="exitPrice" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço de Saída</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField control={form.control} name="result" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resultado</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                        <FormItem className="flex items-center space-x-2"><RadioGroupItem value="gain" /><FormLabel className="font-normal">Gain</FormLabel></FormItem>
                        <FormItem className="flex items-center space-x-2"><RadioGroupItem value="loss" /><FormLabel className="font-normal">Loss</FormLabel></FormItem>
                        <FormItem className="flex items-center space-x-2"><RadioGroupItem value="zero" /><FormLabel className="font-normal">Zero a Zero</FormLabel></FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField control={form.control} name="stopPrice" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stop Loss (Opcional)</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="targetPrice" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alvo (Opcional)</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
              </div>
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
                <Button type="submit">Salvar Trade</Button>
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
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filterDate ? format(filterDate, "PPP") : <span>Filtrar por data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filterDate}
              onSelect={setFilterDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {filterDate && <Button variant="ghost" onClick={() => setFilterDate(undefined)}>Limpar filtro</Button>}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><ListChecks className="mr-2 h-5 w-5" />Trades Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Resultado (R$)</TableHead>
                <TableHead>Emoção (Antes/Depois)</TableHead>
                <TableHead>Setup</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrades.length > 0 ? filteredTrades.map(trade => (
                <TableRow key={trade.id}>
                  <TableCell>{format(trade.date, "dd/MM/yyyy HH:mm")}</TableCell>
                  <TableCell>{trade.asset}</TableCell>
                  <TableCell>{trade.type === 'compra' ? 'Compra' : 'Venda'}</TableCell>
                  <TableCell className={trade.profit > 0 ? 'text-green-600' : trade.profit < 0 ? 'text-red-600' : ''}>
                    {trade.profit.toFixed(2)}
                  </TableCell>
                  <TableCell>{trade.emotionBefore} / {trade.emotionAfter}</TableCell>
                  <TableCell>{trade.setup || 'N/A'}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Nenhum trade encontrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
             {filteredTrades.length > 0 && (
                <TableCaption>Total P/L do período: <span className={totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>R$ {totalProfit.toFixed(2)}</span></TableCaption>
             )}
          </Table>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="font-headline flex items-center"><TrendingUp className="mr-2 h-5 w-5"/>Lucro x Perda</CardTitle></CardHeader>
          <CardContent className="h-64 flex items-center justify-center bg-muted/50 rounded-md">
            <p className="text-muted-foreground">Gráfico de Lucro x Perda (Placeholder)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-headline flex items-center"><Meh className="mr-2 h-5 w-5"/>Emoção Média</CardTitle></CardHeader>
          <CardContent className="h-64 flex items-center justify-center bg-muted/50 rounded-md">
             <p className="text-muted-foreground">Gráfico de Emoção Média (Placeholder)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-headline flex items-center"><Repeat className="mr-2 h-5 w-5"/>R/R Médio</CardTitle></CardHeader>
          <CardContent className="h-64 flex items-center justify-center bg-muted/50 rounded-md">
            <p className="text-muted-foreground">Gráfico de R/R Médio (Placeholder)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
