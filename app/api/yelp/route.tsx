import { NextRequest, NextResponse } from 'next/server'

export async function GET(req:NextRequest, res:NextResponse) {
    const city = req.nextUrl.searchParams.get('city');
    const YELP_API_KEY = process.env.YELP_API_KEY;

    try {
        const response = await fetch(`https://api.yelp.com/v3/businesses/search?location=${city}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${YELP_API_KEY}`
        }
        })
        const data = await response.json();
        return NextResponse.json(data);
    } catch(error) {
        return NextResponse.json({status: 500});
    }
}