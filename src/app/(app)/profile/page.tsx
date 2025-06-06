
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCircle, CreditCard, Settings, History, Download, Star, BarChartHorizontalBig, Edit, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { db, doc, getDoc, setDoc } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';

type UserPlan = 'free' | 'pro' | 'vitalicio';

interface UserProfileData {
  uid: string;
  name: string;
  email: string;
  plan: UserPlan;
  memberSince: string; 
  lastPayment?: string; 
}

const consistencyLevels = [
    { name: "Iniciante", stars: 1, iconHint: "bronze medal" },
    { name: "Tático", stars: 2, iconHint: "silver medal" },
    { name: "Consistente", stars: 3, iconHint: "gold medal" },
    { name: "Disciplinado", stars: 4, iconHint: "platinum trophy" },
    { name: "Mestre", stars: 5, iconHint: "diamond award" },
];

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '' });

  const { toast } = useToast();
  const { user, userId } = useAuth();

  const currentLevel = consistencyLevels[2]; 

  const fetchUserProfile = async () => {
    if (!userId) {
      setIsLoading(false);
      setUserProfile(null);
      return;
    }
    setIsLoading(true);
    try {
      const userDocRef = doc(db, "users", userId);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfileData;
        setUserProfile(data);
        setEditForm({ name: data.name, email: data.email });
      } else {
        // This case should ideally be handled at signup
        // or if user document creation failed.
        // For robustness, create a default if missing and user is authenticated.
        if (user) {
            const defaultProfile: UserProfileData = {
              uid: user.uid,
              name: user.displayName || 'Novo Usuário',
              email: user.email || 'email@desconhecido.com',
              plan: 'free',
              memberSince: new Date().toISOString(),
            };
            await setDoc(userDocRef, defaultProfile);
            setUserProfile(defaultProfile);
            setEditForm({ name: defaultProfile.name, email: defaultProfile.email });
            toast({ title: "Perfil Criado", description: "Seu perfil inicial foi configurado." });
        } else {
             setUserProfile(null); // No user, no profile
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast({ variant: "destructive", title: "Erro ao Carregar Perfil" });
      setUserProfile(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUserProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, user]); // Depend on userId and user object

  const handlePlanChange = async (newPlan: UserPlan) => {
    if (!userProfile || !userId) return;
    try {
      const userDocRef = doc(db, "users", userId);
      const updatedProfile = { ...userProfile, plan: newPlan };
      await setDoc(userDocRef, updatedProfile, { merge: true });
      setUserProfile(updatedProfile);
      toast({
        title: "Plano Atualizado!",
        description: `Seu plano agora é ${newPlan.toUpperCase()}.`,
      });
    } catch (error) {
      console.error("Error updating plan:", error);
      toast({ variant: "destructive", title: "Erro ao Atualizar Plano" });
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !userId) return;
    try {
      const userDocRef = doc(db, "users", userId);
      const updatedProfileData = { ...userProfile, name: editForm.name, email: editForm.email };
      // Note: Email updates here don't update Firebase Auth email. That requires a separate process.
      await setDoc(userDocRef, updatedProfileData, { merge: true });
      setUserProfile(updatedProfileData);
      setIsEditing(false);
      toast({ title: "Perfil Atualizado", description: "Suas informações foram salvas." });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ variant: "destructive", title: "Erro ao Atualizar Perfil" });
    }
  };

  const activityHistory = [
    { id: 1, date: '20/07/2024', action: 'Plano Diário Gerado' },
    { id: 2, date: '20/07/2024', action: 'Novo Trade Registrado: WINQ24' },
    { id: 3, date: '19/07/2024', action: 'Sessão com Psicólogo Virtual' },
  ];
  
  if (isLoading) {
    return (
        <div className="container mx-auto py-8 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Carregando perfil...</p>
        </div>
    );
  }

  if (!userProfile || !user) { // Check both userProfile from Firestore and user from Auth
    return (
        <div className="container mx-auto py-8">
            <p>Não foi possível carregar o perfil. Por favor, tente fazer login novamente.</p>
             <Button onClick={() => router.push('/login')} className="mt-4">Ir para Login</Button>
        </div>
    );
  }
  // Make sure to import router if you use the button above: import { useRouter } from 'next/navigation'; const router = useRouter();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 font-headline">Seu Perfil e Plano</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div className="flex items-center space-x-4">
                <UserCircle className="h-12 w-12 text-primary" />
                <div>
                  <CardTitle className="font-headline text-2xl">{userProfile.name}</CardTitle>
                  <CardDescription>{userProfile.email}</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="icon" onClick={() => setIsEditing(!isEditing)}>
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
                    <Input id="email" type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} />
                    <p className="text-xs text-muted-foreground mt-1">Para alterar o email de login, use as opções do Firebase Auth (não implementado aqui).</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Salvar</Button>
                    <Button type="button" variant="ghost" onClick={() => {setIsEditing(false); setEditForm({name: userProfile.name, email: userProfile.email});}}>Cancelar</Button>
                  </div>
                </form>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Plano Atual</p>
                    <div className="flex items-center gap-2">
                       <p className="font-semibold text-lg text-primary">{userProfile.plan.toUpperCase()}</p>
                        <Select value={userProfile.plan} onValueChange={(value: UserPlan) => handlePlanChange(value)}>
                            <SelectTrigger className="w-[180px] h-8 text-xs">
                                <SelectValue placeholder="Mudar plano" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="free">Gratuito</SelectItem>
                                <SelectItem value="pro">Pro (Simular)</SelectItem>
                                <SelectItem value="vitalicio">Vitalício (Simular)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                  </div>
                   {userProfile.lastPayment && (
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Último Pagamento</p>
                        <p>{new Date(userProfile.lastPayment).toLocaleDateString('pt-BR')}</p>
                    </div>
                   )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Membro Desde</p>
                    <p>{new Date(userProfile.memberSince).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <Button variant="outline" className="w-full sm:w-auto" disabled>
                    <CreditCard className="mr-2 h-4 w-4" /> Gerenciar Assinatura (Em breve)
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><History className="mr-2 h-5 w-5" />Histórico de Atividades Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {activityHistory.slice(0, 3).map(activity => (
                  <li key={activity.id} className="text-sm flex justify-between p-2 hover:bg-muted/50 rounded-md">
                    <span>{activity.action}</span>
                    <span className="text-muted-foreground">{activity.date}</span>
                  </li>
                ))}
              </ul>
              {activityHistory.length > 3 && <Button variant="link" className="mt-2 p-0 h-auto" disabled>Ver tudo (Em breve)</Button>}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><BarChartHorizontalBig className="mr-2 h-5 w-5"/>Progresso de Consistência</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
                <Image src={`https://placehold.co/100x100.png`} alt="Ícone do Nível" width={80} height={80} className="mx-auto mb-2 rounded-full bg-primary/20 p-2" data-ai-hint={`${currentLevel.iconHint} achievement`}/>
                <p className="text-xl font-semibold">{currentLevel.name}</p>
                <div className="flex justify-center my-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                       <Star key={i} className={`w-5 h-5 ${i < currentLevel.stars ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50'}`}/>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">Continue focado na disciplina para evoluir!</p>
                <Button variant="outline" size="sm" className="mt-3 w-full" disabled>Ver Detalhes (Em breve)</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><Settings className="mr-2 h-5 w-5"/>Configurações da Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" disabled>
                <Download className="mr-2 h-4 w-4" /> Exportar Dados (.csv) (Premium)
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                Notificações Push (Em breve)
              </Button>
               <Button variant="destructive" className="w-full justify-start" disabled>
                Excluir Conta (Em breve)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
