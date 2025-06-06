
import { NextResponse } from 'next/server';

interface FinnhubEconomicEvent {
  actual?: number | null;
  country: string; // e.g., "US", "DE", "BR"
  estimate?: number | null;
  event: string; // Description of the event
  impact?: string | null; // Finnhub API docs mention impact as string, but it can be number too.
                           // Example values: "Low", "Medium", "High", or sometimes numbers like 0, 1, 2.
  prev?: number | null;
  time: string; // e.g., "2024-07-26 12:30:00" (UTC time typically)
  unit: string;
  symbol?: string; // Often related to the currency or market
}

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

  // Server-side log to check if API key is loaded
  if (process.env.NODE_ENV === 'development') { // Log only in development
    console.log(
      '[API Route /api/economic-calendar] Attempting to use Finnhub API Key:',
      apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'API Key is UNDEFINED in .env'
    );
  }

  if (!apiKey) {
    console.error("[API Route /api/economic-calendar] Finnhub API key is missing from environment variables. Ensure NEXT_PUBLIC_FINNHUB_API_KEY is set in .env (or .env.local) and the server was restarted.");
    return NextResponse.json({ error: "Server configuration error: API key for Finnhub is missing. Please contact support or check server logs." }, { status: 500 });
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
      const errorBodyText = await response.text(); // Read body as text first
      let finnhubErrorMessage = `Failed to fetch economic calendar: ${response.statusText} (Status: ${response.status})`;
      let errorDetails = errorBodyText;

      try {
        const parsedError = JSON.parse(errorBodyText); // Try to parse as JSON
        if (parsedError && parsedError.error) {
          finnhubErrorMessage = parsedError.error;
        }
      } catch (e) {
        // If parsing fails, errorBodyText is likely not JSON, use it directly or part of it
        if (errorBodyText.length > 150) { // Avoid overly long plain text errors
            errorDetails = errorBodyText.substring(0,150) + "...";
        }
      }
      
      console.error(`[API Route /api/economic-calendar] Finnhub API error: ${response.status} ${response.statusText}. Response body: ${errorBodyText}`);
      return NextResponse.json({ error: finnhubErrorMessage, details: errorDetails, finnhubStatus: response.status }, { status: response.status });
    }
    
    const data = await response.json();
    
    if (!data || !data.economicCalendar) {
         console.warn("[API Route /api/economic-calendar] Finnhub API returned no economicCalendar data or unexpected format:", data);
         return NextResponse.json([]); 
    }

    const sortedEvents = (data.economicCalendar as FinnhubEconomicEvent[]).sort((a, b) => {
        return new Date(a.time).getTime() - new Date(b.time).getTime();
    });

    return NextResponse.json(sortedEvents);

  } catch (error: any) {
    console.error("[API Route /api/economic-calendar] Error fetching or processing economic calendar data:", error);
    return NextResponse.json({ error: "Internal server error fetching economic calendar.", details: error.message }, { status: 500 });
  }
}
