import { BrowserRouter, Route, Routes } from "react-router-dom";
import React, { Suspense, useEffect } from "react";
import { useScreenSizeState } from "./stores/ScreenSizeState";
import { isDevelopmentMode } from "./auth/Authentication";
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
            alert(
                "To debug an issue, use F12 or Ctrl + Shift + I to open the development tools.\nTo see issues with the API (login failed, request failed, etc.), use the network tab.\nFor other issues, try the Console tab.",
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
        <>
            <NotificationList></NotificationList>
            <BrowserRouter>
                <Suspense
                    fallback={<LoadingPageFallbackFS></LoadingPageFallbackFS>}
                >
                    <Routes>
                        <Route
                            path="/*"
                            element={<PrimaryView></PrimaryView>}
                        ></Route>
                        <Route
                            path="/create"
                            element={<CreatePostView></CreatePostView>}
                        ></Route>
                        <Route
                            path="/auth"
                            element={<AuthView></AuthView>}
                        ></Route>
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </>
    );
}

export default App;
