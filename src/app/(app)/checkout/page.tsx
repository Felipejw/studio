
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';
import { db, doc, setDoc, Timestamp, getDoc } from '@/lib/firebase';
import { Loader2, CreditCard, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type UserPlan = 'free' | 'pro' | 'vitalicio';

interface UserProfileDataFirestore {
  uid: string;
  name: string;
  email: string;
  plan: UserPlan;
  memberSince: Timestamp;
  lastPayment?: Timestamp;
}

// Placeholder plan details - in a real app, this would come from a config or API
const planDetails: Record<UserPlan, { name: string; price: string }> = {
  free: { name: 'Plano Gratuito', price: 'R$0/mês' },
  pro: { name: 'Plano Pro', price: 'R$49/mês' },
  vitalicio: { name: 'Plano Vitalício', price: 'R$499 (único)' },
};

const checkoutSchema = z.object({
  nameOnCard: z.string().min(3, { message: "Nome no cartão é obrigatório." }),
  cardNumber: z.string().min(16, { message: "Número do cartão inválido." }).max(19, { message: "Número do cartão inválido." }),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, { message: "Data de validade inválida (MM/AA)." }),
  cvv: z.string().min(3, { message: "CVV inválido." }).max(4, { message: "CVV inválido." }),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, userId } = useAuth();

  const [selectedPlanId, setSelectedPlanId] = useState<UserPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      nameOnCard: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
    },
  });

  useEffect(() => {
    const planId = searchParams.get('planId') as UserPlan;
    if (planId && planDetails[planId]) {
      setSelectedPlanId(planId);
    } else {
      toast({ variant: "destructive", title: "Plano Inválido", description: "Nenhum plano selecionado ou plano inválido." });
      router.push('/pricing');
    }
  }, [searchParams, router, toast]);

  const onSubmit: SubmitHandler<CheckoutFormValues> = async (data) => {
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
      const currentData = userDocSnap.data() as UserProfileDataFirestore;
      
      const updatedProfileData: Partial<UserProfileDataFirestore> = {
        plan: selectedPlanId,
      };

      if (selectedPlanId === 'pro' || selectedPlanId === 'vitalicio') {
        updatedProfileData.lastPayment = Timestamp.fromDate(new Date());
      }

      await setDoc(userDocRef, updatedProfileData, { merge: true });

      toast({
        title: "Assinatura Confirmada!",
        description: `Você agora está no ${planDetails[selectedPlanId].name}.`,
      });
      router.push('/profile'); 
    } catch (error: any) {
      console.error("Error updating plan:", error);
      toast({ variant: "destructive", title: "Erro na Assinatura", description: error.message || "Não foi possível atualizar seu plano." });
    }
    setIsSubmitting(false);
  };

  if (!selectedPlanId) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 max-w-2xl">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Planos
      </Button>

      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex justify-center mb-4">
             <CreditCard className="h-12 w-12 text-primary"/>
          </div>
          <CardTitle className="text-2xl font-bold text-center font-headline">Checkout Seguro</CardTitle>
          <CardDescription className="text-center">
            Você está assinando o: <span className="font-semibold text-primary">{planDetails[selectedPlanId].name}</span> por <span className="font-semibold">{planDetails[selectedPlanId].price}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="nameOnCard"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome no Cartão</FormLabel>
                    <FormControl><Input placeholder="Nome como aparece no cartão" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cardNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Cartão</FormLabel>
                    <FormControl><Input placeholder="0000 0000 0000 0000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Validade (MM/AA)</FormLabel>
                      <FormControl><Input placeholder="MM/AA" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cvv"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CVV</FormLabel>
                      <FormControl><Input placeholder="123" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                <ShieldCheck className="inline h-4 w-4 mr-1 text-green-600" />
                Este é um checkout simulado. Nenhuma informação de pagamento real será processada ou armazenada.
              </p>
              <Button type="submit" className="w-full text-lg py-3" disabled={isSubmitting || !user}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-5 w-5" />
                )}
                Confirmar Assinatura ({planDetails[selectedPlanId].price})
              </Button>
            </form>
          </Form>
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

