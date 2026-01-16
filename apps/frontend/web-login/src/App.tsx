import { useState } from "react";
import { Button } from "./components/Button";

function signUp() {
    
}

function App() {
    const [isLogin, setIsLogin] = useState(true);

    const loginUi = (
        <>
            <h1 className="text-3xl font-bold text-black">Login</h1>
            <div className="h-5"></div>
            <input
                className="px-2 py-2 border border-black/15 rounded-md w-full"
                placeholder="Username"
                type="text"
            ></input>
            <input
                className="px-2 py-2 border border-black/15 rounded-md w-full"
                placeholder="Password"
                type="password"
            ></input>
            <Button text="Login"></Button>

            <span
                className="text-underline text-black text-md cursor-pointer"
                onClick={() => {
                    setIsLogin(false);
                }}
            >
                No account? Sign up!
            </span>
        </>
    );

    const signUpUi = (
        <>
            <h1 className="text-3xl font-bold text-black">Sign up</h1>
            <div className="h-5"></div>
            <input
                className="px-2 py-2 border border-black/15 rounded-md w-full"
                placeholder="Username"
                type="text"
            ></input>
            <input
                className="px-2 py-2 border border-black/15 rounded-md w-full"
                placeholder="Password"
                type="password"
            ></input>
            <Button text="Signup"></Button>

            <span
                className="text-underline text-black text-md cursor-pointer"
                onClick={() => {
                    setIsLogin(true);
                }}
            >
                Already have an account?
            </span>
        </>
    );

    return (
        <div className="w-[100vw] h-[100vh] flex items-center justify-center">
            <div className="px-4 py-4 flex flex-col gap-3 items-center w-72">
                {isLogin ? loginUi : signUpUi}
            </div>
        </div>
    );
}

export default App;
