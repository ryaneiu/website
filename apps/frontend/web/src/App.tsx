import { BrowserRouter, Route, Routes } from "react-router-dom";
import React, { Suspense, useEffect } from "react";
import { useScreenSizeState } from "./stores/ScreenSizeState";
import { clearStoredTokens, isDevelopmentMode } from "./auth/Authentication";
import { notifyInfoDefault } from "./stores/NotificationsStore";
import {
    fetchCurrentProfile,
    useAuthenticationStore,
    verifyIsLoggedIn,
} from "./stores/AuthenticationStore";
import { NotificationList } from "./components/Notify";
import { LoadingPageFallbackFS } from "./components/LoadingPageFallback";
import { useDarkModeStore } from "./stores/DarkModeStore";

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
        const localStorageData = localStorage.getItem("color-scheme");

        if (localStorageData != "dark" && localStorageData != "light") {
            console.warn("Stored color scheme is invalid. Clearing");
            localStorage.removeItem("color-sceheme");
        }

        const isDarkMode = window.matchMedia(
            "(prefers-color-scheme: dark)",
        ).matches;
        const isLightMode = window.matchMedia(
            "(prefers-color-scheme: light)",
        ).matches;

        if (!isDarkMode && !isLightMode) {
            console.log("No color scheme preference found");
        }

        if (localStorageData) {
            switch (localStorageData) {
                case "dark":
                    console.log("Set color scheme to dark mode");
                    useDarkModeStore.setState({ isDarkMode: true });
                    break;
                case "light":
                    console.log("Set color scheme to light mode");
                    useDarkModeStore.setState({ isDarkMode: false });
                    break;
                default:
                    console.warn("Unknown scheme: ", localStorageData);
                    break;
            }
        } else {
            if (isDarkMode) {
                useDarkModeStore.setState({ isDarkMode: true });
                localStorage.setItem("color-scheme", "dark");
                console.log("Device prefers dark mode");
            } else if (isLightMode) {
                useDarkModeStore.setState({ isDarkMode: false });
                localStorage.setItem("color-scheme", "light");
                console.log("Device prefers light mode");
            } else {
                console.log("No preference found, defaulting to light mode");
                localStorage.setItem("color-scheme", "light");
                useDarkModeStore.setState({ isDarkMode: false });
            }
        }
    }, []);

    const darkMode = useDarkModeStore((state) => state.isDarkMode);

    useEffect(() => {
        if (darkMode) {
            console.log("Switching to dark mode, adding class 'dark'")
            document.documentElement.classList.add("dark");
        } else {
            console.log("Switching to light mode, removing class 'dark'")
            document.documentElement.classList.remove("dark");
        }
    }, [darkMode]);

    useEffect(() => {
        const f = async () => {
            const loggedIn = await verifyIsLoggedIn();
            useAuthenticationStore.setState({ isLoggedIn: loggedIn });

            if (loggedIn) {
                await fetchCurrentProfile();
            } else {
                useAuthenticationStore.setState({
                    username: "",
                    bio: "",
                    profileImage: "",
                });
                clearStoredTokens();

                if (!window.location.pathname.startsWith("/auth")) {
                    window.location.replace("/auth?action=login");
                }
            }
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
