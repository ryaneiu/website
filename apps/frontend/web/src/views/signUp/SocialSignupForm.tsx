import { useEffect, useRef, useState } from "react";
import { LoadableButton } from "../../components/LoadableButton";
import { FullWidthInputWithLabel } from "../../components/FullWidthInput";
import { FadeUpLeaveUp } from "../../components/AnimatedPresenceDiv";
import { API_ENDPOINT } from "../../Config";
import { storeAccessToken, storeRefreshToken } from "../../auth/Authentication";
import { notifyErrorDefault } from "../../stores/NotificationsStore";
import { getUsernameError } from "./UsernameChecker";

/**
 * Shown after Google OAuth when the user needs to pick a username.
 * At this point NO user account exists — OAuthCompleteView deleted the
 * auto-created one. This POSTs the username and receives JWT tokens
 * that create the real account.
 */
export function SocialSignupForm() {
    const [username, setUsername] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const onSubmit = async () => {
        const trimmed = username.trim();
        if (!trimmed) {
            setError("Please enter a username.");
            return;
        }

        const usernameError = getUsernameError(trimmed);

        if (usernameError) {
            setError(usernameError);
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const response = await fetch(
                `${API_ENDPOINT}/api/auth/social-signup-complete/`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username: trimmed }),
                },
            );

            const data = await response.json();

            if (response.ok) {
                if (data.access) storeAccessToken(data.access);
                if (data.refresh) storeRefreshToken(data.refresh);
                window.location.replace("/");
            } else {
                const detail =
                    typeof data?.detail === "string"
                        ? data.detail
                        : "Something went wrong.";
                setError(detail);
                setIsLoading(false);
            }
        } catch {
            notifyErrorDefault("Couldn't reach the server. Is the backend running?");
            setIsLoading(false);
        }
    };

    // Pre-fill with a suggestion from the URL if provided by the backend adapter
    const params = new URLSearchParams(window.location.search);
    const suggestedUsername = params.get("suggested_username") || "";

    useEffect(() => {
        setUsername(suggestedUsername);
    }, [suggestedUsername]);
    
    return (
        <FadeUpLeaveUp>
            <div className="flex flex-col gap-3">
                <div>
                    <div className="text-lg font-semibold text-black dark:text-white transition-colors duration-300">
                        Choose your username
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400 transition-colors duration-300">
                        This is how others will see you on the forum.
                    </div>
                </div>


                <FullWidthInputWithLabel
                    ref={inputRef}
                    labelName="Username"
                    name="username"
                    type="text"
                    value={username || suggestedUsername}
                    currentError={error}
                    placeholder={suggestedUsername || "pick a username"}
                    onChange={(e) => {
                        setUsername(e);
                        if (error) setError("");
                    }}
                ></FullWidthInputWithLabel>

                <LoadableButton
                    text="Create Account"
                    isLoading={isLoading}
                    isPrimary={true}
                    alignText={true}
                    absoluteCentering={true}
                    additionalClasses="w-full"
                    onClick={onSubmit}
                ></LoadableButton>
            </div>
        </FadeUpLeaveUp>
    );
}
