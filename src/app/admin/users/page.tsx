
// src/app/admin/users/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/components/auth-provider';
import { db, collection, getDocs, doc, updateDoc, Timestamp, query, orderBy as firestoreOrderBy } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, ShieldAlert, Users, ArrowLeft, Phone, Fingerprint, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

type UserPlan = 'free' | 'pro' | 'vitalicio';

interface UserProfileDataFirestore {
  uid: string;
  name: string;
  email: string;
  whatsapp?: string;
  cpf?: string;
  plan: UserPlan;
  memberSince: Timestamp | string;
  lastPayment?: Timestamp | string;
}

interface UserProfileAdminView extends Omit<UserProfileDataFirestore, 'memberSince' | 'lastPayment'> {
  id: string;
  memberSince: string;
  lastPayment?: string;
  whatsapp?: string;
  cpf?: string;
}

const editUserSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres." }),
  email: z.string().email({ message: "Email inválido." }), // Mantido para exibição, não para alteração direta de login
  whatsapp: z.string().optional(),
  cpf: z.string().optional(),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [usersList, setUsersList] = useState<UserProfileAdminView[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfileAdminView | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const { toast } = useToast();

  const editForm = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: '',
      email: '',
      whatsapp: '',
      cpf: '',
    }
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.email !== 'felipejw.fm@gmail.com') {
        toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você não tem permissão para acessar esta página.' });
        router.replace('/dashboard');
      }
    }
  }, [user, authLoading, router, toast]);

  useEffect(() => {
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
              ...data,
              id: docSnap.id,
              memberSince: data.memberSince instanceof Timestamp ? data.memberSince.toDate().toLocaleDateString('pt-BR') : String(data.memberSince),
              lastPayment: data.lastPayment ? (data.lastPayment instanceof Timestamp ? data.lastPayment.toDate().toLocaleDateString('pt-BR') : String(data.lastPayment)) : 'N/A',
              whatsapp: data.whatsapp || 'N/A',
              cpf: data.cpf || 'N/A',
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

  const handleEditUserClick = (userToEdit: UserProfileAdminView) => {
    setEditingUser(userToEdit);
    editForm.reset({
      name: userToEdit.name,
      email: userToEdit.email,
      whatsapp: userToEdit.whatsapp === 'N/A' ? '' : userToEdit.whatsapp,
      cpf: userToEdit.cpf === 'N/A' ? '' : userToEdit.cpf,
    });
    setIsEditModalOpen(true);
  };

  const onEditSubmit: SubmitHandler<EditUserFormValues> = async (data) => {
    if (!editingUser) return;
    setIsSubmittingEdit(true);
    try {
      const userDocRef = doc(db, 'users', editingUser.id);
      // Note: We are not updating the email field in Firestore here, as it's tied to Firebase Auth.
      // This form only updates name, whatsapp, and cpf.
      await updateDoc(userDocRef, {
        name: data.name,
        whatsapp: data.whatsapp || '', // Store empty string if undefined
        cpf: data.cpf || '',         // Store empty string if undefined
      });

      setUsersList(prevUsers =>
        prevUsers.map(u =>
          u.id === editingUser.id
            ? {
                ...u,
                name: data.name,
                whatsapp: data.whatsapp || 'N/A',
                cpf: data.cpf || 'N/A',
              }
            : u
        )
      );
      toast({ title: 'Usuário Atualizado!', description: `Dados de ${data.name} atualizados com sucesso.` });
      setIsEditModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
      toast({ variant: "destructive", title: "Erro ao Atualizar Usuário", description: "Não foi possível atualizar os dados do usuário." });
    }
    setIsSubmittingEdit(false);
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
                      <TableHead><Phone className="inline mr-1 h-4 w-4" />WhatsApp</TableHead>
                      <TableHead><Fingerprint className="inline mr-1 h-4 w-4" />CPF</TableHead>
                      <TableHead>Plano Atual</TableHead>
                      <TableHead>Membro Desde</TableHead>
                      <TableHead>Último Pagamento</TableHead>
                      <TableHead className="text-center">Alterar Plano</TableHead>
                      <TableHead className="text-center">Editar Dados</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersList.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.whatsapp}</TableCell>
                        <TableCell>{u.cpf}</TableCell>
                        <TableCell className="capitalize">{u.plan}</TableCell>
                        <TableCell>{u.memberSince}</TableCell>
                        <TableCell>{u.lastPayment}</TableCell>
                        <TableCell className="text-center w-[180px]">
                          {isUpdatingPlan === u.id ? (
                            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                          ) : (
                            <Select
                              value={u.plan}
                              onValueChange={(newPlan: UserPlan) => handlePlanChange(u.id, newPlan)}
                            >
                              <SelectTrigger className="h-9 text-xs w-full">
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
                        <TableCell className="text-center">
                          <Button variant="outline" size="sm" onClick={() => handleEditUserClick(u)}>
                            <Edit className="mr-1 h-3 w-3" /> Editar
                          </Button>
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

        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Usuário: {editingUser?.name}</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do usuário" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Login)</FormLabel>
                      <FormControl>
                        <Input placeholder="email@example.com" {...field} disabled />
                      </FormControl>
                       <FormDescription className="text-xs">
                        O email de login não pode ser alterado por aqui. Use o Firebase Authentication.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp</FormLabel>
                      <FormControl>
                        <Input placeholder="(XX) XXXXX-XXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input placeholder="XXX.XXX.XXX-XX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>Cancelar</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmittingEdit}>
                    {isSubmittingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Alterações
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Card className="mt-8 bg-yellow-50 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700">
          <CardHeader className="flex-row items-center gap-2 pb-2">
            <ShieldAlert className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <CardTitle className="text-lg text-yellow-700 dark:text-yellow-300">Notas Importantes</CardTitle>
          </CardHeader>
          <CardContent className="text-yellow-700 dark:text-yellow-400 text-sm space-y-1">
            <p><strong>Gerenciamento de Acesso:</strong> Para desabilitar/habilitar o acesso de um usuário, utilize o console do Firebase Authentication.</p>
            <p><strong>Impacto das Alterações:</strong> Mudanças de plano aqui afetam o acesso do usuário aos recursos da plataforma.</p>
            <p><strong>Alteração de Email:</strong> A alteração do email de login deve ser feita com cautela e preferencialmente através das ferramentas do Firebase Authentication para garantir a integridade da conta.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

    