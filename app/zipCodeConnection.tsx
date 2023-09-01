const getCoordsFromZip = async(zipCode:number) => {
    const response:any = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
    const json = await response.json()
    const coords = {
        longitude: json.places[0].longitude,
        latitude: json.places[0].latitude
    }
    console.log(coords)
}

const findMidpoint = async(firstLocation:number, secondLocation:number) => {
    const loc1 = getCoordsFromZip(firstLocation);
    const loc2 = getCoordsFromZip(secondLocation);
}

export default getCoordsFromZip