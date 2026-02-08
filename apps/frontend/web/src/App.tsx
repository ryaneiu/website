import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CreatePostView } from "./views/CreatePostView";
import { PrimaryView } from "./views/PrimaryView";
import { AuthView } from "./views/AuthView";

function App() {
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
