import { API_ENDPOINT } from "../Config";
import { notify, notifyErrorDefault, notifyWarningDefault } from "../stores/NotificationsStore";

let warnedAboutSecurity = false;

export function isDevelopmentMode() {
    const host = window.location.hostname;

    if (host === "localhost" || host === "127.0.0.1") {
        return true;
    } else {
        return false;
    }
}

function warnAboutSecurity() {
    alert("[ WARNING / SEVERE SECURITY VULNERABILITY ] :\nCookies are not used for storing refresh and access tokens! For production, you MUST make the backend use secure HTTP cookies to exchange tokens!\nThe current implementation without cookies is highly vulnerable to XSS & token stealing.");
    notifyWarningDefault("Severe Security Vulnerability detected");
}

export function getStoredRefreshToken() {
    if (isDevelopmentMode()) {
        const token = localStorage.getItem("refresh_token");

        console.warn("access to insecure local_storage refresh token used")

        if (!warnedAboutSecurity) {
            warnAboutSecurity();
            warnedAboutSecurity = true;
        }
        return token;
    } else {
        return null;
    }
}

export async function getStoredAccessToken() {

    // Allow storing accessToken in localStorage

    const token = localStorage.getItem("access_token");
    if (token) {
        const newToken = await refreshTokenIfNeeded(token);
        if (newToken) {
            console.log("Got new acc: ", newToken);
            return newToken;
        } else {
            return token;
        }
    }
    return token;
}

export function storeAccessToken(token: string) {
    localStorage.setItem("access_token", token);
}

export function storeRefreshToken(token: string) {
    if (isDevelopmentMode()) {
        if (!warnedAboutSecurity) {
            warnAboutSecurity();
            warnedAboutSecurity = true;
        }
        localStorage.setItem("refresh_token", token);
    } else {
        console.warn("refused request to store refresh token in production");
    }

}

function isJwtExpired(token: string): boolean {
    if (!token) return true;

    try {
        // JWT format: header.payload.signature
        const payloadBase64 = token.split('.')[1];
        if (!payloadBase64) return true;

        // Add padding if missing
        const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );

        const payload = JSON.parse(jsonPayload);
        if (!payload.exp) return true;

        // exp is in seconds since epoch
        const now = Math.floor(Date.now() / 1000);

        if (payload.exp > now) {
            console.log("time to expiry: ", payload.exp - now, "seconds");
        }

        return payload.exp < now;
    } catch (e) {
        console.error('Failed to parse JWT', e);
        return true; // treat invalid token as expired
    }
}

export async function refreshTokenIfNeeded(accessToken: string): Promise<string | undefined> {

    try {
        if (isJwtExpired(accessToken)) {
            console.log("token expired, refreshing");
            const refreshToken = getStoredRefreshToken();
            if (!refreshToken) {
                console.warn("No refresh token stored, not a development environment");
            }

            const response = await fetch(`${API_ENDPOINT}/token/refresh/`, {
                method: 'POST',
                headers: refreshToken != null ? {
                    "Content-Type": "application/json"
                } : {},
                body: refreshToken != null ? JSON.stringify({ refresh: refreshToken }) : null
            });
            if (response.status != 200) {

                // Attempt to read the response body
                try {
                    const text = await response.json();
                    const detail = text.detail;

                    if (detail) {
                        notifyErrorDefault("Failed to refresh token: " + detail);
                        console.error("Failed to refresh token: ", detail);
                    } else {
                        throw new Error("Failed to parse");
                    }
                } catch {
                    notifyErrorDefault("Failed to refresh token");
                    console.error("Failed to refresh token");
                }
            } else {
                // Refresh token OK

                const data = await response.json();
                const newAccessToken = data.access;
                storeAccessToken(newAccessToken);
                console.log("Access token OK");
                return newAccessToken;
            }
        } else {
            console.log("Access token not expired");
            return;
        }
    } catch (e) {
        console.error("Refresh token check failed: ", e);
        notifyErrorDefault("Failed to refresh token: " + e);
    }

}