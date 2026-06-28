import { NextRequest, NextResponse } from 'next/server';

interface NominatimResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address: Record<string, string>;
}

function shortName(result: NominatimResult): string {
  const a = result.address;
  const main =
    a.suburb ||
    a.city_district ||
    a.neighbourhood ||
    a.city ||
    a.town ||
    a.village ||
    a.county ||
    result.display_name.split(',')[0];
  const region = a.state || a.country || '';
  return region ? `${main}, ${region}` : main;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5&countrycodes=us`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'midpoint-app/2.0 (kylemthornton@gmail.com)',
        'Accept-Language': 'en',
      },
      next: { revalidate: 86400 },
    });
    const data: NominatimResult[] = await res.json();
    const results = data.map((r) => ({
      place_id: r.place_id,
      display_name: r.display_name,
      short_name: shortName(r),
      lat: r.lat,
      lon: r.lon,
    }));
    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 });
  }
}
