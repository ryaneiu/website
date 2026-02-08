import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CreatePostView } from "./views/CreatePostView";
import { PrimaryView } from "./views/PrimaryView";
import { AuthView } from "./views/AuthView";
import { useEffect } from "react";
import { useScreenSizeState } from "./stores/ScreenSizeState";

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
