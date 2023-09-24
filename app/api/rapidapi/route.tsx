import { NextRequest, NextResponse } from 'next/server'

export async function GET(req:NextRequest, res:NextResponse) {
    const RAPID_API_KEY = process.env.RAPID_API_KEY;
    const lat = req.nextUrl.searchParams.get('lat');
    const lon = req.nextUrl.searchParams.get('lon');

    try {
        const response = await fetch(`https://wft-geo-db.p.rapidapi.com/v1/geo/cities?location=${lat}${lon}&minPopulation=5000&limit=1`, {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': `${RAPID_API_KEY}`,
            'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
          }
        })
        const data = await response.json();
        return NextResponse.json(data);
    } catch(error) {
        return NextResponse.json({status: 500});
    }
}