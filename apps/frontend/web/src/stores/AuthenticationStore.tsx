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
    if (refreshToken == null) {
        return false;
    }


    const response = await fetch(`${API_ENDPOINT}/token/refresh`, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
            refresh: refreshToken
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    return response.status != 401 && response.status != 403;
    } catch (e) {
        console.error("Failed to check session status: ", e);
        notifyErrorDefault("Couldn't contact server to check session status: " + e);
    }


}