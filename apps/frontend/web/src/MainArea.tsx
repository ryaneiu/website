import { Route, Routes } from "react-router-dom";
import { Discover } from "./pages/discover/Discover";
import { Home } from "./pages/home/Home";
import { Trending } from "./pages/trending/Trending";

export function MainArea() {
    return <div className="flex-grow-1 h-full p-16">
        <Routes>
            <Route index element={<Home></Home>}></Route>
            <Route path="discover" element={<Discover></Discover>}></Route>
            <Route path="trending" element={<Trending></Trending>}></Route>
        </Routes>
    </div>;
}
