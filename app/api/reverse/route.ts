import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat');
  const lon = req.nextUrl.searchParams.get('lon');
  if (!lat || !lon) return NextResponse.json({ error: 'Missing coords' }, { status: 400 });

  const url =
    `https://nominatim.openstreetmap.org/reverse` +
    `?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'midpoint-app/2.0 (kylemthornton@gmail.com)',
        'Accept-Language': 'en',
      },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Reverse geocoding failed' }, { status: 500 });
  }
}
