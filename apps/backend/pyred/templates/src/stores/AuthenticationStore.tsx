import { create } from "zustand";
import { API_ENDPOINT } from "../Config";
import { getStoredAccessToken, getStoredRefreshToken } from "../auth/Authentication";
import { notifyErrorDefault } from "./NotificationsStore";

interface AuthenticationStore {
    isLoggedIn: boolean;
    username: string;
    bio: string;
    profileImage: string;
    setLoggedIn: (v: boolean) => void;
    setProfile: (username: string, bio: string, profileImage: string) => void;
}

export const useAuthenticationStore = create<AuthenticationStore>((set) => {
    return {
        isLoggedIn: false,
        username: "",
        bio: "",
        profileImage: "",
        setLoggedIn: (v: boolean) => set({ isLoggedIn: v }),
        setProfile: (username: string, bio: string, profileImage: string) =>
            set({ username, bio, profileImage }),
    };
});

export async function fetchCurrentProfile() {
    try {
        const accessToken = await getStoredAccessToken();

        const response = await fetch(`${API_ENDPOINT}/api/profile/me/`, {
            method: "GET",
            credentials: "include",
            headers:
                accessToken != null
                    ? {
                          Authorization: `Bearer ${accessToken}`,
                      }
                    : {},
        });

        if (!response.ok) {
            return false;
        }

        const profile = await response.json();
        useAuthenticationStore.setState({
            username:
                typeof profile?.username === "string" ? profile.username : "",
            bio: typeof profile?.bio === "string" ? profile.bio : "",
            profileImage:
                typeof profile?.profile_image === "string"
                    ? profile.profile_image
                    : "",
        });
        return true;
    } catch {
        return false;
    }
}

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