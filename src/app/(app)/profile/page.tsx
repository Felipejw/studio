
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCircle, CreditCard, Settings, Loader2, Phone, Fingerprint, ShieldCheck, Edit, Trash2, CalendarClock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { db, doc, getDoc, setDoc, signOut, auth, collection, query, where, getDocs, writeBatch, deleteDoc as deleteFirestoreDoc, Timestamp } from '@/lib/firebase'; 
import { useAuth, type UserProfileData as AuthUserProfileData, type UserPlan } from '@/components/auth-provider'; 
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format, addDays, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ProfilePage() {
  const { user, userId, userProfile, loading: authProfileLoading, profileLoading, setUserProfile: setAuthUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true); 
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', whatsapp: '', cpf: '' });
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const { toast } = useToast();
  const router = useRouter(); 
  const kirvanoPremiumLink = "https://pay.kirvano.com/689ba747-0c2e-4028-88d6-032e4b7c72ab";

  useEffect(() => {
    if (!authProfileLoading) { 
      if (userProfile) {
        setEditForm({
          name: userProfile.name || '',
          email: userProfile.email || '',
          whatsapp: userProfile.whatsapp || '',
          cpf: userProfile.cpf || '',
        });
        setIsLoading(false); 
      } else if (!user && !authProfileLoading && !profileLoading) {
        setIsLoading(false);
      }
    }
    setIsLoading(authProfileLoading);

  }, [userProfile, authProfileLoading, user, profileLoading]);

  const planExpiryDate = useMemo(() => {
    if (userProfile?.plan === 'premium' && userProfile.lastPayment) {
      try {
        const lastPaymentDate = parseISO(userProfile.lastPayment);
        if (isValid(lastPaymentDate)) {
          const expiry = addDays(lastPaymentDate, 30);
          return format(expiry, "dd/MM/yyyy", { locale: ptBR });
        }
      } catch (e) {
        console.error("Error parsing lastPayment date for expiry:", e);
      }
    }
    return "N/A";
  }, [userProfile?.plan, userProfile?.lastPayment]);


  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !userId) return;
    setIsLoading(true); 
     try {
      const userDocRef = doc(db, "users", userId);
      const currentDocSnap = await getDoc(userDocRef);
       if (!currentDocSnap.exists()) {
        toast({ variant: "destructive", title: "Erro", description: "Perfil não encontrado para atualizar." });
        setIsLoading(false);
        return;
      }
      const currentData = currentDocSnap.data() as AuthUserProfileData; 

      const updatedProfileDataFirestore: AuthUserProfileData = { 
        ...currentData, 
        name: editForm.name, 
        // email: editForm.email, // Email de login não deve ser alterado aqui
        whatsapp: editForm.whatsapp || '',
        cpf: editForm.cpf || '',
        plan: currentData.plan, 
        memberSince: currentData.memberSince, 
        lastPayment: currentData.lastPayment, 
        plan_updated_at: currentData.plan_updated_at,
      };
      await setDoc(userDocRef, updatedProfileDataFirestore, { merge: true });
      
      // Update profile in AuthContext
      setAuthUserProfile(updatedProfileDataFirestore);

      setIsEditing(false);
      toast({ title: "Perfil Atualizado", description: "Suas informações foram salvas." });
    } catch (error: any) {
      console.error("Error updating profile:", error, error.stack);
      toast({ variant: "destructive", title: "Erro ao Atualizar Perfil", description: "Verifique o console." });
    }
    setIsLoading(false); 
  };

  const handleDeleteAccount = async () => {
    if (!userId || !user) {
      toast({ variant: "destructive", title: "Erro", description: "Usuário não autenticado." });
      return;
    }
    setIsDeletingAccount(true);
    try {
      const batch = writeBatch(db);

      // Collections to delete user-specific data from
      const collectionsToDelete = [
        { name: 'trades', field: 'userId' },
        { name: 'trading_plans', field: 'userId' },
        { name: 'mindset_logs', field: 'userId' },
        { name: 'trader_group_messages', field: 'userId' }
      ];

      for (const colInfo of collectionsToDelete) {
        const q = query(collection(db, colInfo.name), where(colInfo.field, "==", userId));
        const snapshot = await getDocs(q);
        snapshot.forEach(docSnap => batch.delete(docSnap.ref));
      }

      // Delete risk_config document
      const riskConfigRef = doc(db, 'risk_config', userId);
      const riskConfigSnap = await getDoc(riskConfigRef);
      if (riskConfigSnap.exists()) {
        batch.delete(riskConfigRef);
      }
      
      // Delete user document from 'users' collection
      const userDocRef = doc(db, 'users', userId);
      batch.delete(userDocRef);

      await batch.commit();
      
      await signOut(auth);
      toast({
        title: "Conta Excluída",
        description: "Seus dados foram removidos do Firestore. Você foi desconectado.",
        duration: 7000,
      });
      router.push('/login');

    } catch (error: any) {
      console.error("Error deleting account data:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Excluir Conta",
        description: `Não foi possível remover seus dados. ${error.message || 'Consulte o console.'}`,
      });
    }
    setIsDeletingAccount(false);
  };
  
  if (isLoading || authProfileLoading) { 
    return (
        <div className="container mx-auto py-8 flex justify-center items-center h-[calc(100vh-200px)]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Carregando perfil...</p>
        </div>
    );
  }

  if (!userProfile && !authProfileLoading && !profileLoading) { 
    return (
        <div className="container mx-auto py-8 text-center">
            <p className="mb-4">Não foi possível carregar o perfil. Por favor, tente recarregar a página ou fazer login novamente.</p>
             <Button onClick={() => router.push('/login')} className="mt-4">Ir para Login</Button>
        </div>
    );
  }
  
  if (!userProfile) return null; 

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 font-headline">Seu Perfil e Plano</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div className="flex items-center space-x-4">
                {userProfile.plan === 'premium' ? <ShieldCheck className="h-12 w-12 text-primary" /> : <UserCircle className="h-12 w-12 text-primary" />}
                <div>
                  <CardTitle className="font-headline text-2xl">{userProfile.name}</CardTitle>
                  <CardDescription>{userProfile.email}</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="icon" onClick={() => setIsEditing(!isEditing)} disabled={isLoading || isDeletingAccount}>
                <Edit className="h-4 w-4"/>
                <span className="sr-only">Editar Perfil</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {isEditing ? (
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email (informativo)</Label>
                    <Input id="email" type="email" value={editForm.email} disabled />
                    <p className="text-xs text-muted-foreground mt-1">O email de login não pode ser alterado aqui.</p>
                  </div>
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input id="whatsapp" type="tel" placeholder="(XX) XXXXX-XXXX" value={editForm.whatsapp} onChange={(e) => setEditForm({...editForm, whatsapp: e.target.value})} />
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input id="cpf" placeholder="XXX.XXX.XXX-XX" value={editForm.cpf} onChange={(e) => setEditForm({...editForm, cpf: e.target.value})} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading || isDeletingAccount}>
                        {(isLoading && !isDeletingAccount) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => {setIsEditing(false); setEditForm({name: userProfile.name || '', email: userProfile.email || '', whatsapp: userProfile.whatsapp || '', cpf: userProfile.cpf || ''});}} disabled={isLoading || isDeletingAccount}>Cancelar</Button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground flex items-center"><Phone className="mr-2 h-4 w-4" />WhatsApp</p>
                    <p>{userProfile.whatsapp || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground flex items-center"><Fingerprint className="mr-2 h-4 w-4" />CPF</p>
                    <p>{userProfile.cpf || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Plano Atual</p>
                     <div className="flex items-center gap-2">
                       <p className="font-semibold text-lg text-primary capitalize">{userProfile.plan === 'affiliate_demo' ? 'Demo Afiliados' : userProfile.plan}</p>
                        {userProfile.plan === 'free' && (
                             <Button size="sm" variant="outline" asChild>
                                <a href={kirvanoPremiumLink} target="_blank" rel="noopener noreferrer">
                                  Fazer Upgrade para Premium
                                </a>
                            </Button>
                        )}
                         {userProfile.plan === 'premium' && (
                             <Button size="sm" variant="ghost" onClick={() => router.push('/pricing')} > 
                                Gerenciar Assinatura
                            </Button>
                        )}
                    </div>
                  </div>
                   {userProfile.lastPayment && userProfile.plan === 'premium' && (
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Último Pagamento</p>
                        <p>{isValid(parseISO(userProfile.lastPayment)) ? format(parseISO(userProfile.lastPayment), "dd/MM/yyyy", { locale: ptBR }) : 'Data inválida'}</p>
                    </div>
                   )}
                   {userProfile.plan === 'premium' && (
                    <div>
                        <p className="text-sm font-medium text-muted-foreground flex items-center"><CalendarClock className="mr-2 h-4 w-4" />Data de Vencimento do Plano</p>
                        <p>{planExpiryDate}</p>
                    </div>
                   )}
                   
                   <Button variant="outline" className="w-full sm:w-auto sm:col-span-2" onClick={() => router.push('/pricing')}>
                    <CreditCard className="mr-2 h-4 w-4" /> Ver Opções de Planos
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><Settings className="mr-2 h-5 w-5"/>Configurações da Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full justify-start" disabled={isLoading || isDeletingAccount}>
                    {isDeletingAccount && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Trash2 className="mr-2 h-4 w-4" /> Excluir Minha Conta
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Exclusão de Conta</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir sua conta e todos os seus dados associados (trades, planos, configurações de risco, etc.)? 
                      Esta ação é irreversível. 
                      <br/><br/>
                      <strong>Importante:</strong> Seus dados serão removidos do nosso banco de dados, mas sua conta de login (autenticação) no Firebase permanecerá ativa. Para uma exclusão completa, o administrador precisará remover sua conta de autenticação manualmente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeletingAccount}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/80" disabled={isDeletingAccount}>
                      {isDeletingAccount ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Confirmar Exclusão
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
               <p className="text-xs text-muted-foreground">
                A exclusão da conta remove seus dados do Tubarões da Bolsa (Firestore). Para remover completamente seu login (Firebase Auth), entre em contato com o suporte ou administrador.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
