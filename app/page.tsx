

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-12">
      <header className="flex justify-between w-full">
        <p>logo</p>
        <p>about</p>
      </header>
      <div>
        <h1 className="text-3xl">midpoint</h1>
      </div>
      <div id="firstLocation">
        <div className="flex flex-row mt-10">
          <input type="text" placeholder="First location zip code" className="input input-bordered w-full max-w-xs m-3" />
          <button className="btn m-3">Enter</button>
        </div>
      </div>
      <div id="secondLocation">
        <div className="flex flex-row mt-5">
          <input type="text" placeholder="Second location zip code" className="input input-bordered w-full max-w-xs m-3" />
          <button className="btn m-3">Enter</button>
        </div>
      </div>
      <button className="btn btn-lg m-10">Find Midpoint</button>
    </main>
  )
}
