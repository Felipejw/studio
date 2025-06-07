
// src/app/(app)/trader-profile-test/page.tsx
'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Wand2, ShieldAlert, UserCheck, ClipboardList, Lightbulb, BarChart, TargetIcon, Settings, Brain } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/components/auth-provider';
import Link from 'next/link';
import { 
  getTraderProfileSuggestions, 
  type GetTraderProfileSuggestionsInput, 
  type GetTraderProfileSuggestionsOutput,
  GetTraderProfileSuggestionsInputSchema 
} from '@/ai/flows/get-trader-profile-suggestions';

type TraderProfileTestFormValues = GetTraderProfileSuggestionsInput;

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
            O Teste de Perfil de Trader com IA é exclusivo para assinantes do Plano Premium.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-sm">
            Faça upgrade para descobrir seu perfil de trader, receber sugestões de setups, metas e abordagens personalizadas pela nossa IA.
          </p>
          <Button asChild size="lg" className="w-full">
            <Link href="/pricing">Ver Planos Premium</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TraderProfileTestPage() {
  const [testResult, setTestResult] = useState<GetTraderProfileSuggestionsOutput | null>(null);
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);
  const { toast } = useToast();
  const { user, userId, userProfile, loading: authLoading, profileLoading } = useAuth();

  const form = useForm<TraderProfileTestFormValues>({
    resolver: zodResolver(GetTraderProfileSuggestionsInputSchema),
    defaultValues: {
      preferredFrequency: 'frequente',
      timeHorizon: 'horas',
      riskPerTradePercent: 1.5,
      reactionToLossStreak: 'calmo_plano',
      impulsivenessScale: 5,
      decisionBasis: 'analise_tecnica',
      experienceLevel: 'iniciante',
      preferredMarketTime: 'abertura',
    },
  });

  const onSubmit: SubmitHandler<TraderProfileTestFormValues> = async (data) => {
    if (!userId) {
      toast({ variant: "destructive", title: "Erro de Autenticação", description: "Usuário não autenticado." });
      return;
    }
    setIsGeneratingProfile(true);
    setTestResult(null);
    try {
      const response = await getTraderProfileSuggestions(data);
      setTestResult(response);
      toast({
        title: "Perfil Analisado!",
        description: "Seu perfil de trader e sugestões foram gerados pela IA.",
      });
    } catch (error: any) {
      console.error("Error generating trader profile:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Gerar Perfil",
        description: error.message || "Não foi possível gerar seu perfil. Tente novamente.",
      });
    }
    setIsGeneratingProfile(false);
  };
  
  const overallLoading = authLoading || profileLoading;

  if (overallLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3">Carregando...</p>
      </div>
    );
  }

  if (!user) return null; 

  if (userProfile?.plan !== 'premium' && userProfile?.email !== 'felipejw.fm@gmail.com') {
    return <AccessDeniedPremium />;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 font-headline flex items-center">
        <ClipboardList className="mr-3 h-8 w-8 text-primary" />
        Teste de Perfil de Trader com IA
      </h1>
      
      {!testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Responda ao Questionário</CardTitle>
            <CardDescription>Suas respostas ajudarão a IA a identificar seu perfil e fornecer sugestões personalizadas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField control={form.control} name="preferredFrequency" render={({ field }) => (
                    <FormItem className="space-y-3"><FormLabel>Com que frequência você prefere operar?</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                          <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="muito_frequente" /></FormControl><FormLabel className="font-normal">Muito Frequente (várias vezes ao dia)</FormLabel></FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="frequente" /></FormControl><FormLabel className="font-normal">Frequente (algumas vezes ao dia)</FormLabel></FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="as_vezes" /></FormControl><FormLabel className="font-normal">Às Vezes (algumas vezes por semana)</FormLabel></FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="raramente" /></FormControl><FormLabel className="font-normal">Raramente</FormLabel></FormItem>
                        </RadioGroup>
                      </FormControl><FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="timeHorizon" render={({ field }) => (
                    <FormItem><FormLabel>Qual seu horizonte de tempo preferido para uma operação?</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="minutos">Minutos (Scalping/Day Trading)</SelectItem>
                          <SelectItem value="horas">Horas (Day Trading)</SelectItem>
                          <SelectItem value="dias">Dias (Swing Trading Curto)</SelectItem>
                          <SelectItem value="semanas">Semanas (Swing/Position Trading)</SelectItem>
                        </SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="riskPerTradePercent" render={({ field }) => (
                    <FormItem><FormLabel>Que percentual do seu capital você se sente confortável em arriscar por operação? ({field.value}%)</FormLabel>
                      <FormControl><Slider defaultValue={[field.value]} min={0.5} max={5} step={0.1} onValueChange={(v) => field.onChange(v[0])} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="reactionToLossStreak" render={({ field }) => (
                    <FormItem><FormLabel>Como você geralmente reage a uma sequência de perdas?</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="calmo_plano">Mantenho a calma e sigo o plano</SelectItem>
                          <SelectItem value="ansioso_continua">Fico ansioso, mas continuo operando</SelectItem>
                          <SelectItem value="para_um_tempo">Paro de operar por um tempo para reavaliar</SelectItem>
                          <SelectItem value="tenta_recuperar_rapido">Tento recuperar as perdas rapidamente</SelectItem>
                        </SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="impulsivenessScale" render={({ field }) => (
                    <FormItem><FormLabel>Em uma escala de 0 (nada impulsivo) a 10 (muito impulsivo), quão impulsivo você se considera ao operar? ({field.value})</FormLabel>
                      <FormControl><Slider defaultValue={[field.value]} min={0} max={10} step={1} onValueChange={(v) => field.onChange(v[0])} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="decisionBasis" render={({ field }) => (
                    <FormItem><FormLabel>Qual a principal base para suas decisões de trading?</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="analise_tecnica">Análise Técnica (gráficos, indicadores)</SelectItem>
                          <SelectItem value="analise_fundamentalista">Análise Fundamentalista (notícias, balanços)</SelectItem>
                          <SelectItem value="sentimento_mercado">Sentimento do Mercado (fluxo, notícias gerais)</SelectItem>
                          <SelectItem value="misto">Uma combinação dos anteriores</SelectItem>
                        </SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="experienceLevel" render={({ field }) => (
                    <FormItem><FormLabel>Qual seu nível de experiência no trading?</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="iniciante">Iniciante (menos de 1 ano)</SelectItem>
                          <SelectItem value="intermediario">Intermediário (1 a 3 anos)</SelectItem>
                          <SelectItem value="avancado">Avançado (mais de 3 anos)</SelectItem>
                        </SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="preferredMarketTime" render={({ field }) => (
                    <FormItem><FormLabel>Qual seu horário preferido para operar / tem mais disponibilidade?</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="abertura">Abertura do mercado</SelectItem>
                          <SelectItem value="meio_pregao">Meio do pregão</SelectItem>
                          <SelectItem value="fechamento">Fechamento do mercado</SelectItem>
                          <SelectItem value="qualquer_horario">Qualquer horário (flexível)</SelectItem>
                          <SelectItem value="fora_horario_comercial">Fora do horário comercial / Noturno (ex: Forex, Cripto)</SelectItem>
                        </SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isGeneratingProfile || !userId} className="w-full text-lg py-3">
                  {isGeneratingProfile ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Wand2 className="mr-2 h-5 w-5" />}
                  Analisar Perfil com IA
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {isGeneratingProfile && !testResult && (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">A IA está analisando suas respostas e gerando seu perfil...</p>
          </CardContent>
        </Card>
      )}

      {testResult && (
        <div className="mt-8 space-y-6">
          <Card className="shadow-lg border-primary">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center text-primary">
                <UserCheck className="mr-2 h-7 w-7" /> Seu Perfil de Trader: {testResult.traderProfileType}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{testResult.profileDescription}</p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="font-headline text-lg flex items-center"><Settings className="mr-2 h-5 w-5"/>Setups e Estratégias Sugeridas</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {testResult.suggestedSetups.map((setup, index) => <li key={index}>{setup}</li>)}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="font-headline text-lg flex items-center"><BarChart className="mr-2 h-5 w-5"/>Foco em Ativos/Mercados</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {testResult.suggestedAssetFocus.map((asset, index) => <li key={index}>{asset}</li>)}
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader><CardTitle className="font-headline text-lg flex items-center"><ShieldAlert className="mr-2 h-5 w-5"/>Gerenciamento de Risco</CardTitle></CardHeader>
            <CardContent><p className="text-sm whitespace-pre-line">{testResult.riskManagementApproach}</p></CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle className="font-headline text-lg flex items-center"><Brain className="mr-2 h-5 w-5"/>Perfil Psicológico e Comportamental</CardTitle></CardHeader>
            <CardContent><p className="text-sm whitespace-pre-line">{testResult.psychologicalProfile}</p></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="font-headline text-lg flex items-center"><TargetIcon className="mr-2 h-5 w-5"/>Rotina Recomendada</CardTitle></CardHeader>
            <CardContent><p className="text-sm whitespace-pre-line">{testResult.recommendedRoutine}</p></CardContent>
          </Card>

          {testResult.additionalAdvice && (
            <Card>
              <CardHeader><CardTitle className="font-headline text-lg flex items-center"><Lightbulb className="mr-2 h-5 w-5"/>Conselhos Adicionais</CardTitle></CardHeader>
              <CardContent><p className="text-sm whitespace-pre-line">{testResult.additionalAdvice}</p></CardContent>
            </Card>
          )}

          <Button onClick={() => { setTestResult(null); form.reset(); }} variant="outline" className="w-full">
            Fazer Novo Teste
          </Button>
        </div>
      )}
    </div>
  );
}
