
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePickerWithPresets } from '@/components/ui/date-picker-with-presets'; // Assuming you might want this
import { LineChart, Play, Settings, Activity, Brain } from 'lucide-react';
import Image from 'next/image';

export default function MarketReplayPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline flex items-center">
          <Play className="mr-3 h-8 w-8" /> Market Replay (Simulação)
        </h1>
        <Button variant="outline" disabled>
          <Settings className="mr-2 h-4 w-4" /> Histórico de Simulações (Em breve)
        </Button>
      </div>

      <Card className="mb-6 bg-yellow-50 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700">
        <CardHeader>
          <CardTitle className="text-yellow-700 dark:text-yellow-400">Funcionalidade em Desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-600 dark:text-yellow-300">
            O Market Replay é uma ferramenta poderosa para praticar suas estratégias em um ambiente seguro, usando dados históricos do mercado.
            Esta seção está atualmente em desenvolvimento. Volte em breve para testar!
          </p>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Coluna de Configuração e Operação */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><Settings className="mr-2 h-5 w-5"/>Configurações da Simulação</CardTitle>
              <CardDescription>Defina os parâmetros para sua sessão de replay.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="replay-asset">Ativo</Label>
                  <Input id="replay-asset" placeholder="Ex: WINQ24, PETR4" defaultValue="WINQ24 (Futuro)" disabled />
                </div>
                <div>
                  <Label>Data Histórica</Label>
                  {/* Replace with a DatePicker if you have one, or keep as Input for placeholder */}
                  <Input type="date" defaultValue="2024-07-15" disabled />
                  {/* <DatePickerWithPresets disabled /> */}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                 <div>
                  <Label htmlFor="initial-capital">Capital Inicial (Simulado)</Label>
                  <Input id="initial-capital" type="number" placeholder="Ex: 10000" defaultValue="10000" disabled />
                </div>
                <div>
                  <Label htmlFor="replay-speed">Velocidade do Replay</Label>
                  <Input id="replay-speed" placeholder="Ex: 1x, 2x, 5x" defaultValue="1x (Normal)" disabled />
                </div>
              </div>
              <Button className="w-full sm:w-auto" disabled>
                <Play className="mr-2 h-4 w-4" /> Iniciar Simulação (Em breve)
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><LineChart className="mr-2 h-5 w-5"/>Painel de Operação</CardTitle>
              <CardDescription>Acompanhe o mercado e execute suas ordens.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                <Image 
                    src="https://placehold.co/600x300.png" 
                    alt="Placeholder de Gráfico de Replay" 
                    width={600} 
                    height={300}
                    className="object-contain max-w-full max-h-full"
                    data-ai-hint="stock chart graph" 
                />
              </div>
              <div className="flex justify-around gap-4">
                <Button variant="outline" className="flex-1" disabled>Comprar (Em breve)</Button>
                <Button variant="outline" className="flex-1" disabled>Vender (Em breve)</Button>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Saldo Atual (Simulado): R$ --.--</p>
                <p className="text-sm text-muted-foreground">P/L da Simulação: R$ --.--</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna de Resultados e Feedback */}
        <div className="lg:col-span-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><Activity className="mr-2 h-5 w-5"/>Resultados da Sessão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm"><span className="font-semibold">P/L Final:</span> R$ --.--</p>
              <p className="text-sm"><span className="font-semibold">Trades Realizados:</span> --</p>
              <p className="text-sm"><span className="font-semibold">Taxa de Acerto:</span> --%</p>
              <p className="text-sm"><span className="font-semibold">Maior Ganho:</span> R$ --.--</p>
              <p className="text-sm"><span className="font-semibold">Maior Perda:</span> R$ --.--</p>
              <Button variant="secondary" className="w-full" disabled>Ver Relatório Detalhado (Em breve)</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><Brain className="mr-2 h-5 w-5"/>Feedback da IA</CardTitle>
              <CardDescription>Análise do seu desempenho pela IA.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground italic">
                Após a simulação, a IA fornecerá feedback sobre sua disciplina, técnica e controle emocional... (Em breve)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
