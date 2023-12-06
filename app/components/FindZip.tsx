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
        const city = location;
        const state = document.getElementById('state')?.value;
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
                  placeholder="City"
                  className="input input-bordered w-full"
                  onChange={handleTextUpdate}
                  value={text}
                />
                <select name="state" id="state" className="select select-bordered">
                  <option value="AL">AL</option>
                  <option value="AK">AK</option>
                  <option value="AR">AR</option>
                  <option value="AZ">AZ</option>
                  <option value="CA">CA</option>
                  <option value="CO">CO</option>
                  <option value="CT">CT</option>
                  <option value="DC">DC</option>
                  <option value="DE">DE</option>
                  <option value="FL">FL</option>
                  <option value="GA">GA</option>
                  <option value="HI">HI</option>
                  <option value="IA">IA</option>
                  <option value="ID">ID</option>
                  <option value="IL">IL</option>
                  <option value="IN">IN</option>
                  <option value="KS">KS</option>
                  <option value="KY">KY</option>
                  <option value="LA">LA</option>
                  <option value="MA">MA</option>
                  <option value="MD">MD</option>
                  <option value="ME">ME</option>
                  <option value="MI">MI</option>
                  <option value="MN">MN</option>
                  <option value="MO">MO</option>
                  <option value="MS">MS</option>
                  <option value="MT">MT</option>
                  <option value="NC">NC</option>
                  <option value="NE">NE</option>
                  <option value="NH">NH</option>
                  <option value="NJ">NJ</option>
                  <option value="NM">NM</option>
                  <option value="NV">NV</option>
                  <option value="NY">NY</option>
                  <option value="ND">ND</option>
                  <option value="OH">OH</option>
                  <option value="OK">OK</option>
                  <option value="OR">OR</option>
                  <option value="PA">PA</option>
                  <option value="PR">PR</option>
                  <option value="RI">RI</option>
                  <option value="SC">SC</option>
                  <option value="SD">SD</option>
                  <option value="TN">TN</option>
                  <option value="TX">TX</option>
                  <option value="UT">UT</option>
                  <option value="VT">VT</option>
                  <option value="VA">VA</option>
                  <option value="VI">VI</option>
                  <option value="WA">WA</option>
                  <option value="WI">WI</option>
                  <option value="WV">WV</option>
                  <option value="WY">WY</option>
                </select>
                {zip === '' ? <button className="btn ml-1 bg-base-100" onClick={() => handleZipFind(text)}>Enter</button> : <button className="btn ml-1 bg-base-100" onClick={() => handleClearZip()}>Clear</button>}
              </div>
              {zip !== '' ? <p className="flex justify-center mt-2">{zip}</p> : null}
        </div>
      </div>
    );
}