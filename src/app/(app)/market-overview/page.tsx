
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, TrendingDown, BarChartBig, Users, CalendarDays, Bell, Loader2, AlertTriangle } from 'lucide-react'; 
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface MarketAssetProps {
  name: string;
  trend?: 'Alta' | 'Baixa' | 'Lateral' | 'N/A';
  volume?: string | number;
  icon?: React.ReactNode;
  dataAiHint?: string;
  price?: number;
  changePercent?: number;
}

const MarketAssetCard: React.FC<MarketAssetProps> = ({ name, trend, volume, icon, dataAiHint, price, changePercent }) => {
  const displayTrend = trend || 'N/A';
  let trendColor = 'text-muted-foreground';
  let trendIcon = icon || <TrendingUp className="h-4 w-4 text-muted-foreground" />;

  if (changePercent !== undefined) {
    if (changePercent > 0) {
      trendColor = 'text-green-500';
      trendIcon = <TrendingUp className="h-4 w-4 text-green-500"/>;
    } else if (changePercent < 0) {
      trendColor = 'text-red-500';
      trendIcon = <TrendingDown className="h-4 w-4 text-red-500"/>;
    }
  }


  return (
  <Card className="shadow-sm hover:shadow-md transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium font-headline">{name}</CardTitle>
      {trendIcon}
    </CardHeader>
    <CardContent>
      {price !== undefined && (
        <div className={`text-xl font-bold ${trendColor}`}>
          R$ {price.toFixed(2)}
          {changePercent !== undefined && (
            <span className={`ml-2 text-xs font-normal ${trendColor}`}>
              ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(2)}%)
            </span>
          )}
        </div>
      )}
      {trend && price === undefined && <div className="text-2xl font-bold">{displayTrend}</div>}
      {volume && <p className="text-xs text-muted-foreground mt-1">Volume: {typeof volume === 'number' ? volume.toLocaleString('pt-BR') : volume}</p>}
      {name === "Ibovespa (Ações)" && !price && ( // Show placeholder only if no live data for Ibov card
         <Image 
            src="https://placehold.co/300x150.png" 
            alt={`${name} chart`}
            width={300}
            height={150}
            className="mt-2 rounded-md w-full h-auto max-w-[300px] object-cover"
            data-ai-hint={dataAiHint || "stock chart"}
          />
      )}
    </CardContent>
  </Card>
  );
};


interface EconomicEventClientProps {
  time: string; // Formatted time string
  event: string;
  impact: 'Muito Alto' | 'Alto' | 'Médio' | 'Baixo' | 'N/A';
  country: string; // e.g., "EUA", "Brasil", "Eurozona"
  actual?: string;
  forecast?: string;
  previous?: string;
}

const EconomicEventItem: React.FC<EconomicEventClientProps> = ({ time, event, impact, country, actual, forecast, previous }) => {
  let impactColorClass = 'bg-muted/20 text-muted-foreground';
  let impactIconColor = 'text-muted-foreground';

  switch (impact) {
    case 'Muito Alto':
    case 'Alto':
      impactColorClass = 'bg-destructive/20 text-destructive';
      impactIconColor = 'text-destructive';
      break;
    case 'Médio':
      impactColorClass = 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400';
      impactIconColor = 'text-yellow-500 dark:text-yellow-400';
      break;
    case 'Baixo':
      impactColorClass = 'bg-green-500/20 text-green-600 dark:text-green-400';
      impactIconColor = 'text-green-500 dark:text-green-400';
      break;
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 hover:bg-muted/50 rounded-md transition-colors gap-2 sm:gap-4 border-b last:border-b-0">
      <div className="flex items-start gap-3 flex-grow min-w-0">
        <Bell className={`h-5 w-5 mt-1 sm:mt-0.5 shrink-0 ${impactIconColor}`} />
        <div className="flex-grow min-w-0">
          <p className="font-medium text-sm truncate" title={event}>{event} <span className="text-xs text-muted-foreground">({country})</span></p>
          <p className="text-xs text-muted-foreground">{time}</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pl-8 sm:pl-0">
        <div className="text-xs text-muted-foreground sm:text-right min-w-[100px]">
            {actual && <p>Atual: <span className="font-semibold text-foreground">{actual}</span></p>}
            {forecast && <p>Proj.: <span className="font-semibold text-foreground">{forecast}</span></p>}
            {previous && <p>Prev.: <span className="font-semibold text-foreground">{previous}</span></p>}
        </div>
        <div title={`Impacto: ${impact}`} className={`text-xs font-semibold px-2 py-1 rounded-full text-center ${impactColorClass}`}>
          {impact}
        </div>
      </div>
    </div>
  );
};

interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change_percent: number;
  volume: number;
}

interface FinnhubEventAPI {
  actual?: number | null;
  country: string;
  estimate?: number | null;
  event: string;
  impact?: number | null; // 0 (Low), 1 (Medium), 2 (High), 3 (Very High)
  prev?: number | null;
  time: string; // "2024-07-26 12:30:00"
  unit: string;
  symbol?: string; // Often related to the currency or market
}


export default function MarketOverviewPage() {
  const [economicEvents, setEconomicEvents] = useState<EconomicEventClientProps[]>([]);
  const [stockData, setStockData] = useState<MarketAssetProps[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(true);
  const [errorEvents, setErrorEvents] = useState<string | null>(null);
  const [errorQuotes, setErrorQuotes] = useState<string | null>(null);


  useEffect(() => {
    async function fetchEconomicCalendar() {
      setIsLoadingEvents(true);
      setErrorEvents(null);
      try {
        const response = await fetch('/api/economic-calendar');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data: FinnhubEventAPI[] = await response.json();
        
        const impactMap: { [key: number]: EconomicEventClientProps['impact'] } = {
          0: 'Baixo', 1: 'Médio', 2: 'Alto', 3: 'Muito Alto'
        };

        const countryNameMap: { [key: string]: string } = {
          "US": "EUA", "DE": "Alemanha", "BR": "Brasil", "CN": "China", "JP": "Japão", "GB": "Reino Unido",
          "EU": "Zona do Euro", "CA": "Canadá", "AU": "Austrália", "NZ": "Nova Zelândia", "CH": "Suíça",
        };
        
        const clientEvents = data
          .filter(event => event.country && ["US", "BR", "EU", "CN", "DE", "GB"].includes(event.country.toUpperCase())) // Filter for major economies
          .map(event => ({
            time: new Date(event.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }),
            event: event.event,
            impact: event.impact !== null && event.impact !== undefined ? (impactMap[event.impact] || 'N/A') : 'N/A',
            country: countryNameMap[event.country.toUpperCase()] || event.country,
            actual: event.actual !== null && event.actual !== undefined ? `${event.actual}${event.unit || ''}` : 'N/A',
            forecast: event.estimate !== null && event.estimate !== undefined ? `${event.estimate}${event.unit || ''}` : 'N/A',
            previous: event.prev !== null && event.prev !== undefined ? `${event.prev}${event.unit || ''}` : 'N/A',
          }));
        setEconomicEvents(clientEvents);
      } catch (e: any) {
        console.error("Failed to fetch economic events:", e);
        setErrorEvents(e.message || "Erro ao carregar calendário econômico.");
      }
      setIsLoadingEvents(false);
    }

    async function fetchStockQuotes() {
      setIsLoadingQuotes(true);
      setErrorQuotes(null);
      try {
        const response = await fetch('/api/stock-quotes');
         if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data: StockQuote[] = await response.json();
        const mappedData = data.map(stock => ({
          name: `${stock.name} (${stock.symbol})`,
          price: stock.price,
          changePercent: stock.change_percent,
          volume: stock.volume,
          dataAiHint: `${stock.name.toLowerCase()} stock chart`
        }));
        setStockData(mappedData);
      } catch (e: any)
       {
        console.error("Failed to fetch stock quotes:", e);
        setErrorQuotes(e.message || "Erro ao carregar cotações.");
        // Keep placeholder for Ibovespa if quotes fail
        setStockData([{ name: "Ibovespa (Ações)", trend: "Lateral", dataAiHint: "stocks chart"}]);
      }
      setIsLoadingQuotes(false);
    }

    fetchEconomicCalendar();
    fetchStockQuotes();
  }, []);


  const assetsToShowInitially: MarketAssetProps[] = [
    { name: "Índice Futuro (WIN)", trend: "N/A", volume: "Carregando...", icon: <Loader2 className="h-4 w-4 text-muted-foreground animate-spin"/>, dataAiHint:"index chart" },
    { name: "Dólar Futuro (WDO)", trend: "N/A", volume: "Carregando...", icon: <Loader2 className="h-4 w-4 text-muted-foreground animate-spin"/>, dataAiHint:"currency chart" },
    { name: "Ibovespa (Ações)", trend: "Lateral", dataAiHint: "stocks chart"} // Placeholder for Ibovespa
  ];
  
  const displayStockData = isLoadingQuotes 
    ? assetsToShowInitially 
    : stockData.length > 0 
      ? stockData 
      : [{ name: "Ibovespa (Ações)", trend: "Lateral", dataAiHint: "stocks chart"}];


  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 font-headline">Painel de Mercado</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 font-headline">Tendência de Ativos</h2>
        {isLoadingQuotes && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assetsToShowInitially.map(asset => <MarketAssetCard key={asset.name} {...asset} />)}
          </div>
        )}
        {!isLoadingQuotes && errorQuotes && (
           <Card className="border-destructive bg-destructive/10">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2"/> Erro ao Carregar Cotações</CardTitle>
              <CardDescription className="text-destructive/80">{errorQuotes}</CardDescription>
            </CardHeader>
          </Card>
        )}
        {!isLoadingQuotes && !errorQuotes && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayStockData.map(asset => <MarketAssetCard key={asset.name} {...asset} />)}
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 font-headline">Visão Geral</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium font-headline">Volume Agregado (B3)</CardTitle>
              <BarChartBig className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ -- Bilhões</div> {/* Placeholder */}
              <p className="text-xs text-muted-foreground">Atualização pendente</p>
               <Image 
                  src="https://placehold.co/600x200.png"
                  alt="Volume chart"
                  width={600}
                  height={200}
                  className="mt-2 rounded-md w-full h-auto max-w-[600px] object-cover"
                  data-ai-hint="volume graph"
                />
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium font-headline">Posição dos Players</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                <li><span className="font-semibold">Institucionais:</span> --</li>
                <li><span className="font-semibold">Estrangeiros:</span> --</li>
                <li><span className="font-semibold">Pessoa Física (Retail):</span> --</li>
              </ul>
               <Image 
                  src="https://placehold.co/600x150.png"
                  alt="Player position chart"
                  width={600}
                  height={150}
                  className="mt-2 rounded-md w-full h-auto max-w-[600px] object-cover"
                  data-ai-hint="pie chart"
                />
            </CardContent>
          </Card>
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4 font-headline flex items-center">
          <CalendarDays className="mr-3 h-6 w-6" /> Calendário Econômico
        </h2>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-4 space-y-1">
            {isLoadingEvents && (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="ml-3 text-sm">Carregando eventos...</p>
                </div>
            )}
            {!isLoadingEvents && errorEvents && (
              <Card className="border-destructive bg-destructive/10 m-4">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2"/> Erro ao Carregar Calendário</CardTitle>
                  <CardDescription className="text-destructive/80">{errorEvents}</CardDescription>
                </CardHeader>
              </Card>
            )}
            {!isLoadingEvents && !errorEvents && economicEvents.length > 0 && (
              economicEvents.map((event, index) => (
                <EconomicEventItem key={`${event.event}-${event.time}-${index}`} {...event} />
              ))
            )}
            {!isLoadingEvents && !errorEvents && economicEvents.length === 0 && (
              <p className="text-muted-foreground text-center py-10">Nenhum evento econômico importante para os próximos dias ou dados indisponíveis.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

    
