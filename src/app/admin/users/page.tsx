
// src/app/admin/users/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, type UserPlan as AuthUserPlan, type UserProfileData as AuthUserProfileData } from '@/components/auth-provider';
import { db, collection, getDocs, doc, updateDoc, Timestamp, query, orderBy as firestoreOrderBy, deleteDoc, where, writeBatch, getDoc } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Loader2, ShieldAlert, Users, ArrowLeft, Phone, Fingerprint, Edit, Trash2, CalendarIcon, Settings2 } from 'lucide-react'; 
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// Use UserPlan from auth-provider
type UserPlan = AuthUserPlan;

// Use UserProfileData from auth-provider for Firestore structure
interface UserProfileDataFirestore extends Omit<AuthUserProfileData, 'memberSince' | 'lastPayment' | 'plan_updated_at'> {
  memberSince?: Timestamp;
  lastPayment?: Timestamp;
  // plan_updated_at is managed by webhook/plan change, not directly listed here but exists in Firestore
}


interface UserProfileAdminView extends Omit<UserProfileDataFirestore, 'memberSince' | 'lastPayment'> {
  id: string; 
  email: string; 
  name: string; 
  plan: UserPlan; 
  memberSinceDisplay?: string | null;
  lastPaymentDisplay?: string | null; 
  originalLastPayment?: Timestamp | null; 
  whatsapp: string; 
  cpf: string; 
}


const editUserSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres." }),
  email: z.string().email({ message: "Email inválido." }), 
  whatsapp: z.string().optional(),
  cpf: z.string().optional(),
  lastPayment: z.string().optional(), 
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

