
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, FileText, BookOpenText, Brain, Gauge, User, TrendingUp, DollarSign, Repeat } from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  label?: string;
  disabled?: boolean;
}

export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    label: 'Painel Principal',
  },
  {
    title: 'Plano Diário',
    href: '/daily-plan',
    icon: FileText,
    label: 'Plano Diário Inteligente',
  },
  {
    title: 'Diário de Trades',
    href: '/trade-log',
    icon: BookOpenText,
    label: 'Diário de Operações',
  },
  {
    title: 'Painel de Mercado',
    href: '/market-overview',
    icon: TrendingUp,
    label: 'Visão Geral do Mercado',
  },
   {
    title: 'Market Replay',
    href: '/market-replay',
    icon: Repeat, // Using Repeat icon
    label: 'Simulação de Mercado',
  },
  {
    title: 'Psicólogo Virtual',
    href: '/ai-psychologist',
    icon: Brain,
    label: 'Apoio Emocional',
  },
  {
    title: 'Gestor de Risco',
    href: '/risk-manager',
    icon: Gauge,
    label: 'Controle de Risco',
  },
  {
    title: 'Planos',
    href: '/pricing',
    icon: DollarSign,
    label: 'Nossos Planos',
  },
  {
    title: 'Perfil',
    href: '/profile',
    icon: User,
    label: 'Seu Perfil e Plano',
  },
];
