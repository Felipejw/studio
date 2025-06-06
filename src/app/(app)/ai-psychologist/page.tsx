
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
import { Loader2, Sparkles, MessageSquare, Activity } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { db, collection, addDoc, query, where, orderBy, getDocs } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';

const formSchema = z.object({
  feelings: z.string().min(10, { message: "Descreva seus sentimentos com pelo menos 10 caracteres." }),
  emotionalState: z.number().min(0).max(10),
});

type PsychologistFormValues = z.infer<typeof formSchema>;

interface ChatEntryFirestore {
  userId: string;
  userInput: PsychologistFormValues;
  aiResponse: GetAiPsychologistResponseOutput;
  timestamp: Date; 
}

interface ChatEntry extends ChatEntryFirestore {
  id: string; 
}


export default function AiPsychologistPage() {
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const { toast } = useToast();
  const { userId, user } = useAuth();

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
        const data = doc.data();
        fetchedHistory.push({
          ...data,
          id: doc.id,
          timestamp: (data.timestamp as any).toDate ? (data.timestamp as any).toDate() : new Date(data.timestamp)
        } as ChatEntry);
      });
      setChatHistory(fetchedHistory);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Carregar Histórico",
        description: "Não foi possível buscar o histórico de conversas.",
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
    setIsLoading(true);
    try {
      const response = await getAiPsychologistResponse(data);
      
      const newEntryToSave: ChatEntryFirestore = {
        userId: userId,
        userInput: data,
        aiResponse: response,
        timestamp: new Date(),
      };
      await addDoc(collection(db, "mindset_logs"), newEntryToSave);
      
      toast({
        title: "Resposta Recebida!",
        description: "Sua conversa com o Psicólogo IA foi salva.",
      });
      form.reset();
      fetchChatHistory(); 
    } catch (error) {
      console.error("Error getting AI response or saving log:", error);
      toast({
        variant: "destructive",
        title: "Erro na Interação",
        description: "Não foi possível obter resposta da IA ou salvar o log.",
      });
    }
    setIsLoading(false);
  };

  if (!user) return null;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 font-headline">Psicólogo Virtual com IA</h1>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
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
                  <Button type="submit" disabled={isLoading || !userId} className="w-full">
                    {isLoading ? (
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

          { (isLoadingHistory || chatHistory.length > 0) && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="font-headline flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5" /> Histórico de Conversas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2">Carregando histórico...</p>
                  </div>
                ) : chatHistory.length === 0 ? (
                  <p className="text-muted-foreground">Nenhuma conversa anterior encontrada.</p>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
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

        <div className="md:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center"><Activity className="mr-2 h-5 w-5" />Teste Semanal</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                        Como está seu emocional para o trade esta semana?
                    </p>
                    <Button variant="outline" className="w-full" disabled>Iniciar Teste (Em breve)</Button>
                    <p className="text-xs text-muted-foreground mt-2">
                        Este teste rápido ajudará a avaliar sua prontidão emocional para os desafios do mercado.
                    </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Dica Rápida</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm">
                       Lembre-se: a gestão emocional é tão crucial quanto a análise técnica. Pausas regulares e autoavaliação são chaves para a consistência.
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
