import { BrowserRouter, Route, Routes } from "react-router-dom";
import React, { Suspense, useEffect } from "react";
import { useScreenSizeState } from "./stores/ScreenSizeState";
import { isDevelopmentMode } from "./auth/Authentication";
import { notifyInfoDefault } from "./stores/NotificationsStore";
import {
    useAuthenticationStore,
    verifyIsLoggedIn,
} from "./stores/AuthenticationStore";
import { NotificationList } from "./components/Notify";
import { LoadingPageFallbackFS } from "./components/LoadingPageFallback";

function hasShownDebugTip() {
    if (!isDevelopmentMode()) return true;
    return localStorage.getItem("debugTipShown") != null;
}

const PrimaryView = React.lazy(() => import("./views/PrimaryView"));
const CreatePostView = React.lazy(() => import("./views/CreatePostView"));
const AuthView = React.lazy(() => import("./views/AuthView"));

function App() {
    const setSize = useScreenSizeState((state) => state.setSize);

    useEffect(() => {
        const handleResize = () => {
            setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener("resize", handleResize);

        // Set initial size
        handleResize();

        return () => window.removeEventListener("resize", handleResize);
    }, [setSize]);

    useEffect(() => {
        if (!hasShownDebugTip() && isDevelopmentMode()) {
            notifyInfoDefault(
                "Debug tip: use F12 (or Ctrl+Shift+I) and check Network/Console tabs.",
            );
            localStorage.setItem("debugTipShown", "true");
        }
    }, []);

    useEffect(() => {
        const f = async () => {
            const loggedIn = await verifyIsLoggedIn();
            useAuthenticationStore.setState({ isLoggedIn: loggedIn });
        };
        f();
    }, []);

    return (
        <div className="w-[100vw] h-[100vh] text-black dark:text-white bg-white dark:bg-zinc-900 transition-colors duration-300">
            <NotificationList></NotificationList>
            <BrowserRouter>
                <Routes>
                    <Route
                        path="/*"
                        element={
                            <Suspense fallback={<LoadingPageFallbackFS />}>
                                <PrimaryView />
                            </Suspense>
                        }
                    />
                    <Route
                        path="/create"
                        element={
                            <Suspense fallback={<LoadingPageFallbackFS />}>
                                <CreatePostView />
                            </Suspense>
                        }
                    />
                    <Route
                        path="/auth"
                        element={
                            <Suspense fallback={<LoadingPageFallbackFS />}>
                                <AuthView />
                            </Suspense>
                        }
                    />
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;
