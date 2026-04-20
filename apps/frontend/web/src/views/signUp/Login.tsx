import { useRef, useState } from "react";
import { Button } from "../../components/Button";
import { FullWidthInputWithLabel } from "../../components/FullWidthInput";
import { SectionSeparator } from "../../components/SectionSeparator";
import { GoogleIcon, MicrosoftIcon } from "./OAuth2ProviderIcons";
import { useSignUpStore, type Errors } from "./SignUpStore";
import { login } from "./AuthHandlers";
import { useNavigate } from "react-router-dom";
import { LoadableButton } from "../../components/LoadableButton";
import { FadeUpLeaveUp } from "../../components/AnimatedPresenceDiv";

export function Login() {
    const formErrors = useSignUpStore((state) => state.formErrors);
    const forgive = useSignUpStore((state) => state.forgiveError);
    const updateErrors = useSignUpStore((state) => state.updateErrors);
    const values = useSignUpStore((state) => state.values);
    const setValue = useSignUpStore((state) => state.updateValue);

    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState<boolean>(false);

    // input elements
    const usernameRef = useRef<HTMLInputElement | null>(null);
    const passwordRef = useRef<HTMLInputElement | null>(null);

    const onLoginClicked = async () => {
        if (!usernameRef.current || !passwordRef.current) return;

        const toBeUpdated: Partial<Errors> = {};

        for (const k in formErrors) {
            forgive(k as keyof Errors);
        }

        const usernameValid = usernameRef.current.value != "";
        const passwordValid = passwordRef.current.value != "";

        if (!usernameValid) {
            toBeUpdated.loginUsername = "Please enter your username";
        }

        if (!passwordValid) {
            toBeUpdated.loginPassword = "Please enter your password";
        }

        updateErrors(toBeUpdated);

        if (!usernameValid || !passwordValid) return;

        const values = useSignUpStore.getState().values;

        setIsLoading(true);
        const success = await login(values.loginUsername, values.loginPassword);
        setIsLoading(false);

        if (success) {
            navigate("/");
        }
    };

    return (
        <FadeUpLeaveUp className="flex flex-col gap-6 items-center" key="login">
            <div className="flex flex-col gap-2 items-center">
                <h1 className="text-3xl font-bold tracking-tight w-full text-center">
                    Login
                </h1>
                <span className="opacity-50">
                    Log into your LT-Forum account
                </span>
            </div>

            <div className="flex flex-col gap-4 w-full items-center">
                <div className="flex flex-col gap-3 w-full">
                    <FullWidthInputWithLabel
                        labelName="Username"
                        currentError={formErrors.loginUsername}
                        type="text"
                        name="username"
                        placeholder="John Doe"
                        onChange={(v) => {
                            forgive("loginUsername");
                            setValue({ loginUsername: v });
                        }}
                        value={values.loginUsername}
                        ref={usernameRef}
                        disabled={isLoading}
                    ></FullWidthInputWithLabel>
                    <FullWidthInputWithLabel
                        labelName="Password"
                        currentError={formErrors.loginPassword}
                        type="password"
                        name="password"
                        placeholder=""
                        onChange={(v) => {
                            forgive("loginPassword");
                            setValue({ loginPassword: v });
                        }}
                        value={values.loginPassword}
                        ref={passwordRef}
                        disabled={isLoading}
                    ></FullWidthInputWithLabel>
                </div>
                <a
                    className="underline  text-xs text-black/50 dark:text-white/50 cursor-pointer"
                    onClick={() => {
                        if (isLoading) return;
                        useSignUpStore.setState({ isLogin: false });
                    }}
                >
                    I don't have an account
                </a>
                <LoadableButton
                    text="Login"
                    alignText={true}
                    absoluteCentering={true}
                    isPrimary={true}
                    additionalClasses="w-full"
                    isLoading={isLoading}
                    onClick={onLoginClicked}
                ></LoadableButton>
            </div>
            <div className="flex flex-col gap-3">
                <SectionSeparator sectionName="OR"></SectionSeparator>
                <div className="flex flex-col gap-2">
                    <Button
                        text=""
                        icon={GoogleIcon}
                        disabled={true}
                        content={
                            <div className="flex flex-col items-start">
                                <span className="font-semibold">
                                    Continue with Google
                                </span>
                                <span className="font-normal text-xs opacity-50">
                                    Not available yet
                                </span>
                            </div>
                        }
                    ></Button>
                    <Button
                        text=""
                        icon={MicrosoftIcon}
                        disabled={true}
                        content={
                            <div className="flex flex-col items-start">
                                <span className="font-semibold">
                                    Continue with Microsoft
                                </span>
                                <span className="font-normal text-xs opacity-50">
                                    Not available yet
                                </span>
                            </div>
                        }
                    ></Button>
                </div>
            </div>
        </FadeUpLeaveUp>
    );
}
