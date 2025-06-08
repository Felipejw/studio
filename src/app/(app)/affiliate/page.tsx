
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Copy, ExternalLink, Handshake, Info, Percent, UserPlus, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function AffiliatePage() {
  const { toast } = useToast();
  const affiliateLink = "https://app.kirvano.com/affiliate/aa6fbeed-59a6-48cb-8f84-be17fb6bbfa8";
  const kirvanoSignupLink = "https://app.kirvano.com/signup?ref=6W15P88Z";

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Link Copiado!",
        description: message,
      });
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      toast({
        variant: "destructive",
        title: "Falha ao Copiar",
        description: "Não foi possível copiar o link.",
      });
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-10">
        <Handshake className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-bold font-headline">Programa de Afiliados</h1>
        <p className="text-xl text-muted-foreground mt-2">
          Indique o Tubarões da Bolsa e ganhe comissões incríveis!
        </p>
      </div>

      <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Como Funciona?</CardTitle>
            <CardDescription>
              É simples e lucrativo participar do nosso programa de afiliados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start space-x-4 p-4 bg-muted/50 rounded-lg">
              <Percent className="h-10 w-10 text-primary mt-1 shrink-0" />
              <div>
                <h3 className="font-semibold text-lg">Comissão de 50%</h3>
                <p className="text-sm text-muted-foreground">
                  Você recebe 50% de comissão sobre cada venda do plano premium realizada através da sua indicação.
                  Uma das melhores comissões do mercado!
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-muted/50 rounded-lg">
              <Info className="h-10 w-10 text-primary mt-1 shrink-0" />
              <div>
                <h3 className="font-semibold text-lg">Processo Gerenciado pela Kirvano</h3>
                <p className="text-sm text-muted-foreground">
                  Todo o processo de afiliação, rastreamento de indicações e pagamentos de comissões é
                  realizado de forma transparente e segura através da plataforma Kirvano.
                </p>
              </div>
            </div>
             <Alert>
                <Gift className="h-4 w-4" />
                <AlertTitle className="font-semibold">Vantagens Exclusivas!</AlertTitle>
                <AlertDescription>
                  Ao se tornar nosso afiliado, você não só ganha comissões, mas também ajuda outros traders a
                  descobrirem ferramentas poderosas para aprimorar sua performance e disciplina.
                </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Já tem conta na Kirvano?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Use seu link de afiliado exclusivo para começar a indicar:</p>
              <div className="p-2 bg-secondary rounded-md text-sm break-all font-mono">
                {affiliateLink}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => copyToClipboard(affiliateLink, "Seu link de afiliado direto foi copiado.")}
                  className="w-full"
                  variant="outline"
                >
                  <Copy className="mr-2 h-4 w-4" /> Copiar Link
                </Button>
                <Button asChild className="w-full">
                  <a href={affiliateLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" /> Visitar Link
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Novo na Kirvano?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                1. Cadastre-se na Kirvano usando o link abaixo.
                <br />
                2. Após o cadastro, procure pelo produto "Tubarões da Bolsa" na vitrine de afiliados.
                <br />
                3. Solicite afiliação para obter seu link exclusivo.
              </p>
              <Button asChild className="w-full text-base py-3">
                <a href={kirvanoSignupLink} target="_blank" rel="noopener noreferrer">
                  <UserPlus className="mr-2 h-5 w-5" /> Cadastrar na Kirvano e Afiliar-se
                </a>
              </Button>
               <p className="text-xs text-center text-muted-foreground pt-2">
                Ao usar o link acima, você será direcionado para o cadastro na Kirvano.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
       <div className="mt-12 text-center text-muted-foreground text-sm">
        <p>Dúvidas sobre o programa de afiliados? <Link href="/contact" className="underline hover:text-primary">Entre em contato conosco</Link>.</p>
      </div>
    </div>
  );
}
