
import { NextResponse } from 'next/server';

interface FinnhubEconomicEvent {
  actual?: number | null;
  country: string; // e.g., "US", "DE", "BR"
  estimate?: number | null;
  event: string; // Description of the event
  impact?: number | null; // Usually 0 (Low), 1 (Medium), 2 (High), 3 (Very High) or similar
  prev?: number | null;
  time: string; // e.g., "2024-07-26 12:30:00"
  unit: string;
  symbol?: string; // Often related to the currency or market
}

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

  if (!apiKey) {
    console.error("Finnhub API key is missing.");
    return NextResponse.json({ error: "API key is missing. Configure NEXT_PUBLIC_FINNHUB_API_KEY in .env.local" }, { status: 500 });
  }

  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  const fromDate = today.toISOString().split('T')[0];
  const toDate = nextWeek.toISOString().split('T')[0];

  const url = `https://finnhub.io/api/v1/calendar/economic?from=${fromDate}&to=${toDate}&token=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Finnhub API error: ${response.status} ${response.statusText}`, errorBody);
      return NextResponse.json({ error: `Failed to fetch economic calendar: ${response.statusText}`, details: errorBody }, { status: response.status });
    }
    const data = await response.json();
    
    if (!data || !data.economicCalendar) {
         console.warn("Finnhub API returned no economicCalendar data or unexpected format:", data);
         return NextResponse.json([]); // Return empty array if no data
    }

    // Sort events by time
    const sortedEvents = (data.economicCalendar as FinnhubEconomicEvent[]).sort((a, b) => {
        return new Date(a.time).getTime() - new Date(b.time).getTime();
    });

    return NextResponse.json(sortedEvents);

  } catch (error: any) {
    console.error("Error fetching or processing economic calendar data:", error);
    return NextResponse.json({ error: "Internal server error fetching economic calendar.", details: error.message }, { status: 500 });
  }
}
