import { useEffect, useLayoutEffect } from "react";
import { SignUp } from "./signUp/SignUp";
import { useSignUpStore } from "./signUp/SignUpStore";
import { Login } from "./signUp/Login";
import { AnimatePresence } from "framer-motion";
import { TransparentIconButton } from "../components/TransparentIconButton";
import { useNavigate } from "react-router-dom";
import { useAuthenticationStore } from "../stores/AuthenticationStore";

export default function AuthView() {
    useLayoutEffect(() => {
        const params = new URLSearchParams(window.location.search);
        let isLoginInitial = false;

        if (params.has("action")) {
            if (params.get("action") == "login") {
                isLoginInitial = true;
            } else if (params.get("action") == "signup") {
                isLoginInitial = false;
            }
        }

        useSignUpStore.setState({ isLogin: isLoginInitial });
    }, []);

    useEffect(() => {
        // clear on each remount
        useSignUpStore.setState({
            values: {
                loginPassword: "",
                loginUsername: "",
                signUpUsername: "",
                signUpEmail: "",
                signUpPassword: "",
                SignUpConfirmPassword: "",
            },
        });
    });

    const isLogin = useSignUpStore((state) => state.isLogin);

    const isAuthenticated = useAuthenticationStore(state => state.isLoggedIn);

    const navigate = useNavigate();

    return (
        <div className="w-full h-full flex justify-center items-center relative">
            {isAuthenticated && <span className="absolute top-2 left-2">
                <TransparentIconButton
                    icon={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="#1f1f1f"
                        >
                            <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
                        </svg>
                    }
                    onClick={() => {
                        navigate("/");
                    }}
                ></TransparentIconButton>
            </span>}
            <AnimatePresence mode="wait">
                {isLogin ? <Login></Login> : <SignUp></SignUp>}
            </AnimatePresence>
        </div>
    );
}