export default function AdminUsersPage() {
  const { user, authLoading, userProfile, profileLoading } = useAuth();
  const router = useRouter();
  const [usersList, setUsersList] = useState<UserProfileAdminView[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfileAdminView | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfileAdminView | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const { toast } = useToast();

  const editForm = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { name: '', email: '', whatsapp: '', cpf: '', lastPayment: '' }
  });

  useEffect(() => {
    const overallLoading = authLoading || profileLoading;
    if (!overallLoading) {
      if (!user || userProfile?.email !== 'felipejw.fm@gmail.com') {
        toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você não tem permissão para acessar esta página.' });
        router.replace('/dashboard');
      }
    }
  }, [user, userProfile, authLoading, profileLoading, router, toast]);

  useEffect(() => {
    if (userProfile && userProfile.email === 'felipejw.fm@gmail.com') {
      const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
          const usersQuery = query(collection(db, 'users'), firestoreOrderBy('name', 'asc'));
          const querySnapshot = await getDocs(usersQuery);
          const fetchedUsers: UserProfileAdminView[] = [];
          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data() as UserProfileDataFirestore & { plan_updated_at?: Timestamp }; // Include plan_updated_at for internal use if needed elsewhere
            fetchedUsers.push({
              id: docSnap.id,
              uid: data.uid,
              name: data.name || 'Nome não disponível',
              email: data.email || 'Email não disponível',
              plan: data.plan || 'free',
              whatsapp: data.whatsapp || 'N/A',
              cpf: data.cpf || 'N/A',
              memberSinceDisplay: data.memberSince ? (data.memberSince instanceof Timestamp ? data.memberSince.toDate().toLocaleDateString('pt-BR') : String(data.memberSince)) : 'N/A',
              lastPaymentDisplay: data.lastPayment ? (data.lastPayment instanceof Timestamp ? data.lastPayment.toDate().toLocaleDateString('pt-BR') : String(data.lastPayment)) : 'N/A',
              originalLastPayment: data.lastPayment instanceof Timestamp ? data.lastPayment : null,
              // planUpdatedAtDisplay is removed from view
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
  }, [userProfile, toast]);

  const handlePlanChange = async (userIdToUpdate: string, newPlan: UserPlan) => {
    setIsUpdatingPlan(userIdToUpdate);
    try {
      const userDocRef = doc(db, 'users', userIdToUpdate);
      const planUpdatedAt = Timestamp.fromDate(new Date());
      const updateData: { plan: UserPlan, plan_updated_at: Timestamp, lastPayment?: Timestamp } = {
         plan: newPlan,
         plan_updated_at: planUpdatedAt
      };

      // Only update lastPayment if the new plan is 'premium'
      if (newPlan === 'premium') {
        updateData.lastPayment = planUpdatedAt;
      }

      await updateDoc(userDocRef, updateData);
      
      setUsersList(prevUsers =>
        prevUsers.map(u => (u.id === userIdToUpdate ? { 
            ...u, 
            plan: newPlan, 
            // We don't display plan_updated_at, but it's good to keep the timestamp in Firestore
            ...(newPlan === 'premium' && { lastPayment: planUpdatedAt, lastPaymentDisplay: planUpdatedAt.toDate().toLocaleDateString('pt-BR')})
        } : u))
      );
      
      let planNameToast = '';
      if (newPlan === 'premium') planNameToast = 'Premium';
      else if (newPlan === 'free') planNameToast = 'Gratuito';
      else if (newPlan === 'affiliate_demo') planNameToast = 'Demo Afiliados';

      toast({ title: 'Plano Atualizado!', description: `Plano do usuário alterado para ${planNameToast}.` });
    } catch (error) {
      console.error("Error updating plan:", error);
      toast({ variant: "destructive", title: "Erro ao Atualizar Plano", description: "Não foi possível alterar o plano do usuário." });
    }
    setIsUpdatingPlan(null);
  };

  const handleEditUserClick = (userToEdit: UserProfileAdminView) => {
    setEditingUser(userToEdit);
    let lastPaymentDateString = '';
    if (userToEdit.originalLastPayment) {
        try {
            lastPaymentDateString = format(userToEdit.originalLastPayment.toDate(), 'yyyy-MM-dd');
        } catch (e) {
            console.error("Error formatting originalLastPayment for input:", e);
        }
    }

    editForm.reset({
      name: userToEdit.name,
      email: userToEdit.email,
      whatsapp: userToEdit.whatsapp === 'N/A' ? '' : userToEdit.whatsapp,
      cpf: userToEdit.cpf === 'N/A' ? '' : userToEdit.cpf,
      lastPayment: lastPaymentDateString,
    });
    setIsEditModalOpen(true);
  };

  const onEditSubmit: SubmitHandler<EditUserFormValues> = async (data) => {
    if (!editingUser) return;
    setIsSubmittingEdit(true);
    try {
      const userDocRef = doc(db, 'users', editingUser.id);
      let newLastPaymentTimestamp: Timestamp | null = editingUser.originalLastPayment || null;

      if (data.lastPayment) {
        try {
            const parsedDate = parseISO(data.lastPayment); 
            newLastPaymentTimestamp = Timestamp.fromDate(parsedDate);
        } catch (e) {
            toast({ variant: "destructive", title: "Data Inválida", description: "O formato da data de último pagamento é inválido." });
            setIsSubmittingEdit(false);
            return;
        }
      } else {
        newLastPaymentTimestamp = null; 
      }
      
      const updatePayload: any = {
        name: data.name,
        whatsapp: data.whatsapp || '',
        cpf: data.cpf || '',
        lastPayment: newLastPaymentTimestamp,
      };
      // If lastPayment is updated and user is premium, also update plan_updated_at to reflect this "subscription event"
      if (newLastPaymentTimestamp && editingUser.plan === 'premium') {
        updatePayload.plan_updated_at = newLastPaymentTimestamp;
      }


      await updateDoc(userDocRef, updatePayload);

      setUsersList(prevUsers =>
        prevUsers.map(u =>
          u.id === editingUser.id
            ? { 
                ...u, 
                name: data.name, 
                whatsapp: data.whatsapp || 'N/A', 
                cpf: data.cpf || 'N/A',
                lastPaymentDisplay: newLastPaymentTimestamp ? newLastPaymentTimestamp.toDate().toLocaleDateString('pt-BR') : 'N/A',
                originalLastPayment: newLastPaymentTimestamp,
                // planUpdatedAtDisplay is not shown, but the underlying plan_updated_at is updated if conditions met
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

  const handleDeleteUserConfirm = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    const userIdToDelete = userToDelete.id;

    try {
      const collectionsToDeleteFrom = [
        { name: 'trades', field: 'userId' },
        { name: 'trading_plans', field: 'userId' },
        { name: 'mindset_logs', field: 'userId' },
        { name: 'trader_group_messages', field: 'userId' }
      ];

      const batch = writeBatch(db);

      const riskConfigRef = doc(db, 'risk_config', userIdToDelete);
      const riskConfigSnap = await getDoc(riskConfigRef);
      if (riskConfigSnap.exists()) {
        batch.delete(riskConfigRef);
      }
      
      for (const colInfo of collectionsToDeleteFrom) {
        const q = query(collection(db, colInfo.name), where(colInfo.field, "==", userIdToDelete));
        const snapshot = await getDocs(q);
        snapshot.forEach(docSnap => batch.delete(docSnap.ref));
      }

      const userDocRef = doc(db, 'users', userIdToDelete);
      batch.delete(userDocRef);

      await batch.commit();

      setUsersList(prevUsers => prevUsers.filter(u => u.id !== userIdToDelete));
      toast({
        title: 'Dados do Usuário Excluídos do Firestore!',
        description: `Todos os dados de ${userToDelete.name} foram removidos do Firestore. Lembre-se de excluir o usuário também do Firebase Authentication.`,
        duration: 10000,
      });
    } catch (error: any) {
      console.error("Error deleting user data:", error);
      toast({ variant: "destructive", title: "Erro ao Excluir Dados", description: `Não foi possível excluir os dados do usuário. ${error.message}` });
    } finally {
      setIsDeletingUser(false);
      setUserToDelete(null);
    }
  };


  if (authLoading || profileLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Verificando permissões...</p>
      </div>
    );
  }

  if (!userProfile || userProfile.email !== 'felipejw.fm@gmail.com') {
    return null; 
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-6">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold font-headline">Gerenciar Usuários</h1>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Painel Admin
            </Link>
          </Button>
        </div>
      </header>
      <main className="container mx-auto py-8 px-4 md:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuários</CardTitle>
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
                      <TableHead>Último Pagamento</TableHead>
                      <TableHead className="text-center">Alterar Plano</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersList.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.whatsapp}</TableCell>
                        <TableCell>{u.cpf}</TableCell>
                        <TableCell className="capitalize">
                          {u.plan === 'premium' ? 'Premium' : u.plan === 'affiliate_demo' ? 'Demo Afiliados' : 'Gratuito'}
                        </TableCell>
                        <TableCell>{u.lastPaymentDisplay}</TableCell>
                        <TableCell className="text-center w-[180px]">
                          {isUpdatingPlan === u.id ? (
                            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                          ) : (
                            <Select
                              value={u.plan}
                              onValueChange={(newPlanValue: UserPlan) => handlePlanChange(u.id, newPlanValue)}
                            >
                              <SelectTrigger className="h-9 text-xs w-full">
                                <SelectValue placeholder="Alterar plano" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">Gratuito</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                                <SelectItem value="affiliate_demo">Demo Afiliados</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell className="text-center space-x-1">
                          <Button variant="outline" size="sm" onClick={() => handleEditUserClick(u)} className="px-2 py-1 h-auto">
                            <Edit className="mr-1 h-3 w-3" /> Editar
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" onClick={() => setUserToDelete(u)} className="px-2 py-1 h-auto">
                                    <Trash2 className="mr-1 h-3 w-3" /> Excluir
                                </Button>
                            </AlertDialogTrigger>
                            {userToDelete && userToDelete.id === u.id && (
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar Exclusão de Dados</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    Tem certeza que deseja excluir TODOS os dados do usuário "{userToDelete?.name}" ({userToDelete?.email}) do Firestore?
                                    Esta ação não pode ser desfeita.
                                    <br/><br/>
                                    <strong>Importante:</strong> Você precisará excluir manualmente este usuário do Firebase Authentication após esta etapa.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setUserToDelete(null)} disabled={isDeletingUser}>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteUserConfirm} disabled={isDeletingUser} className="bg-destructive hover:bg-destructive/90">
                                    {isDeletingUser ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirmar Exclusão"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            )}
                           </AlertDialog>
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
          <DialogContent className="sm:max-w-md">
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
                        O email de login não pode ser alterado por aqui.
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
                 <FormField
                    control={editForm.control}
                    name="lastPayment"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Último Pagamento</FormLabel>
                         <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                    )}
                                >
                                    {field.value ? (
                                    format(parseISO(field.value), "PPP", { locale: ptBR })
                                    ) : (
                                    <span>Defina uma data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                mode="single"
                                selected={field.value ? parseISO(field.value) : undefined}
                                onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                                disabled={(date) => date > new Date() || date < new Date("2020-01-01")}
                                initialFocus
                                locale={ptBR}
                                />
                            </PopoverContent>
                        </Popover>
                        <FormDescription className="text-xs">Deixe em branco para remover a data de último pagamento.</FormDescription>
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

        <Card className="mt-8 bg-green-50 border-green-400 dark:bg-green-900/30 dark:border-green-700">
          <CardHeader className="flex-row items-center gap-2 pb-2">
            <ShieldAlert className="h-5 w-5 text-green-600 dark:text-green-400" />
            <CardTitle className="text-lg text-green-700 dark:text-green-300">Notas Importantes</CardTitle>
          </CardHeader>
          <CardContent className="text-green-700 dark:text-green-400 text-sm space-y-1">
            <p><strong>Gerenciamento de Acesso:</strong> Para desabilitar/habilitar o acesso de um usuário (login), utilize o console do Firebase Authentication.</p>
            <p><strong>Exclusão de Usuário:</strong> A exclusão aqui remove todos os dados do usuário do Firestore. A conta de autenticação (login) deve ser removida manualmente no console do Firebase.</p>
            <p><strong>Impacto das Alterações:</strong> Mudanças de plano e último pagamento aqui afetam o acesso do usuário aos recursos da plataforma e informações de assinatura.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

