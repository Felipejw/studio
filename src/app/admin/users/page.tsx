
// src/app/admin/users/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { db, collection, getDocs, doc, updateDoc, Timestamp, query, orderBy as firestoreOrderBy } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert, Users, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

type UserPlan = 'free' | 'pro' | 'vitalicio';

interface UserProfileDataFirestore {
  uid: string;
  name: string;
  email: string;
  plan: UserPlan;
  memberSince: Timestamp | string; // Allow string for initial fetch if not Timestamp
  lastPayment?: Timestamp | string;
}

interface UserProfileAdminView extends Omit<UserProfileDataFirestore, 'memberSince' | 'lastPayment'> {
  id: string; // This will be the Firestore document ID
  memberSince: string; // For display
  lastPayment?: string; // For display
}

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [usersList, setUsersList] = useState<UserProfileAdminView[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState<string | null>(null); // Store UID of user being updated
  const { toast } = useToast();

  // Authorization check
  useEffect(() => {
    if (!authLoading) {
      if (!user || user.email !== 'felipejw.fm@gmail.com') {
        toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você não tem permissão para acessar esta página.' });
        router.replace('/dashboard');
      }
    }
  }, [user, authLoading, router, toast]);

  // Fetch users
  useEffect(() => {
    // Ensure this effect runs only when the admin user is confirmed
    if (user && user.email === 'felipejw.fm@gmail.com') {
      const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
          const usersQuery = query(collection(db, 'users'), firestoreOrderBy('memberSince', 'desc'));
          const querySnapshot = await getDocs(usersQuery);
          const fetchedUsers: UserProfileAdminView[] = [];
          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data() as UserProfileDataFirestore;
            fetchedUsers.push({
              ...data, // Spread all fields from UserProfileDataFirestore
              id: docSnap.id, // Use Firestore document ID for the 'id' field
              memberSince: data.memberSince instanceof Timestamp ? data.memberSince.toDate().toLocaleDateString('pt-BR') : String(data.memberSince),
              lastPayment: data.lastPayment ? (data.lastPayment instanceof Timestamp ? data.lastPayment.toDate().toLocaleDateString('pt-BR') : String(data.lastPayment)) : 'N/A',
            });
          });
          setUsersList(fetchedUsers);
        } catch (error) {
          console.error("Error fetching users:", error);
          toast({ variant: "destructive", title: "Erro ao Carregar Usuários", description: "Não foi possível buscar a lista de usuários." });
        }
        setIsLoadingUsers(false);
      };
      fetchUsers();
    }
  }, [user, toast]);

  const handlePlanChange = async (userIdToUpdate: string, newPlan: UserPlan) => {
    setIsUpdatingPlan(userIdToUpdate);
    try {
      const userDocRef = doc(db, 'users', userIdToUpdate);
      await updateDoc(userDocRef, { plan: newPlan });
      setUsersList(prevUsers =>
        prevUsers.map(u => (u.id === userIdToUpdate ? { ...u, plan: newPlan } : u))
      );
      toast({ title: 'Plano Atualizado!', description: `Plano do usuário alterado para ${newPlan.toUpperCase()}.` });
    } catch (error) {
      console.error("Error updating plan:", error);
      toast({ variant: "destructive", title: "Erro ao Atualizar Plano", description: "Não foi possível alterar o plano do usuário." });
    }
    setIsUpdatingPlan(null);
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Verificando permissões...</p>
      </div>
    );
  }

  if (!user || user.email !== 'felipejw.fm@gmail.com') {
    return null; 
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-6">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold font-headline">Painel Administrativo - Usuários</h1>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
            </Link>
          </Button>
        </div>
      </header>
      <main className="container mx-auto py-8 px-4 md:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Usuários</CardTitle>
            <CardDescription>Visualize e gerencie os usuários da plataforma.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Carregando usuários...</p>
              </div>
            ) : usersList.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">Nenhum usuário encontrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Plano Atual</TableHead>
                      <TableHead>Membro Desde</TableHead>
                      <TableHead>Último Pagamento</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersList.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell className="capitalize">{u.plan}</TableCell>
                        <TableCell>{u.memberSince}</TableCell>
                        <TableCell>{u.lastPayment}</TableCell>
                        <TableCell className="text-center w-[200px]">
                          {isUpdatingPlan === u.id ? (
                            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                          ) : (
                            <Select
                              value={u.plan}
                              onValueChange={(newPlan: UserPlan) => handlePlanChange(u.id, newPlan)}
                            >
                              <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Alterar plano" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">Gratuito</SelectItem>
                                <SelectItem value="pro">Pro</SelectItem>
                                <SelectItem value="vitalicio">Vitalício</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableCaption>Total de usuários: {usersList.length}</TableCaption>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="mt-8 bg-yellow-50 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700">
            <CardHeader className="flex-row items-center gap-2 pb-2">
                <ShieldAlert className="h-5 w-5 text-yellow-600 dark:text-yellow-400"/>
                <CardTitle className="text-lg text-yellow-700 dark:text-yellow-300">Notas Importantes</CardTitle>
            </CardHeader>
            <CardContent className="text-yellow-700 dark:text-yellow-400 text-sm space-y-1">
                <p><strong>Gerenciamento de Acesso:</strong> Para desabilitar/habilitar o acesso de um usuário, utilize o console do Firebase Authentication.</p>
                <p><strong>Impacto das Alterações:</strong> Mudanças de plano aqui afetam o acesso do usuário aos recursos da plataforma.</p>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
    