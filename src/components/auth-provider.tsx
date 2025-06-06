
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, onAuthStateChanged } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

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
    if (loading) return;

    const isAuthPage = pathname === '/login' || pathname === '/signup';
    const isAppPage = pathname.startsWith('/app') || pathname === '/dashboard' || pathname === '/daily-plan' || pathname === '/trade-log' || pathname === '/ai-psychologist' || pathname === '/risk-manager' || pathname === '/print-analysis' || pathname === '/profile';


    if (!user && !isAuthPage && isAppPage) {
      router.push('/login');
    } else if (user && isAuthPage) {
      router.push('/dashboard');
    } else if (!user && pathname === '/') {
      router.push('/login');
    } else if (user && pathname === '/') {
       router.push('/dashboard');
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Carregando...</p>
      </div>
    );
  }
  
  // If user is not logged in and trying to access a protected route (implicit by this point if not auth page)
  // and not on an auth page already, show loading or redirect.
  // The redirect is handled by the useEffect above. Here, ensure children are not rendered prematurely for protected routes.
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  if (!user && !isAuthPage && pathname !== '/') {
     // Effectively, this prevents rendering children of protected routes if not logged in
     // The useEffect will handle the redirect.
     return (
        <div className="flex h-screen w-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg">Redirecionando...</p>
        </div>
     );
  }


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
