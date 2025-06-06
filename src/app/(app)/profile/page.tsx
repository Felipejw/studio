'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { UserCircle, CreditCard, Settings, History, Download, Star, BarChartHorizontalBig } from 'lucide-react';
import Image from 'next/image';

export default function ProfilePage() {
  // Mock data
  const userProfile = {
    name: 'Trader Exemplo',
    email: 'trader@exemplo.com',
    currentPlan: 'Plano Pro',
    lastPayment: '15/07/2024',
    memberSince: '01/01/2024',
  };

  const activityHistory = [
    { id: 1, date: '20/07/2024', action: 'Plano Diário Gerado' },
    { id: 2, date: '20/07/2024', action: 'Novo Trade Registrado: WINQ24' },
    { id: 3, date: '19/07/2024', action: 'Sessão com Psicólogo Virtual' },
    { id: 4, date: '18/07/2024', action: 'Simulação de Replay Realizada' },
  ];

  const consistencyLevels = [
    { name: "Iniciante", stars: 1, icon: <Star className="w-4 h-4 text-yellow-400 fill-yellow-400"/> },
    { name: "Tático", stars: 2, icon: <Star className="w-4 h-4 text-yellow-400 fill-yellow-400"/> },
    { name: "Consistente", stars: 3, icon: <Star className="w-4 h-4 text-yellow-400 fill-yellow-400"/> },
    { name: "Disciplinado", stars: 4, icon: <Star className="w-4 h-4 text-yellow-400 fill-yellow-400"/> },
    { name: "Mestre", stars: 5, icon: <Star className="w-4 h-4 text-yellow-400 fill-yellow-400"/> },
  ];
  const currentLevel = consistencyLevels[2]; // Example: Consistente

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 font-headline">Seu Perfil e Plano</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center space-x-4">
              <UserCircle className="h-12 w-12 text-primary" />
              <div>
                <CardTitle className="font-headline text-2xl">{userProfile.name}</CardTitle>
                <CardDescription>{userProfile.email}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Plano Atual</p>
                <p className="font-semibold text-lg text-primary">{userProfile.currentPlan}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Último Pagamento</p>
                <p>{userProfile.lastPayment}</p>
              </div>
               <div>
                <p className="text-sm font-medium text-muted-foreground">Membro Desde</p>
                <p>{userProfile.memberSince}</p>
              </div>
              <Button variant="outline" className="w-full sm:w-auto">
                <CreditCard className="mr-2 h-4 w-4" /> Mudar de Plano (Em breve)
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><History className="mr-2 h-5 w-5" />Histórico de Atividades</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {activityHistory.slice(0, 5).map(activity => ( // Show last 5 activities
                  <li key={activity.id} className="text-sm flex justify-between p-2 hover:bg-muted/50 rounded-md">
                    <span>{activity.action}</span>
                    <span className="text-muted-foreground">{activity.date}</span>
                  </li>
                ))}
              </ul>
              {activityHistory.length > 5 && <Button variant="link" className="mt-2">Ver tudo</Button>}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><BarChartHorizontalBig className="mr-2 h-5 w-5"/>Progresso de Consistência</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
                <Image src={`https://placehold.co/150x150.png`} alt="Ícone do Nível" width={80} height={80} className="mx-auto mb-2 rounded-full bg-primary/20 p-2" data-ai-hint={`${currentLevel.name} badge`}/>
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
                <Download className="mr-2 h-4 w-4" /> Exportar Dados (.csv)
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                Notificações Push
              </Button>
               <Button variant="destructive" className="w-full justify-start" disabled>
                Excluir Conta
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
