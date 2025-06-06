
'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { generateDailyPlan, type GenerateDailyPlanInput, type GenerateDailyPlanOutput } from '@/ai/flows/generate-daily-plan';
import { Loader2, Wand2, ShieldAlert } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { db, collection, addDoc, Timestamp } from '@/lib/firebase'; // Timestamp added
import { useAuth } from '@/components/auth-provider';
import Link from 'next/link';

const setupsOptions = [
  { id: 'scalping', label: 'Scalping' },
  { id: 'daytrade', label: 'Day Trade (Tendência)' },
  { id: 'swingtrade', label: 'Swing Trade (Gráfico Semanal)' },
  { id: 'reversao', label: 'Reversão à Média' },
  { id: 'rompimento', label: 'Rompimento' },
];

const formSchema = z.object({
  gainGoal: z.coerce.number().positive({ message: "Meta de ganho deve ser positiva." }),
  lossLimit: z.coerce.number().positive({ message: "Limite de perda deve ser positivo." }),
  setups: z.array(z.string()).min(1, { message: "Selecione ao menos um setup." }),
  energyLevel: z.number().min(0).max(10),
  emotion: z.enum(['tranquilo', 'ansioso', 'confiante', 'cansado']),
  tradingPeriod: z.enum(['manhã', 'tarde', 'o dia todo']),
});

type DailyPlanFormValues = z.infer<typeof formSchema>;

function AccessDeniedPremium() {
  return (
    <div className="container mx-auto py-12 flex justify-center items-center">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
            <ShieldAlert className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="mt-4 font-headline text-2xl">Acesso Premium Necessário</CardTitle>
          <CardDescription>
            A funcionalidade de Plano Diário com IA é exclusiva para assinantes do Plano Premium.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-sm">
            Faça upgrade do seu plano para receber planos de trading personalizados pela nossa inteligência artificial, definindo suas metas, setups e estado emocional.
          </p>
          <Button asChild size="lg" className="w-full">
            <Link href="/pricing">Ver Planos Premium</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


export default function DailyPlanPage() {
  const [aiResponse, setAiResponse] = useState<GenerateDailyPlanOutput | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const { toast } = useToast();
  const { user, userId, userProfile, loading: authLoading, profileLoading } = useAuth();

  const form = useForm<DailyPlanFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gainGoal: 100,
      lossLimit: 50,
      setups: [],
      energyLevel: 7,
      emotion: 'tranquilo',
      tradingPeriod: 'manhã',
    },
  });

  const onSubmit: SubmitHandler<DailyPlanFormValues> = async (data) => {
    if (!userId) {
      toast({ variant: "destructive", title: "Erro de Autenticação", description: "Usuário não autenticado." });
      return;
    }
    setIsGeneratingPlan(true);
    setAiResponse(null);
    try {
      const response = await generateDailyPlan(data as GenerateDailyPlanInput);
      setAiResponse(response);

      await addDoc(collection(db, "trading_plans"), {
        ...data,
        aiGeneratedPlan: response,
        userId: userId,
        createdAt: Timestamp.fromDate(new Date()), // Use Timestamp
      });

      toast({
        title: "Plano Gerado e Salvo!",
        description: "Seu plano diário foi criado pela IA e salvo.",
      });

    } catch (error) {
      console.error("Error generating or saving plan:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Gerar Plano",
        description: "Não foi possível gerar ou salvar o plano. Tente novamente.",
      });
    }
    setIsGeneratingPlan(false);
  };
  
  const isLoading = authLoading || profileLoading;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3">Carregando...</p>
      </div>
    );
  }

  if (!user) return null; // AuthProvider handles redirect

  if (userProfile?.plan !== 'premium' && userProfile?.email !== 'felipejw.fm@gmail.com') { // Admin override for testing
    return <AccessDeniedPremium />;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 font-headline">Plano Diário Inteligente</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Configure seu Dia</CardTitle>
            <CardDescription>Informe seus parâmetros para a IA gerar um plano personalizado.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="gainGoal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qual é sua meta de ganho hoje?</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lossLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qual é seu limite de perda?</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="setups"
                  render={() => (
                    <FormItem>
                      <FormLabel>Quais setups pretende usar?</FormLabel>
                      {setupsOptions.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="setups"
                          render={({ field }) => {
                            return (
                              <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), item.id])
                                        : field.onChange(
                                            (field.value || []).filter(
                                              (value) => value !== item.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {item.label}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="energyLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível de energia e foco (0 a 10): {field.value}</FormLabel>
                      <FormControl>
                        <Slider
                          defaultValue={[field.value]}
                          max={10}
                          step={1}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="emotion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emoção antes de operar</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione sua emoção" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="tranquilo">Tranquilo(a)</SelectItem>
                          <SelectItem value="ansioso">Ansioso(a)</SelectItem>
                          <SelectItem value="confiante">Confiante</SelectItem>
                          <SelectItem value="cansado">Cansado(a)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tradingPeriod"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Período que pretende operar</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="manhã" />
                            </FormControl>
                            <FormLabel className="font-normal">Manhã</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="tarde" />
                            </FormControl>
                            <FormLabel className="font-normal">Tarde</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="o dia todo" />
                            </FormControl>
                            <FormLabel className="font-normal">O dia todo</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" disabled={isGeneratingPlan || !userId} className="w-full">
                  {isGeneratingPlan ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  Gerar Plano com IA
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className={isGeneratingPlan || aiResponse ? 'block' : 'hidden'}>
          <CardHeader>
            <CardTitle className="font-headline">Seu Plano Diário Personalizado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isGeneratingPlan && !aiResponse && (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Gerando seu plano...</p>
              </div>
            )}
            {aiResponse && (
              <>
                <div>
                  <h3 className="font-semibold mb-1">Regras para o dia:</h3>
                  <p className="text-sm whitespace-pre-line">{aiResponse.rules}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Sugestões de horário:</h3>
                  <p className="text-sm whitespace-pre-line">{aiResponse.suggestedTimes}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Gatilhos mentais para foco:</h3>
                  <p className="text-sm whitespace-pre-line">{aiResponse.focusTriggers}</p>
                </div>
                {aiResponse.noTradeAlert && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                    <h3 className="font-semibold text-destructive mb-1">Alerta Importante:</h3>
                    <p className="text-sm text-destructive whitespace-pre-line">{aiResponse.noTradeAlert}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
