
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, FileText, BookOpenText, Brain, Gauge, User, DollarSign, Users as GroupsIcon, ClipboardList, Handshake, BrainCircuit, ShoppingCart } from 'lucide-react';

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
    title: 'Diário de Trades',
    href: '/trade-log',
    icon: BookOpenText,
    label: 'Diário de Operações',
  },
  {
    title: 'Plano Diário',
    href: '/daily-plan',
    icon: FileText,
    label: 'Plano Diário Inteligente',
  },
  {
    title: 'Construtor de Estratégias',
    href: '/strategy-builder',
    icon: BrainCircuit,
    label: 'Criar Setup com IA',
  },
  {
    title: 'Psicólogo Virtual',
    href: '/ai-psychologist',
    icon: Brain,
    label: 'Apoio Emocional',
  },
   {
    title: 'Teste de Perfil',
    href: '/trader-profile-test',
    icon: ClipboardList,
    label: 'Descubra seu Perfil',
  },
  {
    title: 'Gestor de Risco',
    href: '/risk-manager',
    icon: Gauge,
    label: 'Controle de Risco',
  },
  {
    title: 'Grupos de Traders',
    href: '/trader-groups',
    icon: GroupsIcon,
    label: 'Comunidades de Trading',
  },
  {
    title: 'Loja do Trader',
    href: '/store',
    icon: ShoppingCart,
    label: 'Produtos Digitais',
  },
  {
    title: 'Afiliados',
    href: '/affiliate',
    icon: Handshake,
    label: 'Programa de Afiliados',
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

    