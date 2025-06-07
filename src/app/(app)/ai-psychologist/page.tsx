
'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAiPsychologistResponse, type GetAiPsychologistResponseInput, type GetAiPsychologistResponseOutput } from '@/ai/flows/get-ai-psychologist-response';
import { Loader2, Sparkles, MessageSquare, ShieldAlert } from 'lucide-react'; // Activity removed
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { db, collection, query, where, orderBy, getDocs, Timestamp } from '@/lib/firebase'; 
import { useAuth } from '@/components/auth-provider';
import Link from 'next/link';

const formSchema = z.object({
  feelings: z.string().min(10, { message: "Descreva seus sentimentos com pelo menos 10 caracteres." }),
  emotionalState: z.number().min(0).max(10),
});

type PsychologistFormValues = z.infer<typeof formSchema>;

interface ChatEntryFirestore {
  userId: string;
  userInput: PsychologistFormValues;
  aiResponse: GetAiPsychologistResponseOutput;
  timestamp: Timestamp; 
}

interface ChatEntry extends Omit<ChatEntryFirestore, 'timestamp'> {
  id: string; 
  timestamp: Date; 
}

interface LatestInteraction {
  userInput: PsychologistFormValues;
  aiResponse: GetAiPsychologistResponseOutput;
}

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
            A funcionalidade de Psicólogo Virtual com IA é exclusiva para assinantes do Plano Premium.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-sm">
            Faça upgrade para ter acesso a um psicólogo virtual que te ajudará a entender e gerenciar suas emoções no trading.
          </p>
          <Button asChild size="lg" className="w-full">
            <Link href="/pricing">Ver Planos Premium</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AiPsychologistPage() {
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [latestInteraction, setLatestInteraction] = useState<LatestInteraction | null>(null);
  const { toast } = useToast();
  const { user, userId, userProfile, loading: authLoading, profileLoading } = useAuth();

  const form = useForm<PsychologistFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      feelings: '',
      emotionalState: 5,
    },
  });

  const fetchChatHistory = async () => {
    if (!userId) {
      setIsLoadingHistory(false);
      setChatHistory([]);
      return;
    }
    setIsLoadingHistory(true);
    try {
      const q = query(
        collection(db, "mindset_logs"),
        where("userId", "==", userId),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);
      const fetchedHistory: ChatEntry[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as ChatEntryFirestore; 
        fetchedHistory.push({
          ...data,
          id: doc.id,
          timestamp: data.timestamp.toDate() 
        } as ChatEntry);
      });
      setChatHistory(fetchedHistory);
    } catch (error) {
      console.error("Detailed chat history error:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Carregar Histórico",
        description: "Não foi possível buscar o histórico de conversas. Verifique o console.",
      });
    }
    setIsLoadingHistory(false);
  };

  useEffect(() => {
    if (userId) {
      fetchChatHistory();
    } else {
      setIsLoadingHistory(false);
      setChatHistory([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const onSubmit: SubmitHandler<PsychologistFormValues> = async (data) => {
    if (!userId) {
      toast({ variant: "destructive", title: "Erro de Autenticação", description: "Usuário não autenticado." });
      return;
    }
    setIsSubmittingForm(true);
    setLatestInteraction(null); // Clear previous latest interaction
    try {
      const response = await getAiPsychologistResponse(data);
      
      setLatestInteraction({ userInput: data, aiResponse: response });
      
      toast({
        title: "Resposta da IA Recebida!",
        description: "A IA respondeu à sua consulta.",
      });
      form.reset();
      // We don't save the new interaction, but old history can still be relevant
      // fetchChatHistory(); // Optionally re-fetch if needed, but new entry won't be there.
                           // Let's keep it to show previous logs persist.
    } catch (error: any) {
      console.error("Detailed AI response error:", error);
      toast({
        variant: "destructive",
        title: "Erro na Interação com IA",
        description: `Não foi possível obter resposta da IA. ${error?.message || 'Verifique o console para mais detalhes.'}`,
      });
    }
    setIsSubmittingForm(false);
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
      <h1 className="text-3xl font-bold mb-8 font-headline">Psicólogo Virtual com IA</h1>
      
      <div className="grid grid-cols-1 gap-8"> {/* Simplified grid */}
        <div> {/* Main content area */}
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Como você está se sentindo?</CardTitle>
              <CardDescription>Descreva seus sentimentos e receba apoio da nossa IA.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="feelings"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Como você se sentiu hoje / está se sentindo agora?</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva em detalhes como os trades de hoje afetaram você, ou como você está se sentindo antes de começar a operar..."
                            rows={5}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emotionalState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nível emocional atual (0 = Muito mal, 10 = Excelente): {field.value}</FormLabel>
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
                  <Button type="submit" disabled={isSubmittingForm || !userId} className="w-full">
                    {isSubmittingForm ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Receber Apoio da IA
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {latestInteraction && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="font-headline flex items-center">
                  <Sparkles className="mr-2 h-5 w-5 text-primary" /> Resposta Atual da IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold mb-1">Você:</p>
                <p className="text-sm mb-3 whitespace-pre-line bg-muted p-2 rounded">{latestInteraction.userInput.feelings} (Emoção: {latestInteraction.userInput.emotionalState}/10)</p>
                <p className="font-semibold mb-1 text-primary">IA Psicólogo:</p>
                <p className="text-sm whitespace-pre-line bg-primary/10 p-2 rounded">{latestInteraction.aiResponse.advice}</p>
              </CardContent>
            </Card>
          )}

          { (isLoadingHistory || chatHistory.length > 0) && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="font-headline flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5" /> Histórico de Conversas Salvas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2">Carregando histórico...</p>
                  </div>
                ) : chatHistory.length === 0 ? (
                  <p className="text-muted-foreground">Nenhuma conversa anterior salva encontrada.</p>
                ) : (
                  <ScrollArea className="max-h-[60vh] md:max-h-[400px] pr-4">
                    <div className="space-y-6">
                      {chatHistory.map(entry => (
                        <div key={entry.id} className="p-4 border rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">
                            {entry.timestamp.toLocaleString('pt-BR')} - Emoção: {entry.userInput.emotionalState}/10
                          </p>
                          <p className="font-semibold mb-1">Você:</p>
                          <p className="text-sm mb-3 whitespace-pre-line bg-muted p-2 rounded">{entry.userInput.feelings}</p>
                          <p className="font-semibold mb-1 text-primary">IA Psicólogo:</p>
                          <p className="text-sm whitespace-pre-line bg-primary/10 p-2 rounded">{entry.aiResponse.advice}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
