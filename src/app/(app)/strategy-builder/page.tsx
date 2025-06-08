
// src/app/(app)/strategy-builder/page.tsx
'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2, ShieldAlert, Save, BrainCircuit, Lightbulb, AlertTriangle } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/components/auth-provider';
import Link from 'next/link';
import { 
  explainTradingSetup, 
  type ExplainTradingSetupInput, 
  type ExplainTradingSetupOutput 
} from '@/ai/flows/explain-trading-setup';
import { db, collection, addDoc, Timestamp } from '@/lib/firebase';
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
  name: z.string().min(3, { message: "Nome do setup deve ter pelo menos 3 caracteres." }),
  rules: z.string().min(10, { message: "Descreva as regras com pelo menos 10 caracteres." }),
  trigger: z.string().min(5, { message: "Descreva o gatilho com pelo menos 5 caracteres." }),
  idealAssets: z.string().min(3, { message: "Liste os ativos ideais (mínimo 3 caracteres)." }),
  visualExampleDescription: z.string().min(10, { message: "Descreva o exemplo visual com pelo menos 10 caracteres." }),
});

type StrategyBuilderFormValues = z.infer<typeof formSchema>;

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
            O Construtor de Estratégias com IA é exclusivo para assinantes do Plano Premium.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-sm">
            Faça upgrade para criar, explicar e salvar seus setups de trading com a ajuda da nossa Inteligência Artificial.
          </p>
          <Button asChild size="lg" className="w-full">
            <Link href="/pricing">Ver Planos Premium</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function StrategyBuilderPage() {
  const [aiExplanation, setAiExplanation] = useState<ExplainTradingSetupOutput | null>(null);
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState(false);
  const [isSavingSetup, setIsSavingSetup] = useState(false);
  const { toast } = useToast();
  const { user, userId, userProfile, loading: authLoading, profileLoading } = useAuth();

  const form = useForm<StrategyBuilderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      rules: '',
      trigger: '',
      idealAssets: '',
      visualExampleDescription: '',
    },
  });

  const handleGenerateExplanation: SubmitHandler<StrategyBuilderFormValues> = async (data) => {
    if (!userId) {
      toast({ variant: "destructive", title: "Erro de Autenticação", description: "Usuário não autenticado." });
      return;
    }
    setIsGeneratingExplanation(true);
    setAiExplanation(null);
    try {
      const response = await explainTradingSetup(data as ExplainTradingSetupInput);
      setAiExplanation(response);
      toast({
        title: "Explicação Gerada!",
        description: "A IA analisou e explicou seu setup.",
      });
    } catch (error: any) {
      console.error("Error generating explanation:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Gerar Explicação",
        description: error.message || "Não foi possível gerar a explicação. Tente novamente.",
      });
    }
    setIsGeneratingExplanation(false);
  };

  const handleSaveSetup: SubmitHandler<StrategyBuilderFormValues> = async (data) => {
    if (!userId) {
      toast({ variant: "destructive", title: "Erro de Autenticação", description: "Usuário não autenticado." });
      return;
    }
    if (!aiExplanation) {
      toast({ variant: "destructive", title: "Sem Explicação", description: "Gere uma explicação da IA antes de salvar." });
      return;
    }
    setIsSavingSetup(true);
    try {
      await addDoc(collection(db, "trading_setups"), {
        userId: userId,
        ...data,
        aiExplanation: aiExplanation,
        createdAt: Timestamp.fromDate(new Date()),
      });
      toast({
        title: "Setup Salvo!",
        description: "Seu setup e a explicação da IA foram salvos com sucesso.",
      });
      // Optionally reset form or navigate away
      // form.reset(); 
      // setAiExplanation(null);
    } catch (error: any) {
      console.error("Error saving setup:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Salvar Setup",
        description: error.message || "Não foi possível salvar o setup.",
      });
    }
    setIsSavingSetup(false);
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
        <BrainCircuit className="mr-3 h-8 w-8 text-primary" />
        Construtor de Estratégias com IA
      </h1>
      
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-headline">Defina seu Setup de Trading</CardTitle>
            <CardDescription>Preencha os detalhes da sua estratégia. A IA ajudará a explicá-la.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleGenerateExplanation)} className="space-y-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Nome do Setup</FormLabel>
                      <FormControl><Input placeholder="Ex: Martelo Reversor MM20" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="rules" render={({ field }) => (
                    <FormItem><FormLabel>Regras do Setup</FormLabel>
                      <FormControl><Textarea rows={3} placeholder="Descreva as condições que devem ser atendidas para validar uma entrada (ex: IFR abaixo de 30, preço acima da MM50, volume crescente)." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="trigger" render={({ field }) => (
                    <FormItem><FormLabel>Gatilho de Entrada</FormLabel>
                      <FormControl><Textarea rows={2} placeholder="Qual o sinal exato para entrar na operação? (ex: Rompimento da máxima do candle anterior, cruzamento de médias)." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="idealAssets" render={({ field }) => (
                    <FormItem><FormLabel>Ativos / Mercados Ideais</FormLabel>
                      <FormControl><Input placeholder="Ex: Mini Índice, PETR4, EUR/USD" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="visualExampleDescription" render={({ field }) => (
                    <FormItem><FormLabel>Descrição de um Exemplo Visual</FormLabel>
                      <FormControl><Textarea rows={3} placeholder="Descreva como seria uma imagem clara do setup em um gráfico. (ex: Um candle de alta engolfando o anterior após um toque na LTA, com volume acima da média)." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isGeneratingExplanation || isSavingSetup || !userId} className="w-full">
                  {isGeneratingExplanation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                  Gerar Explicação com IA
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="lg:col-span-1 space-y-6">
          {isGeneratingExplanation && !aiExplanation && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">A IA está analisando e explicando seu setup...</p>
              </CardContent>
            </Card>
          )}

          {aiExplanation && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center text-primary">
                  <Lightbulb className="mr-2 h-6 w-6" /> Análise da IA para "{form.getValues('name') || 'Setup'}"
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-350px)] md:h-[500px] pr-3"> {/* Adjust height as needed */}
                  <div className="space-y-5">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Explicação Detalhada:</h3>
                      <p className="text-sm whitespace-pre-line leading-relaxed bg-muted/50 p-3 rounded-md">{aiExplanation.explanation}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Análise de Adequação:</h3>
                      <p className="text-sm whitespace-pre-line leading-relaxed bg-muted/50 p-3 rounded-md">{aiExplanation.suitabilityAnalysis}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Pontos Chave e Dicas:</h3>
                      <ul className="list-disc pl-5 space-y-1 text-sm bg-muted/50 p-3 rounded-md">
                        {aiExplanation.keyTakeaways.map((takeaway, index) => (
                          <li key={index} className="leading-relaxed">{takeaway}</li>
                        ))}
                      </ul>
                    </div>
                     <Alert variant="default" className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Atenção!</AlertTitle>
                        <AlertDescription>
                          Esta análise é gerada por IA e serve como ferramenta de estudo e insight. 
                          Não é uma recomendação de investimento. Teste qualquer setup em ambiente simulado e gerencie seu risco.
                        </AlertDescription>
                      </Alert>
                  </div>
                </ScrollArea>
                <Button 
                  onClick={form.handleSubmit(handleSaveSetup)} 
                  disabled={isSavingSetup || isGeneratingExplanation || !userId} 
                  className="w-full mt-6"
                >
                  {isSavingSetup ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Setup e Análise da IA
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

