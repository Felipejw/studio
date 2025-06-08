
// src/app/admin/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, Users, Settings2, Webhook } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboardPage() {
  const { user, authLoading, userProfile, profileLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

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
    // This state should ideally not be reached if useEffect redirect works,
    // but it's a fallback.
    return null;
  }

  const adminFeatures = [
    {
      title: "Gerenciar Usuários",
      description: "Visualize, edite e gerencie os planos dos usuários da plataforma.",
      href: "/admin/users",
      icon: Users,
    },
    {
      title: "Informações do Webhook",
      description: "Consulte os detalhes para configurar o webhook da Kirvano.",
      href: "/admin/webhook-info",
      icon: Webhook,
    },
    // Add more admin features here as cards if needed
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-6">
          <div className="flex items-center space-x-2">
            <Settings2 className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold font-headline">Painel de Administrador</h1>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <ArrowRight className="mr-2 h-4 w-4" />
              Sair do Painel Admin
            </Link>
          </Button>
        </div>
      </header>
      <main className="container mx-auto py-8 px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminFeatures.map((feature) => (
            <Card key={feature.href} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <feature.icon className="h-8 w-8 text-primary" />
                  <CardTitle className="text-xl font-headline">{feature.title}</CardTitle>
                </div>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={feature.href}>
                    Acessar <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
