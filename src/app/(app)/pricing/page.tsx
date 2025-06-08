
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, DollarSign, Star, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';

type PlanFeature = string;
export type UserPlanPricing = 'free' | 'premium'; // Updated type

interface PricingPlan {
  id: UserPlanPricing;
  name: string;
  price: string;
  priceFrequency?: string;
  description: string;
  features: PlanFeature[];
  icon: React.ElementType;
  cta: string;
  popular?: boolean;
  externalLink?: string; // Added for direct external links
}

const plans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Plano Gratuito',
    price: 'R$0',
    priceFrequency: '/mês',
    description: 'Organize seus trades básicos sem custo.',
    features: [
      'Dashboard Básico',
      'Diário de Trades',
      'Programa de Afiliados',
      'Visualização de Planos',
      'Gerenciamento de Perfil',
      'Suporte Comunitário',
    ],
    icon: Star,
    cta: 'Começar Gratuitamente',
  },
  {
    id: 'premium',
    name: 'Plano Premium',
    price: 'R$97',
    priceFrequency: '/mês',
    description: 'Ferramentas avançadas com IA para traders sérios.',
    features: [
      'Todos os recursos do Gratuito',
      'Dashboard Completo com Métricas Avançadas',
      'Plano Diário com IA',
      'Construtor de Estratégias com IA',
      'Psicólogo Virtual com IA',
      'Teste de Perfil de Trader com IA',
      'Gestor de Risco Detalhado',
      'Grupos de Traders',
      'Suporte Prioritário',
    ],
    icon: ShieldCheck,
    cta: 'Assinar Plano Premium',
    popular: true,
    externalLink: 'https://pay.kirvano.com/689ba747-0c2e-4028-88d6-032e4b7c72ab', // Your Kirvano link
  },
];

export default function PricingPage() {
  const { user, userProfile } = useAuth(); // userProfile for current plan check
  const router = useRouter();

  const handleSelectPlan = (plan: PricingPlan) => {
    if (plan.externalLink) {
      // If user is not logged in, they can still go to external payment page
      window.open(plan.externalLink, '_blank');
      return;
    }

    if (!user) {
      router.push('/login?redirect=/pricing');
    } else {
      router.push(`/checkout?planId=${plan.id}`);
    }
  };

  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 font-headline">Escolha o Plano Ideal para Você</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Desbloqueie o potencial máximo da sua jornada de trading com nossas ferramentas e insights.
        </p>
      </div>

      <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8 items-stretch max-w-3xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 ${
              plan.popular ? 'border-primary border-2 ring-4 ring-primary/20' : ''
            } ${userProfile?.plan === plan.id ? 'bg-primary/5' : ''}`}
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
              {userProfile?.plan === plan.id ? (
                 <Button
                    variant="outline"
                    className="w-full text-lg py-3"
                    size="lg"
                    disabled
                  >
                    Plano Atual
                  </Button>
              ) : plan.externalLink ? (
                <Button
                  asChild
                  className={`w-full text-lg py-3 ${plan.popular ? '' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                  size="lg"
                >
                  <a href={plan.externalLink} target="_blank" rel="noopener noreferrer">
                    {plan.cta}
                  </a>
                </Button>
              ) : (
                 <Button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full text-lg py-3 ${plan.popular ? '' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
       <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>Pagamentos seguros via Pix e Cartão de Crédito. Você pode cancelar ou alterar seu plano a qualquer momento (simulado).</p>
          <p>Dúvidas? <Link href="/contact" className="text-primary hover:underline">Entre em contato conosco</Link>.</p>
        </div>
    </div>
  );
}
