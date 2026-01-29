import { useEffect, useRef, useState } from "react";
import { Button } from "./components/Button";

function signUp() {
    alert("Sign up not implemented");
}

function login() {
    alert("Login not implemented");
}

type ValidityResult = {
    isValid: boolean;
    message: string;
};

function areInputsValid(
    isLogin: boolean,
    inputEmail: HTMLInputElement,
    inputPassword: HTMLInputElement
): ValidityResult {
    if (isLogin) {
        const isValidSyntax = (
            inputEmail.checkValidity() && inputPassword.checkValidity()
        );

        return {
            isValid: isValidSyntax,
            message: !isValidSyntax ? "Email not valid" : "",
        };
    } else {
        const isValidSyntax = (
            inputEmail.checkValidity() && inputPassword.checkValidity()
        );
        
        const passwordLengthCheck = inputPassword.value.length >= 8;

        console.log("Valid: ", isValidSyntax);
        console.log("Password length: ", passwordLengthCheck);
        

        const messagePasswordLength = !passwordLengthCheck
            ? "Password must be at least 8 characters long"
            : "";

        let message = "";
        if (!passwordLengthCheck && isValidSyntax) {
            message = messagePasswordLength;
        } else if (!isValidSyntax) {
            message = "Email not valid";
        } else if (!(passwordLengthCheck && isValidSyntax)) {
            message = "One or more inputs are not valid";
        }

        return {
            isValid: isValidSyntax && passwordLengthCheck,
            message: message,
        };
    }
}

function App() {
    const [isLogin, setIsLogin] = useState(true);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        if (params.has("action")) {
            if (params.get("action") == "login") {
                setIsLogin(true);
            } else if (params.get("action") == "signup") {
                setIsLogin(false);
            }
        }
    }, []);

    const loginEmailRef = useRef(null);
    const loginPasswordRef = useRef(null);
    const signUpEmailRef = useRef(null);
    const signUpPasswordRef = useRef(null);

    const loginUi = (
        <>
            <h1 className="text-3xl font-bold text-black">Login</h1>
            <div className="h-5"></div>
            <input
                className="px-2 py-2 border border-black/15 rounded-md w-full"
                placeholder="Email"
                type="email"
                ref={loginEmailRef}
            ></input>
            <input
                className="px-2 py-2 border border-black/15 rounded-md w-full"
                placeholder="Password"
                type="password"
                ref={loginPasswordRef}
            ></input>
            <Button
                text="Login"
                onClick={() => {
                const validityResult = areInputsValid(
                        isLogin,
                        loginEmailRef.current!,
                        loginPasswordRef.current!
                    );

                    if (!validityResult.isValid) {
                        alert(`Invalid input: ${validityResult.message}`);
                        return;
                    }
    
                    login();
                }}
            ></Button>

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
                placeholder="Email"
                type="email"
                ref={signUpEmailRef}
            ></input>
            <input
                className="px-2 py-2 border border-black/15 rounded-md w-full"
                placeholder="Password"
                type="password"
                ref={signUpPasswordRef}
            ></input>
            <Button
                text="Signup"
                onClick={() => {
                    const validityResult = areInputsValid(
                        isLogin,
                        signUpEmailRef.current!,
                        signUpPasswordRef.current!
                    );

                    if (!validityResult.isValid) {
                        alert(`Invalid input: ${validityResult.message}`);
                        return;
                    }
                    signUp();
                }}
            ></Button>

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
