"use client"

import { useEffect, useState } from "react"
import { findMidpoint, getCityFromZip } from "./requests";
import toast, { Toaster } from 'react-hot-toast';
import Footer from "./components/Footer";

export default function Home() {
  const [firstLocation, setFirstLocation] = useState<number>(0);
  const [secondLocation, setSecondLocation] = useState<number>(0);
  const [firstInputValue, setFirstInputValue] = useState('');
  const [secondInputValue, setSecondInputValue] = useState('');
  const [firstCity, setFirstCity] = useState('');
  const [secondCity, setSecondCity] = useState('');
  const [midPoint, setMidPoint] = useState<any>('');
  const [midPointCity, setMidPointCity] = useState<any>('');
  const [yelpResponse, setYelpResponse] = useState<any>();

  const zipCodePattern = /^\d{5}$/

  const findMidpointButtonisDisabled = !firstCity || !secondCity;
  const clearCitiesButtonisDisabled = !firstCity && !secondCity && !yelpResponse;

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

  useEffect(() => {
    if(midPoint) {
      fetchNearestCity()
    }
  }, [midPoint])

  useEffect(() => {
    if(midPointCity) {
      fetchYelpData()
    }
  }, [midPointCity])

  const handleClearCities = () => {
    setFirstLocation(0)
    setFirstCity('')
    setFirstInputValue('')
    setSecondLocation(0)
    setSecondCity('')
    setSecondInputValue('')
    setYelpResponse(null)
    setMidPointCity('')
  }

  const fetchYelpData = async() => {
    const response = await fetch(`/api/yelp?city=${midPointCity}`)
    const data:any = await response.json();
    setYelpResponse(data.businesses)
  }

  const fetchNearestCity = async() => {
    const response = await fetch(`/api/rapidapi?lat=${midPoint.latitude}&lon=${midPoint.longitude}`)
    const data:any = await response.json();
    setMidPointCity(data.data[0].city)
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
      {/* <header className="flex justify-between w-full">
        <p>logo</p>
        <div>
          <label className="swap swap-rotate">
            <input type="checkbox" />
            <svg className="swap-on fill-current w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/></svg>
            <svg className="swap-off fill-current w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/></svg>
          </label>
          </div>
      </header> */}
      <div>
        <h1 className="text-3xl pt-3">midpoint</h1>
      </div>
      <div className="flex flex-col md:flex-row pt-10">
        <div id="firstLocation" className="p-5">
          <div className="flex flex-row">
            <input type="text" maxLength={5} placeholder="First location zip code" className="input input-bordered w-full max-w-xs" onChange={handleFirstInputChange} value={firstInputValue} />
            <button className="btn ml-1" onClick={handleFirstClick}>Enter</button>
          </div>
          {firstCity !== '' ? 
          <p className="flex justify-center mt-2">{firstCity}</p> : 
          null}
        </div>
        <div id="secondLocation" className="p-5">
          <div className="flex flex-row">
            <input type="text" maxLength={5} placeholder="Second location zip code" className="input input-bordered w-full max-w-xs" onChange={handleSecondInputChange} value={secondInputValue} />
            <button className="btn ml-1" onClick={handleSecondClick}>Enter</button>
          </div>
          {secondCity !== '' ? 
          <p className="flex justify-center mt-2">{secondCity}</p> : 
          null}
        </div>
      </div>
      <button className="btn mt-5" onClick={handleClearCities} disabled={clearCitiesButtonisDisabled}>Clear All</button>
      <button className="btn btn-lg m-5" onClick={handleFindMidpointClick} disabled={findMidpointButtonisDisabled}>Find Midpoint</button>
      {midPointCity !== '' ?
      <div className="flex flex-col text-center"> 
        <h2 className="flex justify-center">Your mid point is:</h2>
        <span style={{ fontWeight: 'bold' }}>{midPointCity}</span>
        <h2> Heres some fun things to do there:</h2>
      </div> : 
      null}
      {yelpResponse ? <BusinessList /> : null}
      <Toaster />
    </main>
  )
}
