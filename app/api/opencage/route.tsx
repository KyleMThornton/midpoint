import { NextRequest, NextResponse } from 'next/server'

export async function GET(req:NextRequest, res:NextResponse) {
    const lat = req.nextUrl.searchParams.get('lat');
    const lon = req.nextUrl.searchParams.get('lon');
    const OPENCAGE_APIKEY = process.env.OPENCAGE_API_KEY;

    try {
        const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${OPENCAGE_APIKEY}`)
        const data = await response.json();
        return NextResponse.json(data);
    } catch(error) {
        return NextResponse.json({status: 500});
    }
}