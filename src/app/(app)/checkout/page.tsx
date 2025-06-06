
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth, type UserPlan as AuthUserPlan, type UserProfileData } from '@/components/auth-provider';
import { db, doc, setDoc, Timestamp, getDoc } from '@/lib/firebase';
import { Loader2, ArrowLeft, Copy, QrCode } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Use UserPlan from auth-provider
type UserPlan = AuthUserPlan;

interface PlanDetails {
  name: string;
  price: string;
}

const planDetailsMap: Record<UserPlan, PlanDetails> = {
  free: { name: 'Plano Gratuito', price: 'R$0/mês' },
  premium: { name: 'Plano Premium', price: 'R$97/mês' },
};


function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, userId, userProfile, profileLoading } = useAuth(); // Get userProfile to check current plan

  const [selectedPlanId, setSelectedPlanId] = useState<UserPlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pixCode] = useState("00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000520400005303986540597.005802BR5922NOME DO SEU NEGOCIO6014CIDADE DO SEU NEGOCIO62070503***6304ABCD"); 

  useEffect(() => {
    const planId = searchParams.get('planId') as UserPlan;
    if (planId && planDetailsMap[planId]) {
      setSelectedPlanId(planId);
    } else {
      toast({ variant: "destructive", title: "Plano Inválido", description: "Nenhum plano selecionado ou plano inválido." });
      router.push('/pricing');
    }
  }, [searchParams, router, toast]);

  useEffect(() => {
    // If user is already on the selected plan, redirect them or show a message
    if (!profileLoading && userProfile && selectedPlanId && userProfile.plan === selectedPlanId) {
      toast({
        title: "Plano Atual",
        description: `Você já está no ${planDetailsMap[selectedPlanId].name}.`,
      });
      router.push('/profile');
    }
  }, [userProfile, selectedPlanId, profileLoading, router, toast]);


  const handleConfirmPixPayment = async () => {
    if (!userId || !selectedPlanId) {
      toast({ variant: "destructive", title: "Erro", description: "Usuário não autenticado ou plano não selecionado." });
      return;
    }
    setIsSubmitting(true);
    try {
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        throw new Error("Perfil de usuário não encontrado.");
      }
      
      const currentData = userDocSnap.data() as UserProfileData;
      const updatedProfileData: Partial<UserProfileData> = {
        ...currentData, // Preserve existing data
        plan: selectedPlanId,
        lastPayment: Timestamp.fromDate(new Date()), // Update lastPayment for any paid plan
      };

      await setDoc(userDocRef, updatedProfileData, { merge: true });

      toast({
        title: "Assinatura Confirmada!",
        description: `Seu pagamento PIX (simulado) foi confirmado. Você agora está no ${planDetailsMap[selectedPlanId].name}.`,
      });
      router.push('/profile'); 
    } catch (error: any) {
      console.error("Error updating plan:", error);
      toast({ variant: "destructive", title: "Erro na Assinatura", description: error.message || "Não foi possível atualizar seu plano." });
    }
    setIsSubmitting(false);
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    toast({
      title: "PIX Copiado!",
      description: "O código PIX Copia e Cola foi copiado para sua área de transferência.",
    });
  };

  if (profileLoading || !selectedPlanId || !planDetailsMap[selectedPlanId]) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const currentPlanDetails = planDetailsMap[selectedPlanId];

  return (
    <div className="container mx-auto py-12 max-w-md">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Planos
      </Button>

      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex justify-center mb-4">
             <QrCode className="h-12 w-12 text-primary"/>
          </div>
          <CardTitle className="text-2xl font-bold text-center font-headline">Pagamento via PIX</CardTitle>
          <CardDescription className="text-center">
            Você está assinando o: <span className="font-semibold text-primary">{currentPlanDetails.name}</span> por <span className="font-semibold">{currentPlanDetails.price}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Escaneie o QR Code abaixo com seu app de pagamentos:</p>
            <div className="flex justify-center my-4">
              <Image 
                src="https://placehold.co/256x256.png" 
                alt="PIX QR Code" 
                width={200} 
                height={200}
                className="rounded-md border"
                data-ai-hint="QR code payment"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">Ou use o PIX Copia e Cola:</p>
            <div className="bg-muted p-3 rounded-md text-sm break-all relative">
              <code>{pixCode}</code>
              <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={copyPixCode}>
                <Copy className="h-4 w-4"/>
                <span className="sr-only">Copiar código PIX</span>
              </Button>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Este é um processo de pagamento PIX simulado. Nenhum pagamento real será processado.
          </p>

          <Button onClick={handleConfirmPixPayment} className="w-full text-lg py-3" disabled={isSubmitting || !user || profileLoading || userProfile?.plan === selectedPlanId}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <QrCode className="mr-2 h-5 w-5" />
            )}
            Já Paguei / Confirmar Assinatura
          </Button>
        </CardContent>
      </Card>
       <p className="text-center mt-6 text-sm text-muted-foreground">
        Ao confirmar, você concorda com nossos (simulados) <Link href="/terms" className="underline hover:text-primary">Termos de Serviço</Link>.
      </p>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <CheckoutPageContent />
    </Suspense>
  );
}
