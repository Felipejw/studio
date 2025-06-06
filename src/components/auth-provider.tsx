
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, onAuthStateChanged } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { navItems } from '@/config/nav'; // Import navItems

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return; // Don't run redirect logic until auth state is determined

    const isAuthPage = pathname === '/login' || pathname === '/signup';
    // Check if the current path is one of the protected app routes defined in navItems
    const isAppRoute = navItems.some(item => pathname.startsWith(item.href));

    if (!user) { // User is NOT logged in
      if (pathname === '/') { // User is on root path
        router.replace('/login');
      } else if (isAppRoute && !isAuthPage) { // User is trying to access a protected app page
        router.replace('/login');
      }
      // If !user and on an auth page (e.g. /login, /signup), or any other non-app, non-root public page, do nothing.
    } else { // User IS logged in
      if (pathname === '/') { // User is on root path
        router.replace('/dashboard');
      } else if (isAuthPage) { // Logged in user trying to access login/signup page
        router.replace('/dashboard');
      }
      // If user is logged in and on an app page (and not / or auth page), do nothing.
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Carregando...</p>
      </div>
    );
  }

  // At this point, loading is false. User state is determined.
  // The useEffect above is handling redirects.
  // We can now provide the context for children to consume.
  return (
    <AuthContext.Provider value={{ user, loading, userId: user?.uid || null }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
