import { create } from "zustand";
import { API_ENDPOINT } from "../Config";
import { getStoredRefreshToken } from "../auth/Authentication";
import { notifyErrorDefault } from "./NotificationsStore";

interface AuthenticationStore {
    isLoggedIn: boolean;
    setLoggedIn: (v: boolean) => void;
}

export const useAuthenticationStore = create<AuthenticationStore>((set) => {
    return {
        isLoggedIn: false,
        setLoggedIn: (v: boolean) => set({ isLoggedIn: v }),
    };
});

export async function verifyIsLoggedIn() {
    // Very crude way to check if a user is logged in
    // DO NOT USE IN PRODUCTION, NEED A MORE STABLE WAY TO CHECK (a real API), BUT WORKS FOR NOW

    try {
        const refreshToken = getStoredRefreshToken();

        const response = await fetch(`${API_ENDPOINT}/token/refresh/`, {
            method: "POST",
            credentials: "include",
            body:
                refreshToken != null
                    ? JSON.stringify({
                          refresh: refreshToken,
                      })
                    : null,
            headers:
                refreshToken != null
                    ? {
                          "Content-Type": "application/json",
                      }
                    : {},
        });

        if (response.status === 401 || response.status === 403) {
            try {
                const body = await response.json();
                const detail =
                    typeof body?.detail === "string" ? body.detail : "";
                if (detail.toLowerCase().includes("email")) {
                    notifyErrorDefault(detail);
                }
            } catch {
                // ignore parsing errors
            }

            return false;
        }

        return response.ok;
    } catch (e) {
        console.error("Failed to check session status: ", e);
        if (e instanceof TypeError) {
            notifyErrorDefault("Couldn't contact auth server. Is backend running?");
            return false;
        }
        notifyErrorDefault("Couldn't contact server to check session status: " + e);
        return false;
    }
}