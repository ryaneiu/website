
export function ErrorPage() {
    return <div className="w-full h-full items-center justify-center flex">
        <div className="px-4 py-4 flex flex-col gap-2">
            <h1 className="font-bold text-3xl text-black">An error occurred</h1>
            <span className="text-black text-md">See dev console for more information</span>
        </div>
    </div>
}