import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CreatePostView } from "./views/CreatePostView";
import { PrimaryView } from "./views/PrimaryView";
import { AuthView } from "./views/AuthView";
import { useEffect } from "react";
import { useScreenSizeState } from "./stores/ScreenSizeState";
import { isDevelopmentMode } from "./auth/Authentication";
import {
    useAuthenticationStore,
    verifyIsLoggedIn,
} from "./stores/AuthenticationStore";
import { NotificationList } from "./components/Notify";

function hasShownDebugTip() {
    if (!isDevelopmentMode()) return true;
    return localStorage.getItem("debugTipShown") != null;
}

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
    }, []);

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
                <Routes>
                    <Route
                        path="/*"
                        element={<PrimaryView></PrimaryView>}
                    ></Route>
                    <Route
                        path="/create"
                        element={<CreatePostView></CreatePostView>}
                    ></Route>
                    <Route path="/auth" element={<AuthView></AuthView>}></Route>
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;
