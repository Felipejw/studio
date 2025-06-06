
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, DollarSign, Crown, Star } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';

type PlanFeature = string;

interface PricingPlan {
  id: 'free' | 'pro' | 'vitalicio';
  name: string;
  price: string;
  priceFrequency?: string;
  description: string;
  features: PlanFeature[];
  icon: React.ElementType;
  cta: string;
  popular?: boolean;
}

const plans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Plano Gratuito',
    price: 'R$0',
    priceFrequency: '/mês',
    description: 'Comece a organizar seus trades sem custo.',
    features: [
      'Registro de Trades (limitado)',
      'Dashboard Básico',
      'Calculadora de Risco Simples',
    ],
    icon: Star,
    cta: 'Começar Gratuitamente',
  },
  {
    id: 'pro',
    name: 'Plano Pro',
    price: 'R$49',
    priceFrequency: '/mês',
    description: 'Ferramentas avançadas para traders sérios.',
    features: [
      'Registro de Trades Ilimitado',
      'Dashboard Completo com Métricas Avançadas',
      'Plano Diário com IA',
      'Psicólogo Virtual com IA',
      'Gestor de Risco Detalhado',
      'Painel de Mercado',
    ],
    icon: Crown,
    cta: 'Assinar Plano Pro',
    popular: true,
  },
  {
    id: 'vitalicio',
    name: 'Plano Vitalício',
    price: 'R$499',
    description: 'Acesso completo para sempre, pagamento único.',
    features: [
      'Todos os recursos do Plano Pro',
      'Acesso vitalício à plataforma',
      'Suporte prioritário',
      'Atualizações futuras inclusas',
    ],
    icon: DollarSign,
    cta: 'Adquirir Acesso Vitalício',
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();

  const handleSelectPlan = (planId: string) => {
    if (!user) {
      router.push('/login?redirect=/pricing'); // Redireciona para login se não estiver logado
    } else {
      router.push(`/checkout?planId=${planId}`);
    }
  };

  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 font-headline">Escolha o Plano Ideal para Você</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Desbloqueie todo o potencial da sua jornada de trading com nossas ferramentas e insights.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 ${
              plan.popular ? 'border-primary border-2 ring-4 ring-primary/20' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-full shadow-md">
                  MAIS POPULAR
                </span>
              </div>
            )}
            <CardHeader className="pt-8">
              <div className="flex items-center justify-center mb-4">
                <plan.icon className={`h-12 w-12 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <CardTitle className="text-2xl font-semibold text-center font-headline">{plan.name}</CardTitle>
              <div className="text-center">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.priceFrequency && <span className="text-muted-foreground">{plan.priceFrequency}</span>}
              </div>
              <CardDescription className="text-center min-h-[40px] mt-2">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <div className="p-6 pt-0 mt-auto">
              <Button
                onClick={() => handleSelectPlan(plan.id)}
                className={`w-full text-lg py-3 ${plan.popular ? '' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                size="lg"
              >
                {plan.cta}
              </Button>
            </div>
          </Card>
        ))}
      </div>
       <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>Todos os pagamentos são processados de forma segura. Você pode cancelar ou alterar seu plano a qualquer momento (simulado).</p>
          <p>Dúvidas? <Link href="/contact" className="text-primary hover:underline">Entre em contato conosco</Link>.</p>
        </div>
    </div>
  );
}
