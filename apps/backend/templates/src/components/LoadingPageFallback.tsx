import { Spinner } from "./SimpleSpinner";

export function LoadingPageFallback() {
    return <div className="w-full h-full flex items-center justify-center">
        <Spinner></Spinner>
    </div>
}

export function LoadingPageFallbackFS() {
    return <div className="w-[100vw] h-[100vh] flex items-center justify-center">
        <Spinner></Spinner>
    </div>
}