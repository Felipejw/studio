'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UploadCloud, Sparkles, TrendingUp, GitBranch, CheckSquare, Info } from 'lucide-react';
import Image from 'next/image';

export default function PrintAnalysisPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <Sparkles className="h-16 w-16 mx-auto text-primary mb-4" />
        <h1 className="text-4xl font-bold font-headline">Análise de Print com IA (Premium)</h1>
        <p className="text-xl text-muted-foreground mt-2">
          Potencialize suas decisões com a inteligência artificial analisando seus gráficos.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><UploadCloud className="mr-2 h-6 w-6 text-primary"/> Faça Upload do seu Gráfico</CardTitle>
              <CardDescription>Envie uma imagem do seu gráfico e deixe nossa IA fazer a análise.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input type="file" disabled className="cursor-not-allowed" />
              <Button className="w-full" disabled>
                <Sparkles className="mr-2 h-4 w-4" /> Analisar com IA (Recurso Premium)
              </Button>
              <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                <Info className="inline h-4 w-4 mr-1" />
                Esta funcionalidade está disponível apenas para assinantes do plano Premium.
                <Link href="/profile" className="text-primary hover:underline font-semibold ml-1">Conheça nossos planos.</Link>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
            <Card className="bg-secondary/30 border-dashed">
                <CardHeader>
                    <CardTitle className="font-headline text-lg">O que a IA retorna?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                        <TrendingUp className="h-5 w-5 text-primary mt-1 shrink-0"/>
                        <div>
                            <p className="font-semibold">Tendência Identificada</p>
                            <p className="text-muted-foreground">Alta, baixa ou lateral/indefinida.</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-3">
                        <GitBranch className="h-5 w-5 text-primary mt-1 shrink-0"/>
                        <div>
                            <p className="font-semibold">Sinal Sugerido</p>
                            <p className="text-muted-foreground">Compra, Venda ou Aguardar melhor oportunidade.</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-3">
                        <CheckSquare className="h-5 w-5 text-primary mt-1 shrink-0"/>
                        <div>
                            <p className="font-semibold">Grau de Confiança</p>
                            <p className="text-muted-foreground">Baixo, médio ou alto, para o sinal sugerido.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-primary mt-1 shrink-0"/>
                        <div>
                            <p className="font-semibold">Explicação Simplificada</p>
                            <p className="text-muted-foreground">Justificativa da IA para a análise.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <p className="text-xs text-center mt-4 text-muted-foreground">
                Limitado a X análises/dia no plano pago. Recompensa por indicação (ex: 3 prints grátis se indicar 1 amigo).
            </p>
        </div>
      </div>
       <div className="mt-12 text-center">
         <Image src="https://placehold.co/600x300.png" alt="Exemplo de análise de print" width={600} height={300} className="rounded-lg shadow-lg mx-auto" data-ai-hint="chart analysis example"/>
         <p className="text-sm text-muted-foreground mt-2">Exemplo visual de como a IA pode apresentar a análise.</p>
       </div>
    </div>
  );
}

// Need to add a Link component if it's not auto-imported.
import Link from 'next/link';
