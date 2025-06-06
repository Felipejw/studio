
"use client";

import Link from 'next/link';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { LeafIcon, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useDashboardHeader } from '@/contexts/dashboard-header-context';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function AppHeader() {
  const { dailyResult, isLoadingDailyResult } = useDashboardHeader(); 
  const pathname = usePathname();
  const isOnDashboard = pathname === '/dashboard';

  const renderDailyResult = () => {
    if (!isOnDashboard) return null;

    if (isLoadingDailyResult) {
      return (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          <span>Carregando P/L...</span>
        </div>
      );
    }

    if (dailyResult === null) {
      return <span className="text-sm text-muted-foreground">P/L Dia: N/D</span>;
    }

    const resultColor = dailyResult > 0 ? 'text-green-600' : dailyResult < 0 ? 'text-red-600' : 'text-muted-foreground';
    const Icon = dailyResult > 0 ? TrendingUp : dailyResult < 0 ? TrendingDown : Minus;

    return (
      <div className={cn("flex items-center text-sm font-medium", resultColor)}>
        <Icon className={cn("mr-1 h-4 w-4", resultColor)} />
        <span>Resultado Dia: R$ {dailyResult.toFixed(2)}</span>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
            <LeafIcon className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block font-headline">
              Trader's Cockpit
            </span>
          </Link>
        </div>

        {/* Mobile Sidebar Trigger */}
        <div className="md:hidden">
           <SidebarTrigger />
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Could add a global search here if needed */}
          </div>
          <nav className="flex items-center space-x-3">
            {renderDailyResult()}
            <ThemeToggle />
            {/* Placeholder for User Avatar/Menu */}
            {/* <UserNav /> */}
          </nav>
        </div>
      </div>
    </header>
  );
}
