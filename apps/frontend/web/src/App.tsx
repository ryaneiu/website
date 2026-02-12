import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CreatePostView } from "./views/CreatePostView";
import { PrimaryView } from "./views/PrimaryView";
import { AuthView } from "./views/AuthView";
import { useEffect } from "react";
import { useScreenSizeState } from "./stores/ScreenSizeState";
import { isDevelopmentMode } from "./auth/Authentication";

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
        if (!hasShownDebugTip()) {
            alert("To debug a UI issue, use F12 or Ctrl + Shift + I to open the development tools. Then, press the console tab to see debug logs.");
            localStorage.setItem("debugTipShown", "true");
        }
    }, []);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/*" element={<PrimaryView></PrimaryView>}></Route>
                <Route
                    path="/create"
                    element={<CreatePostView></CreatePostView>}
                ></Route>
                <Route path="/auth" element={<AuthView></AuthView>}></Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
