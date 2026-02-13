import { useEffect, useRef, useState } from "react";

import { API_ENDPOINT } from "../Config";
import { useNavigate } from "react-router-dom";
import { TransparentIconButton } from "../components/TransparentIconButton";
import { storeAccessToken, storeRefreshToken } from "../auth/Authentication";
import {FadeUp} from "../components/AnimatedPresenceDiv";
import { useAuthenticationStore } from "../stores/AuthenticationStore";
import { LodableButton } from "../components/LoadableButton";
import { FullWidthInput } from "../components/FullWidthInput";
import clsx from "clsx";
import { notify, notifyErrorDefault, notifySuccessDefault } from "../stores/NotificationsStore";

async function signUp(username: string, password: string, email: string) {
    try {
        const response = await fetch(`${API_ENDPOINT}/api/signup/`, {
            method: "POST",
            body: JSON.stringify({
                username: username,
                password: password,
                email: email,
            }),
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.status != 201 && response.status != 200) {
            // Attempt to extract text

            try {
                const body = await response.json();
                const detail = body.detail;
                if (detail) {
                    notify({title: `Failed to sign up: ${detail}`, type: "error", durationMs: 5000})
                } else {
                    throw new Error("Parsing failed");
                }
            } catch {
                notifyErrorDefault(`Failed to sign up: ${response.status} ${response.statusText}`)
                /* alert(
                    `Failed to sign up: ${response.status} ${response.statusText}`,
                ); */
            }

            return false;
        }

        notifySuccessDefault("Sign up successfull, please login");
        return true;
    } catch (e) {
        console.error("Failed: ", e);
        notifyErrorDefault("Failed to sign up");
        return false;
    }
}

async function login(username: string, password: string) {
    try {
        const response = await fetch(`${API_ENDPOINT}/token/`, {
            method: "POST",
            body: JSON.stringify({
                username: username,
                password: password,
            }),
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.status != 200) {
            // Attempt to get body

            try {
                const body = await response.json();
                const detail = body.detail;
                if (detail) {
                    notifyErrorDefault(`Failed to login: ${detail}`)
                } else {
                    throw new Error("Parsing failed");
                }
            } catch {
                notifyErrorDefault(`Failed to login: ${response.status} ${response.statusText}`)
            } finally {
                return false;
            }
        }

        try {
            const body = await response.json();
            const refresh: string = body.refresh;
            const access: string = body.access;
            if (refresh && access) {
                storeRefreshToken(refresh);
                storeAccessToken(access);
            } else {
                throw new Error(
                    "Parsing failed. Server did not return refresh & access tokens as readable JSON",
                );
            }
        } catch (e) {
            console.error(
                "Failed to parse returned JSON. May not be fatal if using cookies. Error: ",
                e,
            );
        }

        /* alert(
            "Login successfull. Cookies will not work unless this page is served on the actual backend server.",
        ); */
        useAuthenticationStore.setState({ isLoggedIn: true });
        return true;
    } catch (e) {
        console.error("Failed: ", e);
        notifyErrorDefault("Failed to login");
        return false;
    }
}

type ValidityResult = {
    isValid: boolean;
    message: string;
};

function areInputsValid(
    isLogin: boolean,
    inputEmail: HTMLInputElement,
    inputPassword: HTMLInputElement,
): ValidityResult {
    if (isLogin) {
        const isValidSyntax =
            inputEmail.checkValidity() && inputPassword.checkValidity();

        return {
            isValid: isValidSyntax,
            message: !isValidSyntax ? "Email not valid" : "",
        };
    } else {
        const isValidSyntax =
            inputEmail.checkValidity() && inputPassword.checkValidity();

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

export function AuthView() {
    const navigate = useNavigate();

    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

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

    const loginEmailRef: React.RefObject<HTMLInputElement | null> =
        useRef(null);
    const loginPasswordRef: React.RefObject<HTMLInputElement | null> =
        useRef(null);
    const signUpUsernameRef: React.RefObject<HTMLInputElement | null> =
        useRef(null);
    const signUpEmailRef: React.RefObject<HTMLInputElement | null> =
        useRef(null);
    const signUpPasswordRef: React.RefObject<HTMLInputElement | null> =
        useRef(null);

    const linkClass = clsx(
        "text-underline text-black text-md",
        isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
    );

    const loginUi = (
        <FadeUp className="flex flex-col gap-3 items-center" key="login">
            <h1 className="text-3xl font-bold text-black">Login</h1>
            <FullWidthInput
                placeholder="Username"
                type="text"
                name="username"
                ref={loginEmailRef}
                disabled={isLoading}
            ></FullWidthInput>
            <FullWidthInput
                placeholder="Password"
                type="password"
                name="password"
                ref={loginPasswordRef}
                disabled={isLoading}
            ></FullWidthInput>
            <LodableButton
                text="Login"
                onClick={async () => {
                    /* const validityResult = areInputsValid(
                        isLogin,
                        loginEmailRef.current!,
                        loginPasswordRef.current!,
                    );

                    if (!validityResult.isValid) {
                        alert(`Invalid input: ${validityResult.message}`);
                        return;
                    } */

                    setIsLoading(true);
                    const success = await login(
                        loginEmailRef.current!.value,
                        loginPasswordRef.current!.value,
                    );
                    setIsLoading(false);
                    if (success) {
                        navigate("/");
                    }
                }}
                isLoading={isLoading}
            ></LodableButton>

            <span
                className={linkClass}
                onClick={() => {
                    setIsLogin(false);
                }}
            >
                No account? Sign up!
            </span>
        </FadeUp>
    );

    const signUpUi = (
        <FadeUp className="flex flex-col gap-3 items-center " key="signup">
            <h1 className="text-3xl font-bold text-black">Sign up</h1>
            <div className="h-5"></div>

            <FullWidthInput
                placeholder="Username"
                type="text"
                name="username"
                ref={signUpUsernameRef}
                disabled={isLoading}
            ></FullWidthInput>
            <FullWidthInput
                placeholder="Email"
                type="email"
                name="email"
                ref={signUpEmailRef}
                disabled={isLoading}
            ></FullWidthInput>
            <FullWidthInput
                placeholder="Password"
                type="password"
                name="password"
                ref={signUpPasswordRef}
                disabled={isLoading}
            ></FullWidthInput>
            <LodableButton
                text="Signup"
                onClick={async () => {
                    const validityResult = areInputsValid(
                        isLogin,
                        signUpEmailRef.current!,
                        signUpPasswordRef.current!,
                    );

                    if (!validityResult.isValid) {
                        notifyErrorDefault(`Invalid input: ${validityResult.message}`);
                        return;
                    }
                    setIsLoading(true);
                    await signUp(
                        signUpUsernameRef.current!.value,
                        signUpPasswordRef.current!.value,
                        signUpEmailRef.current!.value,
                    );
                    setIsLoading(false);
                }}
                isLoading={isLoading}
            ></LodableButton>

            <span
                className={linkClass}
                onClick={() => {
                    setIsLogin(true);
                }}
            >
                Already have an account?
            </span>
        </FadeUp>
    );

    return (
        <div className="w-[100vw] h-[100vh] flex items-center justify-center relative">
            <span className="absolute top-2 left-2">
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
            </span>

            <div className="px-4 py-4 w-72">{isLogin ? loginUi : signUpUi}</div>
        </div>
    );
}
