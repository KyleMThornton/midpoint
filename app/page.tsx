"use client"

import { useEffect, useState } from "react"
import { findMidpoint, getCityFromZip } from "./zipCodeConnection";
import toast, { Toaster } from 'react-hot-toast';

export default function Home() {
  const [firstLocation, setFirstLocation] = useState<number>(0);
  const [secondLocation, setSecondLocation] = useState<number>(0);
  const [firstInputValue, setFirstInputValue] = useState('');
  const [secondInputValue, setSecondInputValue] = useState('');
  const [firstCity, setFirstCity] = useState('');
  const [secondCity, setSecondCity] = useState('');
  const [midPoint, setMidPoint] = useState({});

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

  useEffect(() => {
    Object.keys(midPoint).length !== 0 ? console.log(midPoint) : null
  }, [midPoint])

  return (
    <main className="flex min-h-screen flex-col items-center p-12">
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
      
      <Toaster />
    </main>
  )
}
