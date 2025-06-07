
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCircle, CreditCard, Settings, Loader2, Phone, Fingerprint, ShieldCheck, Edit, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { db, doc, getDoc, setDoc } from '@/lib/firebase'; 
import { useAuth, type UserProfileData as AuthUserProfileData, type UserPlan } from '@/components/auth-provider'; 

export default function ProfilePage() {
  const { user, userId, userProfile, loading: authProfileLoading, profileLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true); 
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', whatsapp: '', cpf: '' });

  const { toast } = useToast();
  const router = useRouter(); 

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


  const handlePlanChangeNavigation = (newPlan: UserPlan) => {
    if (!userProfile || !userId) return;
    if (newPlan !== userProfile.plan) {
      router.push(`/checkout?planId=${newPlan}`);
    } else {
       toast({ title: "Plano Atual", description: "Você já está neste plano." });
    }
  };

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
        email: editForm.email, 
        whatsapp: editForm.whatsapp || '',
        cpf: editForm.cpf || '',
        plan: currentData.plan, 
        memberSince: currentData.memberSince, 
        lastPayment: currentData.lastPayment, 
      };
      await setDoc(userDocRef, updatedProfileDataFirestore, { merge: true });
      
      setIsEditing(false);
      toast({ title: "Perfil Atualizado", description: "Suas informações foram salvas." });
    } catch (error: any) {
      console.error("Error updating profile:", error, error.stack);
      toast({ variant: "destructive", title: "Erro ao Atualizar Perfil", description: "Verifique o console." });
    }
    setIsLoading(false); 
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
              <Button variant="outline" size="icon" onClick={() => setIsEditing(!isEditing)} disabled={isLoading}>
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
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => {setIsEditing(false); setEditForm({name: userProfile.name, email: userProfile.email, whatsapp: userProfile.whatsapp || '', cpf: userProfile.cpf || ''});}} disabled={isLoading}>Cancelar</Button>
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
                       <p className="font-semibold text-lg text-primary">{userProfile.plan === 'premium' ? 'Premium' : 'Gratuito'}</p>
                        {userProfile.plan === 'free' && (
                             <Button size="sm" variant="outline" onClick={() => handlePlanChangeNavigation('premium')}>
                                Fazer Upgrade para Premium
                            </Button>
                        )}
                         {userProfile.plan === 'premium' && (
                             <Button size="sm" variant="ghost" onClick={() => router.push('/pricing')} disabled>
                                Gerenciar Assinatura (em Planos)
                            </Button>
                        )}
                    </div>
                  </div>
                   {userProfile.lastPayment && userProfile.plan === 'premium' && (
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Último Pagamento (Premium)</p>
                        <p>{new Date(userProfile.lastPayment).toLocaleDateString('pt-BR')}</p>
                    </div>
                   )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Membro Desde</p>
                    <p>{userProfile.memberSince ? new Date(userProfile.memberSince).toLocaleDateString('pt-BR') : 'N/A'}</p>
                  </div>
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
               <Button variant="destructive" className="w-full justify-start" disabled>
                <Trash2 className="mr-2 h-4 w-4" /> Excluir Conta (Em breve)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
