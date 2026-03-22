
export function PostSkeletonLoader() {

    return (
        <div className="flex flex-col gap-2 bg-white border border-black/15 p-4 rounded-md w-full shadow-md skeleton-loader-no-anim">
            <h1 className="text-3xl font-bold whitespace-pre-wrap w-[85%] h-6 break-all skeleton-loader rounded-md mb-2"></h1>
            <div>
                <div className="flex flex-col gap-1">
                    <span className="w-full h-4 skeleton-loader rounded-md"></span>
                    <span className="w-full h-4 skeleton-loader rounded-md"></span>
                    <span className="w-full h-4 skeleton-loader rounded-md"></span>
                    <span className="w-[35%] h-4 skeleton-loader rounded-md"></span>
                    
                </div>
            </div>

            <div className="flex gap-2 items-center">
                <span className="w-6 h-6 rounded-full skeleton-loader"></span>
                <span className="w-12 h-3 rounded-md skeleton-loader"></span>
                <span className="w-6 h-6 rounded-full skeleton-loader"></span>
                <span className="w-12 h-3 rounded-md skeleton-loader"></span>
            </div>
            <span className="text-black/50 text-sm skeleton-loader w-8">
            </span>
        </div>
    );
}
