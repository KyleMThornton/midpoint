import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat');
  const lon = req.nextUrl.searchParams.get('lon');
  if (!lat || !lon) return NextResponse.json({ error: 'Missing coords' }, { status: 400 });

  const YELP_API_KEY = process.env.YELP_API_KEY;
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    categories: 'restaurants',
    limit: '20',
    radius: '10000',
    sort_by: 'best_match',
  });

  try {
    const res = await fetch(
      `https://api.yelp.com/v3/businesses/search?${params}`,
      { headers: { Authorization: `Bearer ${YELP_API_KEY}` } }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Yelp API error' }, { status: 500 });
  }
}
