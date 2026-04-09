import { Route, Routes, useLocation } from "react-router-dom";
import { useSideNavigationVisibility } from "./stores/SideNavigationVisibilityStore";
import { AnimatePresence } from "framer-motion";
import { Fade } from "./components/AnimatedPresenceDiv";
import { useScreenSizeState } from "./stores/ScreenSizeState";
import React, { Suspense, useEffect, useRef } from "react";
import { LoadingPageFallback } from "./components/LoadingPageFallback";
const Home = React.lazy(() => import("./pages/home/Home"));
const Discover = React.lazy(() => import("./pages/discover/Discover"));
const Trending = React.lazy(() => import("./pages/trending/Trending"));
const Profile = React.lazy(() => import("./pages/editProfile/Profile"));
const PostPage = React.lazy(() => import("./pages/postPage/PostPage"));
const SubforumList = React.lazy(() => import("./pages/subforums/SubforumList"));
const SubforumDetail = React.lazy(() => import("./pages/subforums/SubforumDetail"));

export function MainArea() {
    const sideNavigationOpen = useSideNavigationVisibility(
        (state) => state.visible,
    );
    const screenSize = useScreenSizeState((state) => state.width);

    const mainContainer = useRef<HTMLDivElement>(null);
    const location = useLocation();

    useEffect(() => {
        if (mainContainer.current) {
            mainContainer.current.scrollTop = 0;
        }
    }, [location]);

    return (
        <div className="flex-grow-1 h-full p-6 sm:p-8 md:p-10 lg:p-16 relative overflow-y-auto dark:bg-zinc-900 transition-colors duration-300" ref={mainContainer}>
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

            <Routes>
                <Route
                    index
                    element={
                        <Suspense fallback={<LoadingPageFallback />}>
                            <Home />
                        </Suspense>
                    }
                />
                <Route
                    path="discover"
                    element={
                        <Suspense fallback={<LoadingPageFallback />}>
                            <Discover />
                        </Suspense>
                    }
                />
                <Route
                    path="trending"
                    element={
                        <Suspense fallback={<LoadingPageFallback />}>
                            <Trending />
                        </Suspense>
                    }
                />
                <Route
                    path="profile"
                    element={
                        <Suspense fallback={<LoadingPageFallback />}>
                            <Profile />
                        </Suspense>
                    }
                />
                <Route
                    path="post/:id"
                    element={
                        <Suspense fallback={<LoadingPageFallback/>}>
                            <PostPage></PostPage>
                        </Suspense>
                    }
                ></Route>
                <Route
                    path="subforums"
                    element={
                        <Suspense fallback={<LoadingPageFallback/>}>
                            <SubforumList></SubforumList>
                        </Suspense>
                    }
                ></Route>
                <Route
                    path="subforums/:slug"
                    element={
                        <Suspense fallback={<LoadingPageFallback/>}>
                            <SubforumDetail></SubforumDetail>
                        </Suspense>
                    }
                ></Route>
            </Routes>
        </div>
    );
}
