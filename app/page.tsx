"use client"

import { useState } from "react"

export default function Home() {
  const [firstLocation, setFirstLocation] = useState<number>();
  const [secondLocation, setSecondLocation] = useState<number>();
  const [firstInputValue, setFirstInputValue] = useState('');
  const [secondInputValue, setSecondInputValue] = useState('');

  const handleFirstInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFirstInputValue(event.target.value);
  }

  const handleSecondInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSecondInputValue(event.target.value);
  }

  const handleFirstClick = () => {
    const firstInputValNum = Number(firstInputValue);
    setFirstLocation(firstInputValNum);
    setFirstInputValue('');
  }

  const handleSecondClick = () => {
    const secondInputValNum = Number(secondInputValue);
    setSecondLocation(secondInputValNum);
    setSecondInputValue('');
  }

  const handleFindMidpointClick = () => {
    console.log(firstLocation, secondLocation)
  }

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
          <input type="text" maxLength={6} placeholder="First location zip code" className="input input-bordered w-full max-w-xs m-3" onChange={handleFirstInputChange} value={firstInputValue} />
          <button className="btn m-3" onClick={handleFirstClick}>Enter</button>
        </div>
      </div>
      <div id="secondLocation">
        <div className="flex flex-row mt-5">
          <input type="text" maxLength={6} placeholder="Second location zip code" className="input input-bordered w-full max-w-xs m-3" onChange={handleSecondInputChange} value={secondInputValue} />
          <button className="btn m-3" onClick={handleSecondClick}>Enter</button>
        </div>
      </div>
      <button className="btn btn-lg m-10" onClick={handleFindMidpointClick}>Find Midpoint</button>
    </main>
  )
}
