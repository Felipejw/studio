
'use client'; // Required for hooks like useAuth

import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useAuth } from '@/components/auth-provider';
// import { useRouter } from 'next/navigation'; // No longer needed for redirect logic here
// import { useEffect } from 'react'; // No longer needed for redirect logic here
import { Loader2 } from 'lucide-react';
import { DashboardHeaderProvider } from '@/contexts/dashboard-header-context';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, loading } = useAuth();
  // const router = useRouter(); // Removed

  // useEffect(() => { // This useEffect block was removed
  //   if (!loading && !user) {
  //     router.replace('/login');
  //   }
  // }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Carregando sua sessão...</p>
      </div>
    );
  }

  if (!user) {
    // If loading is complete and there's no user,
    // AuthProvider should have already initiated a redirect.
    // This return is a fallback to prevent rendering children or flashing content
    // while the redirect is in progress or if AuthProvider's redirect logic fails.
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg">Verificando autenticação...</p>
        </div>
    );
  }

  // If user exists and loading is false, render the app layout
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
