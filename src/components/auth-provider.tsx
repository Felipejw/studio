
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, onAuthStateChanged } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
// navItems não é mais usado aqui para a lógica de redirecionamento principal

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
    if (loading) {
      return; // Não faz nada enquanto o estado de autenticação está carregando
    }

    const publicPaths = ['/login', '/signup'];
    const isPublicPage = publicPaths.includes(pathname);

    if (!user) { // Usuário NÃO está logado
      if (!isPublicPage && pathname !== '/login') {
        // Se não está logado, não está numa página pública, e não está já indo para /login
        router.replace('/login');
      }
      // Se não está logado e está em /login ou /signup, ou outra página que deveria ser pública, não faz nada aqui.
    } else { // Usuário ESTÁ logado
      if (isPublicPage && pathname !== '/dashboard') {
        // Se está logado, está numa página de login/signup, e não está já indo para /dashboard
        router.replace('/dashboard');
      }
      // Se está logado e em qualquer outra página (presumivelmente protegida ou o dashboard), não faz nada.
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
