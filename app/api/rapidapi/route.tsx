import { NextRequest, NextResponse } from 'next/server'

export async function GET(req:NextRequest, res:NextResponse) {
    const RAPID_API_KEY = process.env.YELP_API_KEY;
    const lat = req.nextUrl.searchParams.get('lat');
    const lon = req.nextUrl.searchParams.get('lon');

    try {
        const response = await fetch(`https://wft-geo-db.p.rapidapi.com/v1/geo/cities?location=${lat}${lon}&minPopulation=5000&limit=1`, {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': '8e96c91d02mshd89e9e3724edd2dp16cea9jsn9eb5c9f74fa0',
            'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
          }
        })
        const data = await response.json();
        return NextResponse.json(data);
    } catch(error) {
        return NextResponse.json({status: 500});
    }
}