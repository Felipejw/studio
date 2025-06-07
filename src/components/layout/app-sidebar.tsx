
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image'; // Import next/image
import { cn } from '@/lib/utils';
import { navItems as allNavItems } from '@/config/nav'; 
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar as useUiSidebar,
} from '@/components/ui/sidebar';
// SharkIcon não é mais necessário aqui
import { LogOut, PanelLeftClose, PanelLeftOpen, Users, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth, signOut as firebaseSignOut } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';
import React from 'react';

const adminNavItem = {
  title: 'Admin Usuários',
  href: '/admin/users',
  icon: Users,
  label: 'Gerenciar Usuários',
};

// Define which nav items are premium
const premiumNavHrefs = [
  '/daily-plan',
  '/ai-psychologist',
  '/risk-manager',
  '/trader-profile-test', 
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { setOpenMobile, toggleSidebar, state: sidebarState, isMobile } = useUiSidebar();
  const { user, authLoading, userProfile, profileLoading } = useAuth();

  const isLoadingAuthOrProfile = authLoading || profileLoading;
  const currentUserPlan = userProfile?.plan;

  const isAdmin = !isLoadingAuthOrProfile && userProfile && userProfile.email === 'felipejw.fm@gmail.com';

  const navItemsToRender = allNavItems.map(item => {
    const isPremiumFeature = premiumNavHrefs.includes(item.href);
    const isDisabled = isPremiumFeature && currentUserPlan === 'free' && !isAdmin; // Admins can access all
    return { ...item, isDisabled };
  });

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast({ title: 'Logout Realizado', description: 'Você foi desconectado com sucesso.' });
      if (typeof setOpenMobile === 'function') {
         setOpenMobile(false);
      }
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      toast({ variant: 'destructive', title: 'Erro no Logout', description: 'Não foi possível fazer logout.' });
    }
  };

  return (
    <Sidebar
        side="left"
        variant="sidebar"
        collapsible="icon"
        className="border-r border-sidebar-border shadow-md"
    >
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <Image 
            src="/logo-tubaroes-da-bolsa.png" 
            alt="Tubarões da Bolsa Logo" 
            width={28} // Ajuste o tamanho conforme necessário
            height={28}
            className="group-data-[collapsible=icon]:w-6 group-data-[collapsible=icon]:h-6 transition-all"
            data-ai-hint="company logo"
          />
          <span className="font-bold text-xl font-headline text-sidebar-foreground group-data-[collapsible=icon]:hidden transition-opacity duration-300">
            Tubarões da Bolsa
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-2">
        <SidebarMenu>
          {navItemsToRender.map((item) => (
            <SidebarMenuItem key={item.href} className="px-2">
              <Link href={item.isDisabled ? '#' : item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  variant="default"
                  size="default"
                  className={cn(
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    pathname === item.href && !item.isDisabled
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm'
                      : 'text-sidebar-foreground/80 hover:text-sidebar-accent-foreground',
                    item.isDisabled && 'opacity-50 cursor-not-allowed hover:bg-transparent hover:text-sidebar-foreground/80'
                  )}
                  isActive={pathname === item.href && !item.isDisabled}
                  tooltip={{
                    children: item.isDisabled ? `${item.title} (Premium)` : item.title,
                    className: "bg-sidebar-background text-sidebar-foreground border-sidebar-border"
                  }}
                  aria-label={item.title}
                  disabled={item.isDisabled}
                  onClick={(e) => {
                     if (item.isDisabled) {
                       e.preventDefault();
                       toast({ title: "Recurso Premium", description: "Faça upgrade para o Plano Premium para acessar.", duration: 3000});
                       if (isMobile && typeof setOpenMobile === 'function') setOpenMobile(false);
                       router.push('/pricing'); // Optionally redirect
                       return;
                     }
                     if (isMobile && typeof setOpenMobile === 'function' && user) {
                        setOpenMobile(false);
                     }
                  }}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden flex items-center">
                    {item.title}
                    {item.isDisabled && <Lock className="ml-2 h-3 w-3 text-amber-500" />}
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
          
          {!isLoadingAuthOrProfile && isAdmin && ( // Check loading state before rendering admin item
            <SidebarMenuItem key={adminNavItem.href} className="px-2">
              <Link href={adminNavItem.href} passHref legacyBehavior>
                <SidebarMenuButton
                  variant="default"
                  size="default"
                  className={cn(
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    pathname === adminNavItem.href
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm'
                      : 'text-sidebar-foreground/80 hover:text-sidebar-accent-foreground'
                  )}
                  isActive={pathname === adminNavItem.href}
                  tooltip={{
                    children: adminNavItem.title,
                    className: "bg-sidebar-background text-sidebar-foreground border-sidebar-border"
                  }}
                  aria-label={adminNavItem.title}
                   onClick={() => {
                     if (isMobile && typeof setOpenMobile === 'function' && user) {
                        setOpenMobile(false);
                     }
                  }}
                >
                  <adminNavItem.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">
                    {adminNavItem.title}
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border mt-auto space-y-1">
        {!isMobile && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={toggleSidebar}
            tooltip={{
              children: sidebarState === 'expanded' ? "Encolher menu" : "Expandir menu",
              className: "bg-sidebar-background text-sidebar-foreground border-sidebar-border group-data-[collapsible=icon]:block hidden"
            }}
            aria-label={sidebarState === 'expanded' ? "Encolher menu" : "Expandir menu"}
          >
            {sidebarState === 'expanded' ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
            <span className="group-data-[collapsible=icon]:hidden">
              {sidebarState === 'expanded' ? "Encolher" : "Expandir"}
            </span>
          </Button>
        )}
        <Button
            variant="ghost"
            className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={handleSignOut}
            disabled={!user || authLoading}
             tooltip={{
                children: "Sair",
                className: "bg-sidebar-background text-sidebar-foreground border-sidebar-border group-data-[collapsible=icon]:block hidden"
            }}
            aria-label="Sair"
        >
           <LogOut className="h-5 w-5" />
           <span className="group-data-[collapsible=icon]:hidden">Sair</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
