
// Use same-origin in production, and backend :8001 while running Vite dev server

const hostname = window.location.hostname;
const port = window.location.port;
const isViteDevServer =
    (hostname === "localhost" || hostname === "127.0.0.1") &&
    (port === "5173" || port === "5174" || port === "4173");

export const API_ENDPOINT = isViteDevServer ? "http://127.0.0.1:8001" : "";