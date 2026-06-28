import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const headers = { Authorization: `Bearer ${process.env.YELP_API_KEY}` };

  try {
    const [detailRes, reviewsRes] = await Promise.all([
      fetch(`https://api.yelp.com/v3/businesses/${encodeURIComponent(id)}`, { headers }),
      fetch(`https://api.yelp.com/v3/businesses/${encodeURIComponent(id)}/reviews?limit=3`, { headers }),
    ]);
    const [detail, reviewsData] = await Promise.all([detailRes.json(), reviewsRes.json()]);
    return NextResponse.json({ ...detail, reviews: reviewsData.reviews ?? [] });
  } catch {
    return NextResponse.json({ error: 'Yelp API error' }, { status: 500 });
  }
}
