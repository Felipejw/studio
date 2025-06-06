
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { navItems } from '@/config/nav';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar as useUiSidebar, // Renamed to avoid conflict
} from '@/components/ui/sidebar';
import { LeafIcon, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth, signOut as firebaseSignOut } from '@/lib/firebase'; 
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';
import React from 'react';


export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { setOpenMobile } = useUiSidebar(); 
  const { user } = useAuth();


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
          <LeafIcon className="h-7 w-7 text-sidebar-primary group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6 transition-all" />
          <span className="font-bold text-xl font-headline text-sidebar-foreground group-data-[collapsible=icon]:hidden transition-opacity duration-300">
            Trader's Cockpit
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href} className="px-2">
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  variant="default"
                  size="default"
                  className={cn(
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    pathname === item.href 
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm' 
                      : 'text-sidebar-foreground/80 hover:text-sidebar-accent-foreground'
                  )}
                  isActive={pathname === item.href}
                  tooltip={{
                    children: item.title,
                    className: "bg-sidebar-background text-sidebar-foreground border-sidebar-border"
                  }}
                  aria-label={item.title}
                  onClick={() => {
                     if (typeof setOpenMobile === 'function' && user) { 
                        setOpenMobile(false);
                     }
                  }}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">
                    {item.title}
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border mt-auto">
        <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={handleSignOut}
            disabled={!user} 
             tooltip={{
                children: "Sair",
                className: "bg-sidebar-background text-sidebar-foreground border-sidebar-border group-data-[collapsible=icon]:block hidden"
            }}
        >
           <LogOut className="h-5 w-5" />
           <span className="group-data-[collapsible=icon]:hidden">Sair</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
