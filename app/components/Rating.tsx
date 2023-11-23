import { IoStar, IoStarHalf, IoStarOutline } from "react-icons/io5";

export default function Rating({ rating }: { rating: number }) {
    const num = Math.floor(rating);
    const dec = rating % 1;
    const stars = [];
    for (let i = 0; i < num; i++) {
        stars.push(<span className="text-yellow-400"><IoStar /></span>);
    }
    if (dec >= 0.5) {
        stars.push(<span className="text-yellow-400"><IoStarHalf /></span>);
    }
    for (let i = 0; i < 5 - num - (dec >= 0.5 ? 1 : 0); i++) {
        stars.push(<span className="text-yellow-400"><IoStarOutline /></span>);
    }
    return (
        <div className="flex">
            <div className="flex items-center">
                {stars}
            </div>
        </div>
    );
}