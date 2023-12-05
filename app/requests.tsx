import toast from "react-hot-toast";

const invalidZipCodeToast = () => toast(`✋ Invalid Zip Code`, {
    duration: 1500,
    position: 'top-center'
});

const invalidCityStateToast = () => toast(`✋ Invalid City or State`, {
    duration: 1500,
    position: 'top-center'
});

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
    try {
    const response:any = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
    const json = await response.json()
    const city = json.places[0]["place name"]
    const state = json.places[0]["state abbreviation"]
    return `${city}, ${state}`
    } catch(error) {
        invalidZipCodeToast();
    }
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

export { findMidpoint, getCityFromZip, invalidZipCodeToast, invalidCityStateToast };