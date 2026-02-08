import { Route, Routes } from "react-router-dom";
import { Discover } from "./pages/discover/Discover";
import { ErrorPage } from "./pages/error/ErrorPage";
import { Home } from "./pages/home/Home";
import { Trending } from "./pages/trending/Trending";
import { DisplayedTab, displayedTabStore } from "./stores/DisplayedTabStore";

export function MainArea() {
    return <div className="flex-grow-1 h-full p-16">
        <Routes>
            <Route index element={<Home></Home>}></Route>
            <Route path="discover" element={<Discover></Discover>}></Route>
            <Route path="trending" element={<Trending></Trending>}></Route>
        </Routes>
    </div>;
}
