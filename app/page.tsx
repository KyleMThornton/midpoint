"use client"

import { JSXElementConstructor, PromiseLikeOfReactNode, ReactElement, ReactNode, ReactPortal, useState } from "react"
import { findMidpoint, getCityFromZip, getZipFromCoords } from "./requests";
import toast, { Toaster } from 'react-hot-toast';

export default function Home() {
  const [firstLocation, setFirstLocation] = useState<number>(0);
  const [secondLocation, setSecondLocation] = useState<number>(0);
  const [firstInputValue, setFirstInputValue] = useState('');
  const [secondInputValue, setSecondInputValue] = useState('');
  const [firstCity, setFirstCity] = useState('');
  const [secondCity, setSecondCity] = useState('');
  const [midPoint, setMidPoint] = useState({});
  const [yelpResponse, setYelpResponse] = useState<any>();

  const zipCodePattern = /^\d{5}$/

  const findMidpointButtonisDisabled = !firstCity || !secondCity;
  const clearCitiesButtonisDisabled = !firstCity && !secondCity;

  const invalidZipCodeToast = () => toast(`✋ Invalid Zip Code`, {
    duration: 1500,
    position: 'top-center'
  });

  const handleFirstInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFirstInputValue(event.target.value);
  }

  const handleSecondInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSecondInputValue(event.target.value);
  }

  const handleFirstClick = async () => {
    if(zipCodePattern.test(firstInputValue)) {
      try {
        const firstInputValNum = Number(firstInputValue);
        setFirstCity(await getCityFromZip(firstInputValNum));
        setFirstLocation(firstInputValNum);
      } catch(error) {
        invalidZipCodeToast();
      }
    } else {
      invalidZipCodeToast();
    }
  }

  const handleSecondClick = async () => {
    if(zipCodePattern.test(secondInputValue)) {
      const secondInputValNum = Number(secondInputValue);
      setSecondLocation(secondInputValNum);
      setSecondCity(await getCityFromZip(secondInputValNum));
    } else {
      invalidZipCodeToast();
    }
  }

  const handleFindMidpointClick = async () => {
    setMidPoint(await findMidpoint(firstLocation, secondLocation))
  }

  const handleClearCities = () => {
    setFirstLocation(0)
    setFirstCity('')
    setFirstInputValue('')
    setSecondLocation(0)
    setSecondCity('')
    setSecondInputValue('')
  }

  const fetchYelpData = async() => {
    const response = await fetch(`/api/yelp?city=Anaheim`)
    const data:any = await response.json();
    setYelpResponse(data.businesses)
  }

  const BusinessList = () => {
    const first10Yelp = yelpResponse.slice(0, 10)
    const yelpBusinesses = first10Yelp.map((biz:any) => 
      <div className="card w-80 sm:w-96 h-96 bg-white shadow-xl mt-5 sm:mx-5" key={biz.index}>
        <figure><img src={biz.image_url} /></figure>
        <div className="card-body">
          <a href={biz.url} target="_blank"><h2 className="card-title">{biz.name}</h2></a>
          <div>
            <p>{biz.location.display_address[0]}</p>
            <p>{biz.location.display_address[1]}</p>
            <p>{biz.location.display_address[2]}</p>
          </div>
          <div className="card-actions justify-end pt-5">
            {biz.categories.map((category:any) => (
              <div className="badge badge-outline" key={category.alias}>{category.title}</div>
            ))}
            {biz.price ? <div className="badge badge-outline">{biz.price}</div> : null}
          </div>
        </div>
      </div>  
    )

    return (
      <div className="">
        <div className="flex flex-col max-w-7xl sm:flex-row sm:flex-wrap sm:justify-center">
          {yelpBusinesses}
        </div>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-white text-black">
      <header className="flex justify-between w-full">
        <p>logo</p>
        <p>about</p>
      </header>
      <div>
        <h1 className="text-3xl mt-3">midpoint</h1>
      </div>
      <div id="firstLocation">
        <div className="flex flex-row mt-10">
          <input type="text" maxLength={5} placeholder="First location zip code" className="input input-bordered w-full max-w-xs m-3" onChange={handleFirstInputChange} value={firstInputValue} />
          <button className="btn m-3" onClick={handleFirstClick}>Enter</button>
        </div>
        {firstCity !== '' ? 
        <p className="flex justify-center">{firstCity}</p> : 
        null}
      </div>
      <div id="secondLocation">
        <div className="flex flex-row mt-5">
          <input type="text" maxLength={5} placeholder="Second location zip code" className="input input-bordered w-full max-w-xs m-3" onChange={handleSecondInputChange} value={secondInputValue} />
          <button className="btn m-3" onClick={handleSecondClick}>Enter</button>
        </div>
      </div>
      {secondCity !== '' ? 
      <p className="flex justify-center">{secondCity}</p> : 
      null}
      <button className="btn mt-7" onClick={handleClearCities} disabled={clearCitiesButtonisDisabled}>Clear Cities</button>
      <button className="btn btn-lg m-10" onClick={handleFindMidpointClick} disabled={findMidpointButtonisDisabled}>Find Midpoint</button>
      <button className="btn mt-7" onClick={fetchYelpData}>Yelp test</button>
      {yelpResponse ? <BusinessList /> : null}
      <Toaster />
    </main>
  )
}
