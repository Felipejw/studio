
'use client';

import { useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { evaluateSimulation, type EvaluateSimulationInput, type EvaluateSimulationOutput } from '@/ai/flows/evaluate-simulation';
import { Loader2, Play, ShoppingCart, Tag, XCircle, CheckCircle, CalendarIcon, Award, ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const evaluationSchema = z.object({
  disciplineScore: z.coerce.number().min(0).max(100),
  techniqueScore: z.coerce.number().min(0).max(100),
  emotionalControlScore: z.coerce.number().min(0).max(100),
  tradesMade: z.coerce.number().int().min(0),
  simulationLength: z.string().min(1, "Duração é obrigatória"),
  profitLoss: z.coerce.number(),
});

type EvaluationFormValues = z.infer<typeof evaluationSchema>;

export default function MarketReplayPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [simulationStarted, setSimulationStarted] = useState(false);
  const [simulationFinished, setSimulationFinished] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<EvaluateSimulationOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EvaluationFormValues>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      disciplineScore: 75,
      techniqueScore: 75,
      emotionalControlScore: 75,
      tradesMade: 0,
      simulationLength: "60", // minutes
      profitLoss: 0,
    },
  });

  const handleStartSimulation = () => {
    if (!selectedDate) return;
    setSimulationStarted(true);
    setSimulationFinished(false);
    setAiFeedback(null);
    form.reset(); // Reset form for new simulation
  };

  const handleFinishSimulation = () => {
    setSimulationFinished(true);
    // The form for AI evaluation will now be visible
  };
  
  const onEvaluationSubmit: SubmitHandler<EvaluationFormValues> = async (data) => {
    setIsLoading(true);
    setAiFeedback(null);
    try {
      const response = await evaluateSimulation(data);
      setAiFeedback(response);
    } catch (error) {
      console.error("Error evaluating simulation:", error);
    }
    setIsLoading(false);
  };

  const getFeedbackCardColor = () => {
    if (!aiFeedback || !form.formState.isValid) return 'bg-card'; // Default or if form invalid
    const { disciplineScore, techniqueScore, emotionalControlScore } = form.getValues();
    const averageScore = (disciplineScore + techniqueScore + emotionalControlScore) / 3;
    if (averageScore >= 80) return 'bg-green-100 dark:bg-green-900 border-green-500';
    if (averageScore >= 60) return 'bg-yellow-100 dark:bg-yellow-800 border-yellow-500';
    return 'bg-red-100 dark:bg-red-900 border-red-500';
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 font-headline text-center sm:text-left">Simulador de Replay de Mercado</h1>

      {!simulationStarted ? (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="font-headline">Escolha um Dia para Simular</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal text-lg py-6",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Escolha uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button onClick={handleStartSimulation} size="lg" className="w-full" disabled={!selectedDate}>
              <Play className="mr-2 h-5 w-5" /> Iniciar Simulação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="font-headline">Simulação em Andamento: {selectedDate ? format(selectedDate, "PPP") : ""}</CardTitle>
              <CardDescription>Mercado simulado. Use os botões abaixo para operar.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Image
                src="https://placehold.co/800x400.png"
                alt="Gráfico de Candlestick (Placeholder)"
                width={800}
                height={400}
                className="rounded-md shadow-lg mx-auto w-full max-w-[800px] h-auto"
                data-ai-hint="stock chart"
              />
              <div className="mt-6 flex flex-wrap justify-center gap-2 md:gap-4">
                <Button variant="default" size="lg" className="bg-green-600 hover:bg-green-700 text-white grow sm:grow-0">
                  <ShoppingCart className="mr-2 h-5 w-5" /> Comprar
                </Button>
                <Button variant="default" size="lg" className="bg-red-600 hover:bg-red-700 text-white grow sm:grow-0">
                  <Tag className="mr-2 h-5 w-5" /> Vender
                </Button>
                <Button variant="outline" size="lg" className="grow sm:grow-0">
                  <XCircle className="mr-2 h-5 w-5" /> Cancelar
                </Button>
                <Button variant="secondary" size="lg" className="grow sm:grow-0">
                  <CheckCircle className="mr-2 h-5 w-5" /> Fechar
                </Button>
              </div>
              {!simulationFinished && (
                 <Button onClick={handleFinishSimulation} size="lg" className="mt-6" variant="destructive">
                   Finalizar Simulação
                 </Button>
              )}
            </CardContent>
          </Card>

          {simulationFinished && (
            <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Avalie sua Performance</CardTitle>
                <CardDescription>Preencha os dados para a IA analisar sua simulação.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onEvaluationSubmit)} className="space-y-4">
                  <FormField control={form.control} name="disciplineScore" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pontuação de Disciplina (0-100): {field.value}</FormLabel>
                        <FormControl><Slider defaultValue={[field.value]} max={100} step={1} onValueChange={(v) => field.onChange(v[0])} /></FormControl>
                      </FormItem>
                    )}
                  />
                   <FormField control={form.control} name="techniqueScore" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pontuação de Técnica (0-100): {field.value}</FormLabel>
                        <FormControl><Slider defaultValue={[field.value]} max={100} step={1} onValueChange={(v) => field.onChange(v[0])} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="emotionalControlScore" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Controle Emocional (0-100): {field.value}</FormLabel>
                        <FormControl><Slider defaultValue={[field.value]} max={100} step={1} onValueChange={(v) => field.onChange(v[0])} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="tradesMade" render={({ field }) => (
                        <FormItem><FormLabel>Trades Realizados</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    <FormField control={form.control} name="simulationLength" render={({ field }) => (
                        <FormItem><FormLabel>Duração (minutos)</FormLabel><FormControl><Input type="text" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                  </div>
                  <FormField control={form.control} name="profitLoss" render={({ field }) => (
                      <FormItem><FormLabel>Lucro/Prejuízo (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Award className="mr-2 h-4 w-4" />}
                    Obter Avaliação da IA
                  </Button>
                </form>
                </Form>
              </CardContent>
            </Card>

            {aiFeedback && (
              <Card className={cn("border-2", getFeedbackCardColor())}>
                <CardHeader>
                  <CardTitle className="font-headline flex items-center">
                    <MessageCircle className="mr-2 h-6 w-6"/> Feedback da IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="whitespace-pre-line">{aiFeedback.feedback}</p>
                  <div className="flex justify-end space-x-2 pt-2 border-t">
                    <Button variant="ghost" size="sm"><ThumbsUp className="mr-1 h-4 w-4"/> Útil</Button>
                    <Button variant="ghost" size="sm"><ThumbsDown className="mr-1 h-4 w-4"/> Não útil</Button>
                  </div>
                </CardContent>
              </Card>
            )}
            </div>
          )}
           {simulationStarted && !simulationFinished && (
             <div className="text-center mt-4">
                <Button onClick={handleStartSimulation} variant="outline">
                    Reiniciar Simulação
                </Button>
             </div>
           )}
        </>
      )}
    </div>
  );
}

    