"use client"

import { Suspense, useEffect, useState } from "react"
import { findMidpoint, getCityFromZip, invalidZipCodeToast } from "./requests";
import { Toaster } from 'react-hot-toast';

export default function Home() {
  const [firstLocation, setFirstLocation] = useState<number>(0);
  const [secondLocation, setSecondLocation] = useState<number>(0);
  const [firstInputValue, setFirstInputValue] = useState('');
  const [secondInputValue, setSecondInputValue] = useState('');
  const [firstCity, setFirstCity] = useState('');
  const [secondCity, setSecondCity] = useState('');
  const [midPoint, setMidPoint] = useState<any>('');
  const [midPointCity, setMidPointCity] = useState<any>('');
  const [midPointState, setMidPointState] = useState<any>('');
  const [yelpResponse, setYelpResponse] = useState<any>();
  const [isLoading, setIsLoading] = useState(false);

  const zipCodePattern = /^\d{5}$/

  const findMidpointButtonisDisabled = !firstCity || !secondCity;
  const clearCitiesButtonisDisabled = !firstCity && !secondCity && !yelpResponse;

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
        setFirstCity(await getCityFromZip(firstInputValNum) || '');
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
      setSecondCity(await getCityFromZip(secondInputValNum) || '');
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
    setMidPointState('')
  }

  const fetchYelpData = async() => {
    const response = await fetch(`/api/yelp?city=${midPointCity}&state=${midPointState}`)
    const data:any = await response.json();
    setYelpResponse(data.businesses)
    setIsLoading(false)
  }

  const fetchNearestCity = async() => {
    const response = await fetch(`/api/rapidapi?lat=${midPoint.latitude}&lon=${midPoint.longitude}`)
    const data:any = await response.json();
    setMidPointCity(data.data[0].city)
    setMidPointState(data.data[0].regionCode)
    setIsLoading(true)
  }

  const BusinessList = () => {
    const first10Yelp = yelpResponse.slice(0, 10)
    const yelpBusinesses = first10Yelp.map((biz:any) => 
      <div className="card w-80 sm:w-96 h-96 bg-white shadow-xl mt-5 sm:mx-5 group" key={biz.index}>
        <figure><a href={biz.url} target="_blank"><img src={biz.image_url} className="group-hover:scale-105 group-hover:drop-shadow-sm transition-all duration-200 ease-in-out" /></a></figure>
        <div className="card-body">
          <a href={biz.url} target="_blank"><h2 className="card-title group-hover:underline">{biz.name}</h2></a>
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
        <div className="flex flex-col text-center">
          <h1 className="text-3xl py-3">midpoint</h1>
          <h3>Discover the perfect meeting point between two locations!</h3>
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
          <span style={{ fontWeight: 'bold' }}>{midPointCity}, {midPointState}</span>
          <h2> Heres some fun things to do there:</h2>
        </div> : 
        null}
        {isLoading ? <span className="loading loading-dots loading-lg"></span> : null}
        {yelpResponse ? <BusinessList /> : null}
        <Toaster />
      </main>
  )
}
