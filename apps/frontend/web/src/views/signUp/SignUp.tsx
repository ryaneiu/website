import { useRef, useState } from "react";
import { Button } from "../../components/Button";
import { FullWidthInputWithLabel } from "../../components/FullWidthInput";
import { SectionSeparator } from "../../components/SectionSeparator";
import { useSignUpStore, type Errors } from "./SignUpStore";
import { LoadableButton } from "../../components/LoadableButton";
import { signUp } from "./AuthHandlers";
import { useNavigate } from "react-router-dom";
import { GoogleIcon, MicrosoftIcon } from "./OAuth2ProviderIcons";
import { FadeUpLeaveUp } from "../../components/AnimatedPresenceDiv";
import { AnimatePresence } from "framer-motion";
import { OauthAvailable } from "./OAuthFeatureReady";
import { TransparentIconButton } from "../../components/TransparentIconButton";

export function SignUpStage0() {
    const updateErrors = useSignUpStore((state) => state.updateErrors);
    const forgive = useSignUpStore((state) => state.forgiveError);
    const formErrors = useSignUpStore((state) => state.formErrors);

    const updateValue = useSignUpStore((state) => state.updateValue);
    const values = useSignUpStore((state) => state.values);

    const setScreenStage = useSignUpStore((state) => state.setScreenStage);

    // -- stage 0
    const emailInputRef = useRef<HTMLInputElement | null>(null);

    const continueClicked = () => {
        if (!emailInputRef.current) return;

        const value = emailInputRef.current.value;

        const valid = value != "" && emailInputRef.current.checkValidity();

        if (!valid) {
            updateErrors({ signUpUsername: "Please enter your username" });
            return;
        }

        // is valid
        setScreenStage(1);
    };

    return (
        <FadeUpLeaveUp className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 items-center">
                <h1 className="text-3xl font-bold tracking-tight w-full text-center">
                    Create Account
                </h1>
                <span className="opacity-50 text-center">
                    Get started by choosing a username
                </span>
            </div>

            <div className="flex flex-col items-center gap-4">
                <FullWidthInputWithLabel
                    labelName="Username"
                    currentError={formErrors.signUpUsername}
                    type="text"
                    name="username"
                    placeholder="john_doe"
                    ref={emailInputRef}
                    onChange={(v) => {
                        forgive("signUpUsername");
                        updateValue({ signUpUsername: v });
                    }}
                    value={values.signUpUsername}
                ></FullWidthInputWithLabel>
                <a
                    className="underline  text-xs text-black/50 dark:text-white/50 cursor-pointer"
                    onClick={() => {
                        setScreenStage(0);
                        useSignUpStore.setState({ isLogin: true });
                    }}
                >
                    I already have an account
                </a>
                <Button
                    text="Continue"
                    icon={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                            className="text-white dark:text-black"
                        >
                            <path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z" />
                        </svg>
                    }
                    iconAtRight={true}
                    isPrimary={true}
                    onClick={continueClicked}
                    additionalClasses="w-full"
                    absoluteCentering={true}
                    alignText={true}
                ></Button>
            </div>
            {OauthAvailable && (
                <div className="flex flex-col gap-3">
                    <SectionSeparator sectionName="OR"></SectionSeparator>
                    <div className="flex flex-col gap-2">
                        {/* OAuth 2 to be implemented */}
                        <Button
                            icon={GoogleIcon}
                            text="Continue with Google"
                            disabled={true}
                        ></Button>
                        <Button
                            icon={MicrosoftIcon}
                            text="Continue with Microsoft"
                            disabled={true}
                        ></Button>
                    </div>
                </div>
            )}
        </FadeUpLeaveUp>
    );
}

