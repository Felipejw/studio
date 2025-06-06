
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
} from '@/components/ui/sidebar';
import { LeafIcon, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth, signOut as firebaseSignOut } from '@/lib/firebase'; // Renamed signOut to firebaseSignOut
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';


export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { setOpenMobile } = useSidebar(); // Assuming useSidebar is correctly imported and provides this
  const { user } = useAuth();


  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast({ title: 'Logout Realizado', description: 'Você foi desconectado com sucesso.' });
      if (typeof setOpenMobile === 'function') {
         setOpenMobile(false); // Close mobile sidebar if open
      }
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      toast({ variant: 'destructive', title: 'Erro no Logout', description: 'Não foi possível fazer logout.' });
    }
  };


  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <LeafIcon className="h-8 w-8 text-primary group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6" />
          <span className="font-bold text-lg font-headline group-data-[collapsible=icon]:hidden">
            Trader's Cockpit
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  variant="default"
                  size="default"
                  className={cn(pathname === item.href && 'bg-sidebar-accent text-sidebar-accent-foreground')}
                  isActive={pathname === item.href}
                  tooltip={item.title}
                  aria-label={item.title}
                  onClick={() => {
                     if (typeof setOpenMobile === 'function' && user) { // Only close if user is logged in and on mobile
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

      <SidebarFooter className="p-2">
        <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center"
            onClick={handleSignOut}
            disabled={!user} // Disable if no user
        >
           <LogOut className="h-5 w-5" />
           <span className="group-data-[collapsible=icon]:hidden">Sair</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

// Added dummy useSidebar hook if not present from ui/sidebar
const SidebarContext = React.createContext<{ setOpenMobile?: (open: boolean) => void } | null>(null);
const useSidebar = () => {
    const context = React.useContext(SidebarContext);
    // Provide a default no-op function if context is not found or setOpenMobile is not defined
    return { setOpenMobile: context?.setOpenMobile || (() => {}) }; 
};
import React from 'react'; // Ensure React is imported for context

