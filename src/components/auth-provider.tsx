
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, onAuthStateChanged, db, doc, getDoc, type Firestore, Timestamp } from '@/lib/firebase'; // Added db, doc, getDoc, Timestamp
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Define a more specific user profile type that includes the plan
export type UserPlan = 'free' | 'premium';

export interface UserProfileData {
  uid: string;
  name: string;
  email: string;
  whatsapp?: string;
  cpf?: string;
  plan: UserPlan;
  memberSince: Timestamp | string; // Allow for string if already converted
  lastPayment?: Timestamp | string; // Allow for string if already converted
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
            const profileData = docSnap.data() as UserProfileData;
            setUserProfile({
              ...profileData,
              // Ensure Timestamps are handled correctly if they come from Firestore directly
              memberSince: profileData.memberSince instanceof Timestamp ? profileData.memberSince.toDate().toISOString() : String(profileData.memberSince),
              lastPayment: profileData.lastPayment ? (profileData.lastPayment instanceof Timestamp ? profileData.lastPayment.toDate().toISOString() : String(profileData.lastPayment)) : undefined,
            });
          } else {
            console.warn("User profile not found in Firestore for UID:", currentUser.uid);
            // This case might occur if a user is created in Auth but Firestore doc creation fails
            // Default to a 'free' plan or handle as an error state
            setUserProfile({ // Create a minimal profile if not found
                uid: currentUser.uid,
                name: currentUser.displayName || "Usuário",
                email: currentUser.email || "",
                plan: 'free',
                memberSince: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserProfile(null);
        } finally {
          setProfileLoadingState(false);
        }
      } else {
        setUserProfile(null);
        setProfileLoadingState(false); // No user, so profile loading is complete
      }
    });
    return () => unsubscribe();
  }, []);

  const combinedLoading = authLoadingState || (user != null && profileLoadingState);

  useEffect(() => {
    if (combinedLoading) { // Use combinedLoading here
      return;
    }

    const publicPaths = ['/login', '/signup'];
    const isPublicPage = publicPaths.includes(pathname);
    const isAdminPage = pathname.startsWith('/admin');

    if (!user) {
      if (!isPublicPage && !isAdminPage) { // Also allow access to /admin if not logged in (admin page handles its own auth)
        router.replace('/login');
      }
    } else {
      if (isPublicPage) {
        router.replace('/dashboard');
      }
      // Admin page access is handled within the admin page itself using userProfile.email
    }
  }, [user, combinedLoading, router, pathname]);


  if (combinedLoading && !pathname.startsWith('/admin') && pathname !== '/login' && pathname !== '/signup') {
     // Show loading screen for protected routes while auth/profile is loading
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