export function SignUpStage1() {
    const navigate = useNavigate();

    const updateValue = useSignUpStore((state) => state.updateValue);
    const values = useSignUpStore((state) => state.values);
    const setScreenStage = useSignUpStore((state) => state.setScreenStage);

    const formErrors = useSignUpStore((state) => state.formErrors);
    const forgive = useSignUpStore((state) => state.forgiveError);
    const updateError = useSignUpStore((state) => state.updateErrors);

    // input element refs
    const emailRef = useRef<HTMLInputElement | null>(null);
    const passwordRef = useRef<HTMLInputElement | null>(null);
    const confirmPasswordRef = useRef<HTMLInputElement | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const onSignUpClicked = async () => {
        // check each valid
        if (
            !emailRef.current ||
            !passwordRef.current ||
            !confirmPasswordRef.current
        )
            return;

        for (const k in formErrors) {
            console.log("Forgive:", k);
            forgive(k as keyof Errors);
        }

        const toUpdateErrors: Partial<Errors> = {};

        const emailValid =
            emailRef.current.value != "" && emailRef.current.checkValidity();
        if (!emailValid) {
            toUpdateErrors.signUpEmail = "Please enter a valid email address";
        }

        const passwordValid = passwordRef.current.value.length >= 8;
        if (!passwordValid) {
            toUpdateErrors.signUpPassword =
                "Password must be at least 8 characters long";
        }

        const confirmPasswordValid =
            passwordRef.current.value === confirmPasswordRef.current.value;
        if (!confirmPasswordValid) {
            toUpdateErrors.SignUpConfirmPassword = "Passwords do not match";
        }

        updateError(toUpdateErrors);

        if (!emailValid || !passwordValid || !confirmPasswordValid) return;

        const values = useSignUpStore.getState().values;

        setIsLoading(true);

        const success = await signUp(
            values.signUpUsername,
            values.signUpPassword,
            values.signUpEmail,
        );

        setIsLoading(false);
        if (success) {
            navigate("/auth?action=login");

            useSignUpStore.setState({ isLogin: true });
        }
    };

    return (
        <FadeUpLeaveUp className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 items-center">
                <h1 className="font-bold text-3xl tracking-tight">
                    Secure your Account
                </h1>

                <p className="opacity-50 text-center">
                    Choose a secure password for your account
                </p>
            </div>

            <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-black/75 dark:text-white/75">
                        Username
                    </label>
                    <div className="w-full flex items-center justify-between rounded-md">
                        <div className="w-full h-fit text-black/50 dark:text-white/50 px-2 py-2">
                            <span>{values.signUpUsername}</span>
                        </div>
                        <div className="flex gap-2 items-center cursor-pointer" onClick={() => {
                            setScreenStage(0);
                        }}>
                            <span className="text-sm underline text-black/50 dark:text-white/50">
                                Edit
                            </span>
                            <TransparentIconButton
                                icon={
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        height="20px"
                                        viewBox="0 -960 960 960"
                                        width="20px"
                                        fill="currentColor"
                                    >
                                        <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
                                    </svg>
                                }
                                filledIcon={
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        height="20px"
                                        viewBox="0 -960 960 960"
                                        width="20px"
                                        fill="currentColor"
                                    >
                                        <path d="M120-120v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm584-528 56-56-56-56-56 56 56 56Z" />
                                    </svg>
                                }
                            ></TransparentIconButton>
                        </div>
                    </div>
                </div>

                <FullWidthInputWithLabel
                    labelName="Email Address"
                    currentError={formErrors.signUpEmail}
                    type="email"
                    name="email"
                    placeholder="example@example.com"
                    onChange={(v) => updateValue({ signUpEmail: v })}
                    value={values.signUpEmail}
                    ref={emailRef}
                    disabled={isLoading}
                ></FullWidthInputWithLabel>
                <FullWidthInputWithLabel
                    labelName="Password"
                    currentError={formErrors.signUpPassword}
                    type="password"
                    name="password"
                    placeholder="At least 8 characters"
                    onChange={(v) => updateValue({ signUpPassword: v })}
                    value={values.signUpPassword}
                    ref={passwordRef}
                    disabled={isLoading}
                ></FullWidthInputWithLabel>
                <FullWidthInputWithLabel
                    labelName="Confirm Password"
                    currentError={formErrors.SignUpConfirmPassword}
                    type="password"
                    name="confirmPassword"
                    placeholder=""
                    onChange={(v) => updateValue({ SignUpConfirmPassword: v })}
                    value={values.SignUpConfirmPassword}
                    ref={confirmPasswordRef}
                    disabled={isLoading}
                ></FullWidthInputWithLabel>
            </div>

            <div className="flex flex-col gap-2">
                <LoadableButton
                    text="Create Account"
                    isLoading={isLoading}
                    isPrimary={true}
                    alignText={true}
                    absoluteCentering={true}
                    onClick={onSignUpClicked}
                ></LoadableButton>
                <Button
                    text="Go Back"
                    icon={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                        >
                            <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
                        </svg>
                    }
                    alignText={true}
                    absoluteCentering={true}
                    onClick={() => {
                        setScreenStage(0);
                    }}
                    disabled={isLoading}
                ></Button>
            </div>
        </FadeUpLeaveUp>
    );
}

export function SignUp() {
    // screen state
    const screenStage = useSignUpStore((state) => state.screenStage);

    return (
        <FadeUpLeaveUp className="flex flex-col gap-3" key="signup">
            <AnimatePresence mode="wait">
                {screenStage == 0 && <SignUpStage0></SignUpStage0>}
                {screenStage == 1 && <SignUpStage1></SignUpStage1>}
            </AnimatePresence>
        </FadeUpLeaveUp>
    );
}
