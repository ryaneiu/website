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
            <h1 className="text-3xl font-bold tracking-tight w-full text-center">
                Sign Up
            </h1>

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
            <div className="flex flex-col gap-3">
                <SectionSeparator sectionName="OR"></SectionSeparator>
                <div className="flex flex-col gap-2">
                    {/* OAuth 2 to be implemented */}
                    <Button
                        icon={GoogleIcon}
                        text=""
                        disabled={true}
                        content={
                            <div className="flex flex-col items-start">
                                <span className="font-semibold">Continue with Google</span>
                                <span className="font-normal text-xs opacity-50">Not available yet</span>
                            </div>
                        }
                    ></Button>
                    <Button
                        icon={MicrosoftIcon}
                        text=""
                        disabled={true}
                        content={
                            <div className="flex flex-col items-start">
                                <span className="font-semibold">Continue with Microsoft</span>
                                <span className="font-normal text-xs opacity-50">Not available yet</span>
                            </div>
                        }
                    ></Button>
                </div>
            </div>
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
            <div className="flex flex-col gap-2">
                <h1 className="font-bold text-3xl tracking-tight">
                    Create your account
                </h1>

                <p className="opacity-50 w-full text-center">
                    Choose a secure password.
                </p>
            </div>

            <div className="flex flex-col gap-3">
                <FullWidthInputWithLabel
                    labelName="Username"
                    currentError=""
                    type="text"
                    name=""
                    placeholder=""
                    disabled={true}
                    value={values.signUpUsername}
                ></FullWidthInputWithLabel>

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
                    text="Sign Up"
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
