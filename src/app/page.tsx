
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Adicionado usePathname
import { useAuth } from '@/components/auth-provider';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname(); // Obtém o pathname atual
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Se usuário logado, redirecionar para dashboard, a menos que já esteja lá (improvável neste componente)
        if (pathname !== '/dashboard') {
          router.replace('/dashboard');
        }
      } else {
        // Se usuário não logado, redirecionar para login, a menos que já esteja lá
        if (pathname !== '/login') {
          router.replace('/login');
        }
      }
    }
  }, [user, loading, router, pathname]); // Adicionado pathname às dependências

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-4 text-lg">Carregando Trader's Cockpit...</p>
    </div>
  );
}
