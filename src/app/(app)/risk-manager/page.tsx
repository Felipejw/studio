'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Landmark, Percent, Target, ShieldOff, Calculator, AlertTriangle, CheckCircle, ListCollapse } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";


const riskSettingsSchema = z.object({
  availableCapital: z.coerce.number().positive("Capital deve ser positivo."),
  riskPerTradePercent: z.coerce.number().min(0.1, "Risco deve ser >= 0.1%").max(100, "Risco deve ser <= 100%"),
  dailyProfitTarget: z.coerce.number().positive("Meta de lucro deve ser positiva."),
  dailyLossLimit: z.coerce.number().positive("Limite de perda deve ser positivo."),
});

type RiskSettingsFormValues = z.infer<typeof riskSettingsSchema>;

interface RiskSettings extends RiskSettingsFormValues {
  // Potential future fields
}

export default function RiskManagerPage() {
  const [settings, setSettings] = useState<RiskSettings | null>(null);
  const [suggestedLotSize, setSuggestedLotSize] = useState<number | null>(null);
  const [currentPL, setCurrentPL] = useState(0); // Mock P/L for demonstrating alerts
  const { toast } = useToast();

  const form = useForm<RiskSettingsFormValues>({
    resolver: zodResolver(riskSettingsSchema),
    defaultValues: {
      availableCapital: 10000,
      riskPerTradePercent: 1,
      dailyProfitTarget: 200,
      dailyLossLimit: 100,
    },
  });

  useEffect(() => {
    // Load saved settings if available (e.g., from localStorage or API)
    const savedSettings = localStorage.getItem('riskSettingsTraderCockpit');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(parsedSettings);
      form.reset(parsedSettings);
    } else {
       // Initialize with default if no saved settings
      setSettings(form.getValues());
    }
  }, [form]);

  const onSubmit: SubmitHandler<RiskSettingsFormValues> = (data) => {
    setSettings(data);
    localStorage.setItem('riskSettingsTraderCockpit', JSON.stringify(data));
    toast({
        title: "Configurações Salvas!",
        description: "Suas novas configurações de risco foram aplicadas.",
    });
    // Recalculate lot size if necessary, or clear it
    setSuggestedLotSize(null); 
  };
  
  const calculateLotSize = (stopPoints: number) => {
    if (settings && stopPoints > 0) {
      const riskAmount = (settings.availableCapital * settings.riskPerTradePercent) / 100;
      // Assuming 1 point = R$0.20 for mini-índice, or R$10 for mini-dólar. This needs to be asset-specific.
      // For simplicity, let's assume a generic "points value" can be configured or is fixed per asset.
      // This is a highly simplified example. Real lot calculation is more complex.
      const pointValue = 0.20; // Example for mini-índice.
      const lot = Math.floor(riskAmount / (stopPoints * pointValue));
      setSuggestedLotSize(lot > 0 ? lot : 1); // Suggest at least 1 lot if calculation is < 1 but positive risk
    } else {
      setSuggestedLotSize(null);
    }
  };

  // Mock alerts based on current P/L
  const profitTargetReached = settings && currentPL >= settings.dailyProfitTarget;
  const lossLimitReached = settings && currentPL <= -settings.dailyLossLimit;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 font-headline">Gestor de Risco</h1>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Configurações de Risco</CardTitle>
              <CardDescription>Defina seus parâmetros de gerenciamento de risco.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="availableCapital" render={({ field }) => (
                      <FormItem><FormLabel className="flex items-center"><Landmark className="mr-2 h-4 w-4"/>Capital Disponível (R$)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  <FormField control={form.control} name="riskPerTradePercent" render={({ field }) => (
                      <FormItem><FormLabel className="flex items-center"><Percent className="mr-2 h-4 w-4"/>Risco por Operação (%)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="dailyProfitTarget" render={({ field }) => (
                      <FormItem><FormLabel className="flex items-center"><Target className="mr-2 h-4 w-4"/>Meta Diária de Lucro (R$)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  <FormField control={form.control} name="dailyLossLimit" render={({ field }) => (
                      <FormItem><FormLabel className="flex items-center"><ShieldOff className="mr-2 h-4 w-4"/>Limite de Perda Diária (R$)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <Button type="submit" className="w-full md:w-auto">Salvar Configurações</Button>
              </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><Calculator className="mr-2 h-5 w-5" />Calculadora de Lote Sugerido</CardTitle>
              <CardDescription>Informe o tamanho do seu stop em pontos/ticks para calcular o lote.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="stopPoints">Stop da Operação (em pontos/ticks)</Label>
                <Input 
                  id="stopPoints" 
                  type="number" 
                  placeholder="Ex: 150 (para WIN) ou 5 (para WDO)" 
                  onChange={(e) => calculateLotSize(parseFloat(e.target.value))}
                />
              </div>
              {suggestedLotSize !== null && (
                <Alert>
                  <AlertTitle>Lote Sugerido</AlertTitle>
                  <AlertDescription>
                    Com base no seu risco de {settings?.riskPerTradePercent}% (R$ {((settings?.availableCapital || 0) * (settings?.riskPerTradePercent || 0) / 100).toFixed(2)}) e stop informado, o lote sugerido é: <strong>{suggestedLotSize} contrato(s)</strong>.
                    <br/><span className="text-xs">(Cálculo simplificado, considere o valor do ponto do ativo.)</span>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><AlertTriangle className="mr-2 h-5 w-5"/>Alertas Atuais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Mock P/L Input for demo */}
              <div className="mb-4">
                <Label htmlFor="currentPL">Simular P/L do Dia (R$)</Label>
                <Input id="currentPL" type="number" value={currentPL} onChange={e => setCurrentPL(parseFloat(e.target.value) || 0)} />
              </div>
              
              {!lossLimitReached && !profitTargetReached && (
                <p className="text-sm text-muted-foreground">Nenhum alerta crítico no momento.</p>
              )}
              {lossLimitReached && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Limite de Perda Atingido!</AlertTitle>
                  <AlertDescription>Você atingiu seu limite de R$ {settings?.dailyLossLimit.toFixed(2)}. Sugerimos parar por hoje para proteger seu capital.</AlertDescription>
                </Alert>
              )}
              {profitTargetReached && (
                <Alert variant="default" className="bg-green-100 dark:bg-green-900 border-green-500 text-green-700 dark:text-green-300">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertTitle className="text-green-700 dark:text-green-300">Meta Diária Alcançada!</AlertTitle>
                  <AlertDescription>Parabéns! Você atingiu sua meta de R$ {settings?.dailyProfitTarget.toFixed(2)}. Considere realizar o lucro.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><ListCollapse className="mr-2 h-5 w-5"/>Recursos Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">Histórico de quebras de plano (Em breve).</p>
              <p className="text-muted-foreground">Recomendações para melhorar controle emocional e disciplina (Em breve).</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
