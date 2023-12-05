"use client"

import { useState } from "react";
import { invalidCityStateToast } from "../requests";

export default function FindZip() {
    const [text, setText] = useState('');
    const [zip, setZip] = useState('');

    const handleTextUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
        setText(event.target.value);
    }
    const handleZipFind = async (location:string) => {
        const [city, state] = location.split(', ');
        const res = await fetch(`https://api.zippopotam.us/us/${state}/${city}`);
        if(res.status !== 200) {
            invalidCityStateToast();
            return;
        }
        const data = await res.json();
        setZip(data.places[0]['post code']);
    }
    const handleClearZip = () => {
        setZip('');
        setText('');
    }

    return (
      <div className="collapse bg-base-200 dark:bg-zinc-750 w-80">
        <input type="checkbox" />
        <div className="collapse-title text-md">
          Don't know your zip? Click me!
        </div>
        <div className="collapse-content">
        <div className="flex flex-row">
                <input
                  type="text"
                  placeholder="City, State"
                  className="input input-bordered w-full max-w-xs"
                  onChange={handleTextUpdate}
                  value={text}
                />
                {zip === '' ? <button className="btn ml-1" onClick={() => handleZipFind(text)}>Enter</button> : <button className="btn ml-1" onClick={() => handleClearZip()}>Clear</button>}
              </div>
              {zip !== '' ? <p className="flex justify-center mt-2">{zip}</p> : null}
        </div>
      </div>
    );
}