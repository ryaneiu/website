import { Route, Routes } from "react-router-dom";
import { useSideNavigationVisibility } from "./stores/SideNavigationVisibilityStore";
import { AnimatePresence } from "framer-motion";
import { Fade } from "./components/AnimatedPresenceDiv";
import { useScreenSizeState } from "./stores/ScreenSizeState";
import React, { Suspense } from "react";
import { LoadingPageFallback } from "./components/LoadingPageFallback";

const Home = React.lazy(() => import("./pages/home/Home"));
const Discover = React.lazy(() => import("./pages/discover/Discover"));
const Trending = React.lazy(() => import("./pages/trending/Trending"));
const Profile = React.lazy(() => import("./pages/editProfile/Profile"));

export function MainArea() {
    const sideNavigationOpen = useSideNavigationVisibility(
        (state) => state.visible,
    );
    const screenSize = useScreenSizeState((state) => state.width);


    return (
        <div className="flex-grow-1 h-full p-16 relative">
            <AnimatePresence>
                {sideNavigationOpen && screenSize < 640 && (
                    <Fade
                        className="absolute w-full h-full bg-black opacity-50 top-0 left-0"
                        finalOpacity={0.5}
                    >
                        <span></span>
                    </Fade>
                )}
            </AnimatePresence>

            <Suspense fallback={<LoadingPageFallback></LoadingPageFallback>}>
                <Routes>
                    <Route index element={<Home></Home>}></Route>
                    <Route
                        path="discover"
                        element={<Discover></Discover>}
                    ></Route>
                    <Route
                        path="trending"
                        element={<Trending></Trending>}
                    ></Route>
                    <Route path="profile" element={<Profile></Profile>}></Route>
                </Routes>
            </Suspense>
        </div>
    );
}
