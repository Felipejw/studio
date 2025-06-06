
'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { createUserWithEmailAndPassword, auth, setDoc, doc, db, Timestamp } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { LeafIcon, Loader2 } from 'lucide-react';
import type { UserPlan } from '@/components/auth-provider'; // Import UserPlan type

const signupSchema = z.object({
  name: z.string().min(2, {message: "Nome é obrigatório (mínimo 2 caracteres)."}),
  email: z.string().email({ message: 'Email inválido.' }),
  password: z.string().min(6, { message: 'Senha deve ter pelo menos 6 caracteres.' }),
  whatsapp: z.string().min(10, {message: "WhatsApp deve ter pelo menos 10 dígitos."}).optional().or(z.literal('')),
  cpf: z.string().min(11, {message: "CPF deve ter 11 dígitos."}).optional().or(z.literal('')),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      whatsapp: '',
      cpf: '',
    },
  });

  const onSubmit: SubmitHandler<SignupFormValues> = async (data) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // Create user profile in Firestore
      const defaultPlan: UserPlan = 'free'; // Default plan is 'free'
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        name: data.name,
        whatsapp: data.whatsapp || '',
        cpf: data.cpf || '',
        plan: defaultPlan, 
        memberSince: Timestamp.fromDate(new Date()), 
      });

      toast({ title: 'Cadastro realizado!', description: 'Sua conta foi criada. Redirecionando...' });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Signup error:', error);
      let errorMessage = 'Erro ao criar conta. Tente novamente.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email já está cadastrado.';
      }
      toast({ variant: 'destructive', title: 'Falha no Cadastro', description: errorMessage });
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <Link href="/" className="mb-4 inline-flex items-center justify-center space-x-2">
            <LeafIcon className="h-10 w-10 text-primary" />
             <span className="text-2xl font-bold font-headline">Trader's Cockpit</span>
          </Link>
          <CardTitle className="text-2xl font-headline">Criar Nova Conta</CardTitle>
          <CardDescription>Junte-se à plataforma e aprimore sua disciplina.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="seu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Crie uma senha forte (mín. 6 caracteres)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp (Opcional)</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="(XX) XXXXX-XXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="XXX.XXX.XXX-XX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Criar Conta
              </Button>
            </form>
          </Form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Faça login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
