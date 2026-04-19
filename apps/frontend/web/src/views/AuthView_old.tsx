import { useRef, useState } from "react";

import { API_ENDPOINT } from "../Config";
import { useNavigate } from "react-router-dom";
import { TransparentIconButton } from "../components/TransparentIconButton";
import { storeAccessToken, storeRefreshToken } from "../auth/Authentication";
import { FadeUp } from "../components/AnimatedPresenceDiv";
import { useAuthenticationStore } from "../stores/AuthenticationStore";
import { LoadableButton } from "../components/LoadableButton";
import { FullWidthInputWithLabel } from "../components/FullWidthInput";
import clsx from "clsx";
import {
    notify,
    notifyErrorDefault,
    notifySuccessDefault,
} from "../stores/NotificationsStore";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
            credentials: "include",
        });

        if (response.status != 201 && response.status != 200) {
            // Attempt to extract text

            try {
                const body = await response.json();
                const detail = body.detail;
                if (detail) {
                    notify({
                        title: `Failed to sign up: ${detail}`,
                        type: "error",
                        durationMs: 5000,
                    });
                } else {
                    throw new Error("Parsing failed");
                }
            } catch {
                notifyErrorDefault(
                    `Failed to sign up: ${response.status} ${response.statusText}`,
                );
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

async function login(username: string, password: string): Promise<boolean> {
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
            credentials: "include",
        });

        if (response.status != 200) {
            // Attempt to get body

            try {
                const body = await response.json();
                const detail = body.detail;
                if (detail) {
                    notifyErrorDefault(`Failed to login: ${detail}`);
                } else {
                    throw new Error("Parsing failed");
                }
            } catch {
                notifyErrorDefault(
                    `Failed to login: ${response.status} ${response.statusText}`,
                );
            }
            return false;
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
    errors: Partial<Errors>
};

type Errors = {
    loginUsername: string;
    loginPassword: string;
    signUpUsername: string;
    signUpEmail: string;
    signUpPassword: string;
    SignUpConfirmPassword: string;
};

type ErrorKey = keyof Errors;

export function AuthView_old() {
    const [formErrors, setErrors] = useState<Errors>({
        loginUsername: "",
        loginPassword: "",
        signUpUsername: "",
        signUpEmail: "",
        signUpPassword: "",
        SignUpConfirmPassword: "",
    });

    const updateErrors = (partial: Partial<Errors>) => {

        console.log("Update errors to: ", partial);

        setErrors((prev) => ({
            ...prev,
            ...partial,
        }));
    };

    const forgiveError = (k: ErrorKey) => {
        console.log("forgive: ", k);
        updateErrors({[k]: ""});
    }

    const areInputsValid = function (
        isLogin: boolean,
        usernameInput: HTMLInputElement,
        passwordInput: HTMLInputElement,
        signUpEmailInput?: HTMLInputElement,
        signUpConfirmPassword?: HTMLInputElement,
    ): ValidityResult {

        const errors: Partial<Errors> = {}

        if (!isLogin) {
            if (!signUpEmailInput || !signUpConfirmPassword) {
                throw new Error("No email input and confirm password inputs provided!");
            }

            const isUsernameValidSyntax = usernameInput.value != "";
            const isEmailValidSyntax = signUpEmailInput.checkValidity() && signUpEmailInput.value != "";

            console.log(signUpEmailInput.value);

            if (!isEmailValidSyntax) {
                errors.signUpEmail = "Please enter a valid email address";
            }

            if (!isUsernameValidSyntax) {
                errors.signUpUsername = "Please enter a valid username";
            }

            const isPasswordTooShort = passwordInput.value.length < 8;
            if (isPasswordTooShort) {
                errors.signUpPassword = "Password must be at least 8 characters long";
            }

            const doPasswordsMatch =
                signUpConfirmPassword.value == passwordInput.value;

            if (!doPasswordsMatch) {
                errors.SignUpConfirmPassword = "Passwords do not match";
            }

            const valid =
                isUsernameValidSyntax &&
                isEmailValidSyntax &&
                !isPasswordTooShort &&
                doPasswordsMatch;

            return {
                isValid: valid,
                errors: errors
            };
        } else {
            const isUsernameValid = usernameInput.value != "";

            if (!isUsernameValid) {
                errors.loginUsername = "Please enter your username";
            }

            const isPasswordValid = passwordInput.value != "";
            if (!isPasswordValid) {
                errors.loginPassword = "Please enter your password";
            }

            const inputsValid = isUsernameValid && isPasswordValid;
            return {
                isValid: inputsValid,
                errors: errors
            };
        }
    };

    const navigate = useNavigate();

    const params = new URLSearchParams(window.location.search);
    let isLoginInitial = false;

    if (params.has("action")) {
        if (params.get("action") == "login") {
            isLoginInitial = true;
        } else if (params.get("action") == "signup") {
            isLoginInitial = false;
        }
    }

    const [isLogin, setIsLogin] = useState(isLoginInitial);
    const [isLoading, setIsLoading] = useState(false);

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
    const signUpConfirmPasswordRef: React.RefObject<HTMLInputElement | null> =
        useRef(null);

    const linkClass = clsx(
        "text-underline text-md",
        isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
    );

    const toggleMode = () => {
        setErrors({
            loginPassword: "",
            loginUsername: "",
            signUpEmail: "",
            signUpPassword: "",
            signUpUsername: "",
            SignUpConfirmPassword: ""
        })
    }

    const loginUi = (
        <FadeUp className="flex flex-col gap-3 items-center" key="login">
            <h1 className="text-3xl font-bold">Login</h1>
            <FullWidthInputWithLabel
                placeholder="e.g. john_doe"
                type="text"
                name="username"
                ref={loginEmailRef}
                disabled={isLoading}
                labelName="Username"
                currentError={formErrors.loginUsername}
                onChange={() => forgiveError("loginUsername")}
            ></FullWidthInputWithLabel>
            <FullWidthInputWithLabel
                placeholder=""
                type="password"
                name="password"
                ref={loginPasswordRef}
                disabled={isLoading}
                labelName="Password"
                currentError={formErrors.loginPassword}
                onChange={() => forgiveError("loginPassword")}
            ></FullWidthInputWithLabel>
            <LoadableButton
                text="Login"
                onClick={async () => {

                    setIsLoading(true);
                    // gives the feeling that something actually happened
                    await sleep(150);

                    const valid = areInputsValid(true, loginEmailRef.current!, loginPasswordRef.current!);

                    updateErrors(valid.errors);

                    if (!valid.isValid) {
                        setIsLoading(false);
                        return;
                    }

                    
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
            ></LoadableButton>

            <span
                className={linkClass}
                onClick={() => {
                    setIsLogin(false);
                    toggleMode();
                }}
            >
                No account? Sign up!
            </span>
        </FadeUp>
    );


    
    const signUpUi = (
        <FadeUp className="flex flex-col gap-3 items-center " key="signup">
            <h1 className="text-3xl font-bold">Sign up</h1>
            <div className="h-5"></div>

            <FullWidthInputWithLabel
                placeholder="e.g. john_doe"
                labelName="Username"
                type="text"
                name="username"
                ref={signUpUsernameRef}
                disabled={isLoading}
                currentError={formErrors.signUpUsername}
                onChange={() => forgiveError("signUpUsername")}
            ></FullWidthInputWithLabel>
            <FullWidthInputWithLabel
                placeholder="example@example.com"
                type="email"
                name="email"
                ref={signUpEmailRef}
                disabled={isLoading}
                labelName="Email"
                currentError={formErrors.signUpEmail}
                onChange={() => forgiveError("signUpEmail")}
            ></FullWidthInputWithLabel>
            <FullWidthInputWithLabel
                placeholder="At least 8 characters"
                type="password"
                name="password"
                ref={signUpPasswordRef}
                disabled={isLoading}
                labelName="Password"
                currentError={formErrors.signUpPassword}
                onChange={() => forgiveError("signUpPassword")}
            ></FullWidthInputWithLabel>
            <FullWidthInputWithLabel
                placeholder=""
                type="password"
                name="password"
                ref={signUpConfirmPasswordRef}
                disabled={isLoading}
                labelName="Confirm Password"
                currentError={formErrors.SignUpConfirmPassword}
                onChange={() => forgiveError("SignUpConfirmPassword")}
            ></FullWidthInputWithLabel>
            <LoadableButton
                text="Signup"
                onClick={async () => {

                    setIsLoading(true);
                    await sleep(150);

                    const validityResult = areInputsValid(
                        isLogin,
                        signUpUsernameRef.current!,
                        signUpPasswordRef.current!,
                        signUpEmailRef.current!,
                        signUpConfirmPasswordRef.current!,
                    );

                    updateErrors(validityResult.errors);

                    if (!validityResult.isValid) {
                        setIsLoading(false);
                        return;
                    }
                    
                    await signUp(
                        signUpUsernameRef.current!.value,
                        signUpPasswordRef.current!.value,
                        signUpEmailRef.current!.value,
                    );
                    setIsLoading(false);
                }}
                isLoading={isLoading}
            ></LoadableButton>

            <span
                className={linkClass}
                onClick={() => {
                    setIsLogin(true);
                    toggleMode();
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
