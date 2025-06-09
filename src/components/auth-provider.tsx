
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, onAuthStateChanged, db, doc, getDoc, type Firestore, Timestamp } from '@/lib/firebase'; // Added db, doc, getDoc, Timestamp
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Define a more specific user profile type that includes the plan
export type UserPlan = 'free' | 'premium' | 'affiliate_demo';

export interface UserProfileData {
  uid: string;
  name: string;
  email: string;
  whatsapp?: string;
  cpf?: string;
  plan: UserPlan;
  memberSince: string; // Consistent ISO string
  lastPayment?: string; // Consistent ISO string or undefined
  plan_updated_at?: string; // New: Consistent ISO string or undefined
}

interface AuthContextType {
  user: User | null;
  loading: boolean; // True if either auth state or profile data is loading
  authLoading: boolean; // True if only auth state is loading
  profileLoading: boolean; // True if only profile data is loading
  userId: string | null;
  userProfile: UserProfileData | null; // Add userProfile to the context
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoadingState, setAuthLoadingState] = useState(true); // Renamed to avoid conflict
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [profileLoadingState, setProfileLoadingState] = useState(true); // Renamed

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoadingState(false);

      if (currentUser) {
        setProfileLoadingState(true);
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const profileData = docSnap.data() as Omit<UserProfileData, 'memberSince' | 'lastPayment' | 'plan_updated_at'> & { memberSince?: Timestamp | string, lastPayment?: Timestamp | string, plan_updated_at?: Timestamp | string };
            
            let memberSinceStr: string;
            if (profileData.memberSince instanceof Timestamp) {
              memberSinceStr = profileData.memberSince.toDate().toISOString();
            } else if (typeof profileData.memberSince === 'string' && !isNaN(new Date(profileData.memberSince).getTime())) {
              memberSinceStr = new Date(profileData.memberSince).toISOString();
            } else {
              console.warn(`AuthProvider: memberSince for user ${currentUser.uid} is not a valid Timestamp or date string. Defaulting to current date. Value:`, profileData.memberSince);
              memberSinceStr = new Date().toISOString();
            }

            let lastPaymentStr: string | undefined = undefined;
            if (profileData.lastPayment) {
              if (profileData.lastPayment instanceof Timestamp) {
                lastPaymentStr = profileData.lastPayment.toDate().toISOString();
              } else if (typeof profileData.lastPayment === 'string' && !isNaN(new Date(profileData.lastPayment).getTime())) {
                lastPaymentStr = new Date(profileData.lastPayment).toISOString();
              } else {
                 console.warn(`AuthProvider: lastPayment for user ${currentUser.uid} is not a valid Timestamp or date string. Setting to undefined. Value:`, profileData.lastPayment);
              }
            }

            let planUpdatedAtStr: string | undefined = undefined;
            if (profileData.plan_updated_at) {
              if (profileData.plan_updated_at instanceof Timestamp) {
                planUpdatedAtStr = profileData.plan_updated_at.toDate().toISOString();
              } else if (typeof profileData.plan_updated_at === 'string' && !isNaN(new Date(profileData.plan_updated_at).getTime())) {
                planUpdatedAtStr = new Date(profileData.plan_updated_at).toISOString();
              } else {
                 console.warn(`AuthProvider: plan_updated_at for user ${currentUser.uid} is not a valid Timestamp or date string. Setting to undefined. Value:`, profileData.plan_updated_at);
              }
            }

            setUserProfile({
              uid: profileData.uid,
              name: profileData.name,
              email: profileData.email,
              whatsapp: profileData.whatsapp,
              cpf: profileData.cpf,
              plan: profileData.plan,
              memberSince: memberSinceStr,
              lastPayment: lastPaymentStr,
              plan_updated_at: planUpdatedAtStr,
            });

          } else {
            console.warn("User profile not found in Firestore for UID:", currentUser.uid, "This might occur if Firestore doc creation failed during signup. Creating a default local profile.");
            setUserProfile({
                uid: currentUser.uid,
                name: currentUser.displayName || "Usuário",
                email: currentUser.email || "",
                plan: 'free',
                memberSince: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserProfile(null); // Ensure profile is null on error to avoid partial states
        } finally {
          setProfileLoadingState(false);
        }
      } else {
        setUserProfile(null);
        setProfileLoadingState(false); 
      }
    });
    return () => unsubscribe();
  }, []);

  const combinedLoading = authLoadingState || (user != null && profileLoadingState);

  useEffect(() => {
    if (combinedLoading) { 
      return;
    }

    const publicPaths = ['/login', '/signup'];
    const isPublicPage = publicPaths.includes(pathname);
    const isAdminPage = pathname.startsWith('/admin');

    if (!user) {
      if (!isPublicPage && !isAdminPage) { 
        router.replace('/login');
      }
    } else {
      if (isPublicPage) {
        router.replace('/dashboard');
      } else if (pathname === '/') { // If user is authenticated and on the root page, redirect to dashboard
        router.replace('/dashboard');
      }
    }
  }, [user, combinedLoading, router, pathname]);


  if (combinedLoading && !pathname.startsWith('/admin') && pathname !== '/login' && pathname !== '/signup') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Carregando sua sessão...</p>
      </div>
    );
  }


  return (
    <AuthContext.Provider value={{ 
        user, 
        loading: combinedLoading, 
        authLoading: authLoadingState,
        profileLoading: profileLoadingState,
        userId: user?.uid || null, 
        userProfile 
    }}>
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
