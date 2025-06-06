
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, TrendingDown, BarChartBig, Users, CalendarDays, Bell } from 'lucide-react'; // Added TrendingDown
import Image from 'next/image';

interface MarketAssetProps {
  name: string;
  trend: 'Alta' | 'Baixa' | 'Lateral';
  volume?: string;
  icon?: React.ReactNode;
  dataAiHint?: string;
}

const MarketAssetCard: React.FC<MarketAssetProps> = ({ name, trend, volume, icon, dataAiHint }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium font-headline">{name}</CardTitle>
      {icon || <TrendingUp className="h-4 w-4 text-muted-foreground" />}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{trend}</div>
      {volume && <p className="text-xs text-muted-foreground">Volume: {volume}</p>}
      {name === "Ibovespa (Ações)" && (
         <Image 
            src="https://placehold.co/300x150.png" 
            alt={`${name} chart`}
            width={300}
            height={150}
            className="mt-2 rounded-md w-full h-auto max-w-[300px]"
            data-ai-hint={dataAiHint || "stock chart"}
          />
      )}
    </CardContent>
  </Card>
);

interface EconomicEventProps {
  time: string;
  event: string;
  impact: 'Alto' | 'Médio' | 'Baixo';
  country: string;
}

const EconomicEventItem: React.FC<EconomicEventProps> = ({ time, event, impact, country }) => (
 <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-md transition-colors">
    <div className="flex items-center gap-3">
      <Bell className={`h-5 w-5 ${impact === 'Alto' ? 'text-destructive' : impact === 'Médio' ? 'text-yellow-500' : 'text-green-500'}`} />
      <div>
        <p className="font-medium">{event} ({country})</p>
        <p className="text-sm text-muted-foreground">{time}</p>
      </div>
    </div>
    <div className={`text-xs font-semibold px-2 py-1 rounded-full
      ${impact === 'Alto' ? 'bg-destructive/20 text-destructive' : 
        impact === 'Médio' ? 'bg-yellow-500/20 text-yellow-600' : 
        'bg-green-500/20 text-green-600'}`}>
      Impacto {impact}
    </div>
  </div>
);


export default function MarketOverviewPage() {
  const economicEvents: EconomicEventProps[] = [
    { time: "09:30", event: "Payroll (EUA)", impact: "Alto", country: "EUA" },
    { time: "10:00", event: "Confiança do Consumidor (Brasil)", impact: "Médio", country: "BRA" },
    { time: "14:00", event: "Discurso do Presidente do BCE", impact: "Alto", country: "EUR" },
    { time: "22:00", event: "Produção Industrial (China)", impact: "Médio", country: "CHN" },
  ];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 font-headline">Painel de Mercado</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 font-headline">Tendência de Ativos</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MarketAssetCard name="Índice Futuro (WIN)" trend="Alta" volume="1.2M Contratos" icon={<TrendingUp className="h-4 w-4 text-green-500"/>} dataAiHint="index chart" />
          <MarketAssetCard name="Dólar Futuro (WDO)" trend="Baixa" volume="800k Contratos" icon={<TrendingDown className="h-4 w-4 text-red-500"/>} dataAiHint="currency chart" />
          <MarketAssetCard name="Ibovespa (Ações)" trend="Lateral" dataAiHint="stocks chart"/>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 font-headline">Visão Geral</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium font-headline">Volume Agregado (B3)</CardTitle>
              <BarChartBig className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 15.7 Bilhões</div>
              <p className="text-xs text-muted-foreground">+5.2% em relação a ontem</p>
               <Image 
                  src="https://placehold.co/600x200.png"
                  alt="Volume chart"
                  width={600}
                  height={200}
                  className="mt-2 rounded-md w-full h-auto max-w-[600px]"
                  data-ai-hint="volume graph"
                />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium font-headline">Posição dos Players</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                <li><span className="font-semibold">Institucionais:</span> Comprados em 120k contratos</li>
                <li><span className="font-semibold">Estrangeiros:</span> Vendidos em 80k contratos</li>
                <li><span className="font-semibold">Pessoa Física (Retail):</span> Comprados em 20k contratos</li>
              </ul>
               <Image 
                  src="https://placehold.co/600x150.png"
                  alt="Player position chart"
                  width={600}
                  height={150}
                  className="mt-2 rounded-md w-full h-auto max-w-[600px]"
                  data-ai-hint="pie chart"
                />
            </CardContent>
          </Card>
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4 font-headline flex items-center">
          <CalendarDays className="mr-3 h-6 w-6" /> Calendário Econômico do Dia
        </h2>
        <Card>
          <CardContent className="pt-4 space-y-2">
            {economicEvents.length > 0 ? economicEvents.map(event => (
              <EconomicEventItem key={event.event + event.time} {...event} />
            )) : (
              <p className="text-muted-foreground">Nenhum evento econômico importante para hoje.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

    