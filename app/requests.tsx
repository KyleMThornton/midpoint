const OPENCAGE_APIKEY = process.env.OPENCAGE_API_KEY;

const getCoordsFromZip = async(zipCode:number) => {
    const response:any = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
    const json = await response.json()
    const coords = {
        longitude: json.places[0].longitude,
        latitude: json.places[0].latitude
    }
    return coords
}

const getCityFromZip = async(zipCode:number) => {
    const response:any = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
    const json = await response.json()
    const city = json.places[0]["place name"]
    const state = json.places[0]["state abbreviation"]
    return `${city}, ${state}`
}

const findMidpoint = async(firstLocation:number, secondLocation:number) => {
    let loc1 = await getCoordsFromZip(firstLocation);
    let loc2 = await getCoordsFromZip(secondLocation);
    let midLon = (parseFloat(loc1.longitude) + parseFloat(loc2.longitude)) / 2;
    let midLat = (parseFloat(loc1.latitude) + parseFloat(loc2.latitude)) / 2;
    midLon = parseFloat(midLon.toFixed(4));
    midLat = parseFloat(midLat.toFixed(4));
    const midPointLoc = {
        longitude: midLon,
        latitude: midLat
    }

    return midPointLoc;
}

const getZipFromCoords = async(coords:any) => {
    const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${coords.latitude}+${coords.longitude}&key=${OPENCAGE_APIKEY}`);
    const json = response.json()
    return json
}

export { findMidpoint, getCityFromZip, getZipFromCoords };