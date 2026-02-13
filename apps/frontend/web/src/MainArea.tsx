import { Route, Routes } from "react-router-dom";
import { Discover } from "./pages/discover/Discover";
import { Home } from "./pages/home/Home";
import { Trending } from "./pages/trending/Trending";
import { useSideNavigationVisibility } from "./stores/SideNavigationVisibilityStore";
import { AnimatePresence } from "framer-motion";
import { Fade } from "./components/AnimatedPresenceDiv";
import { useScreenSizeState } from "./stores/ScreenSizeState";

export function MainArea() {

    const sideNavigationOpen = useSideNavigationVisibility(state => state.visible);
    const screenSize = useScreenSizeState(state => state.width);
    

    return <div className="flex-grow-1 h-full p-16 relative">
        <AnimatePresence>
            {(sideNavigationOpen && screenSize < 640) && <Fade className="absolute w-full h-full bg-black opacity-50 top-0 left-0" finalOpacity={0.5}><span></span></Fade>}
        </AnimatePresence>
        
        <Routes>
            <Route index element={<Home></Home>}></Route>
            <Route path="discover" element={<Discover></Discover>}></Route>
            <Route path="trending" element={<Trending></Trending>}></Route>
        </Routes>
    </div>;
}
