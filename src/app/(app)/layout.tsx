
'use client'; // Required for hooks like useAuth, useRouter

import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { DashboardHeaderProvider } from '@/contexts/dashboard-header-context';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Carregando sua sessão...</p>
      </div>
    );
  }

  if (!user) {
    // This case should ideally be caught by the useEffect redirect,
    // but as a fallback, show loading or a blank screen to prevent flashing content.
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg">Verificando autenticação...</p>
        </div>
    );
  }

  return (
    <DashboardHeaderProvider>
      <SidebarProvider defaultOpen={true}>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <main className="flex-1 p-4 md:p-8 lg:p-10">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </DashboardHeaderProvider>
  );
}
