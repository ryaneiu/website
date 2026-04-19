import { storeAccessToken, storeRefreshToken } from "../../auth/Authentication";
import { API_ENDPOINT } from "../../Config";
import { useAuthenticationStore } from "../../stores/AuthenticationStore";
import { notify, notifyErrorDefault, notifySuccessDefault } from "../../stores/NotificationsStore";

export async function signUp(username: string, password: string, email: string) {
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

export async function login(username: string, password: string): Promise<boolean> {
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
