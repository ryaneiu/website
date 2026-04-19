import { Panel } from "../../components/Panel";

export function SubforumSkeletonLoader() {
    return (
        <Panel className="flex flex-col gap-2 skeleton-loader-no-anim">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col gap-3 w-full">
                    <div className="flex flex-col gap-1 w-full">
                        <div className="rounded-md w-full h-6 skeleton-loader"></div>
                        <div className="rounded-md h-4 w-[75%] skeleton-loader"></div>
                    </div>

                    <div className="rounded-md w-12 h-3 skeleton-loader"></div>
                </div>
            </div>
        </Panel>
    );
}
