
// src/app/admin/webhook-info/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Info, KeyRound, Terminal } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function WebhookInfoPage() {
  const { user, authLoading, userProfile, profileLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/webhookKirvano` : '/api/webhookKirvano';
  const secretToken = "MEU_TOKEN_SECRETO"; // Este deve vir de uma variável de ambiente em produção

  useEffect(() => {
    const overallLoading = authLoading || profileLoading;
    if (!overallLoading) {
      if (!user || userProfile?.email !== 'felipejw.fm@gmail.com') {
        toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você não tem permissão para acessar esta página.' });
        router.replace('/dashboard');
      }
    }
  }, [user, userProfile, authLoading, profileLoading, router, toast]);

  if (authLoading || profileLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Verificando permissões...</p>
      </div>
    );
  }

  if (!userProfile || userProfile.email !== 'felipejw.fm@gmail.com') {
    return null; 
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-6">
          <div className="flex items-center space-x-2">
            <Info className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold font-headline">Informações do Webhook Kirvano</h1>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Admin Usuários
            </Link>
          </Button>
        </div>
      </header>
      <main className="container mx-auto py-8 px-4 md:px-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Configurando o Webhook na Plataforma Kirvano</CardTitle>
            <CardDescription>
              Utilize as informações abaixo para configurar o envio de notificações da Kirvano para o Tubarões da Bolsa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-1">URL do Endpoint:</h3>
              <p className="text-sm text-muted-foreground">Esta é a URL que você deve inserir na configuração de webhooks da Kirvano.</p>
              <div className="mt-2 p-3 bg-muted rounded-md text-sm break-all font-mono flex items-center gap-2">
                <Terminal className="h-4 w-4 shrink-0"/> {webhookUrl}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-1">Método HTTP:</h3>
              <p className="text-sm p-2 bg-muted rounded-md inline-block font-mono">POST</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-1 flex items-center">
                <KeyRound className="mr-2 h-5 w-5 text-amber-600"/>Token de Autenticação:
              </h3>
              <p className="text-sm text-muted-foreground">
                A Kirvano deve enviar este token no cabeçalho (header) <code className="font-mono bg-muted px-1 rounded">x-kirvano-token</code> para cada requisição.
              </p>
              <div className="mt-2 p-3 bg-muted rounded-md text-sm font-mono flex items-center gap-2">
                 <span className="text-destructive font-semibold">Valor do Token:</span> {secretToken}
              </div>
              <p className="text-xs text-destructive mt-1">
                <strong>Importante:</strong> Em um ambiente de produção, este token <strong>NÃO</strong> deve estar codificado diretamente no código. Ele deve ser configurado como uma variável de ambiente no servidor para maior segurança.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-1">Payload Esperado (Exemplo):</h3>
              <p className="text-sm text-muted-foreground">A Kirvano deve enviar um corpo JSON na requisição POST com a seguinte estrutura:</p>
              <pre className="mt-2 p-3 bg-muted rounded-md text-sm overflow-x-auto">
                <code>
{`{
  "email": "usuario@exemplo.com",
  "status": "paid" 
}`}
                </code>
              </pre>
              <p className="text-xs text-muted-foreground mt-1">
                O campo <code className="font-mono bg-muted px-1 rounded">status</code> pode ser, por exemplo, <code className="font-mono bg-muted px-1 rounded">paid</code>, <code className="font-mono bg-muted px-1 rounded">cancelled</code>, <code className="font-mono bg-muted px-1 rounded">refunded</code>, etc.
                Se o status for <code className="font-mono bg-muted px-1 rounded">paid</code>, o plano do usuário será atualizado para "premium". Caso contrário, para "free".
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-1">Ação do Webhook:</h3>
              <p className="text-sm text-muted-foreground">
                Ao receber uma notificação válida, o sistema Tubarões da Bolsa irá:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground pl-4 mt-1 space-y-1">
                <li>Buscar o usuário no banco de dados pelo e-mail fornecido.</li>
                <li>Atualizar o campo <code className="font-mono bg-muted px-1 rounded">plan</code> do usuário para "premium" (se status "paid") ou "free" (outros status).</li>
                <li>Atualizar o campo <code className="font-mono bg-muted px-1 rounded">plan_updated_at</code> com a data e hora da atualização.</li>
                <li>Se o plano for atualizado para "premium", o campo <code className="font-mono bg-muted px-1 rounded">lastPayment</code> também será atualizado.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
