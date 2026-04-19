import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";

if (import.meta.env.DEV) {
    const originalInfo = console.info;
    console.info = (...args: unknown[]) => {
        const firstArg = args[0];
        if (
            typeof firstArg === "string" &&
            firstArg.includes(
                "Download the React DevTools for a better development experience",
            )
        ) {
            return;
        }
        originalInfo(...args);
    };
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </StrictMode>,
);

import("@sentry/react").then((Sentry) => {
    Sentry.init({
        dsn: "https://83d875c6a66079c9ed6d72baaf67da79@o4511244451512320.ingest.us.sentry.io/4511244452429824",
        sendDefaultPii: true,
        tracesSampleRate: 1.0,
        tracePropagationTargets: [
            "localhost",
            /^https:\/\/(www\.)?lt-forum\.ca\/api/,
        ],
    });
});