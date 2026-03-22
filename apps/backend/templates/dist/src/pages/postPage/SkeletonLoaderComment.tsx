import type { CommentType } from "./CommentType";

interface Props {
    comment: CommentType;
}

export function SkeletonLoaderComment(props: Props) {
    return (
        <div className="w-full flex flex-col gap-2 px-2 py-2">
            <details open>
                <summary className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                    <div className="w-6 h-6 rounded-full skeleton-loader"></div>
                    <span className="font-bold text-black w-24 skeleton-loader h-4 rounded-md"></span>
                </summary>
                <div className="ml-2 pl-2 relative mt-2">
                    <div
                        className="flex flex-col gap-2"
                    >
                        <div className="flex flex-col gap-1">
                            <span className="w-full skeleton-loader h-4 rounded-md"></span>
                            <span className="w-full skeleton-loader h-4 rounded-md"></span>
                            <span className="w-full skeleton-loader h-4 rounded-md"></span>
                            <span className="w-[35%] skeleton-loader h-4 rounded-md"></span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1 items-center">
                            <span className="w-6 h-6 rounded-full skeleton-loader rounded-full"></span>
                            <span className="w-9 h-3 rounded-md skeleton-loader rounded-md"></span>
                            </div>
                            <div className="flex gap-1 items-center">
                            <span className="w-6 h-6 rounded-full skeleton-loader rounded-full"></span>
                            <span className="w-16 h-3 rounded-md skeleton-loader rounded-md"></span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            {props.comment.subcomments.map((v) => {
                                return (
                                    <SkeletonLoaderComment
                                        comment={v}
                                    ></SkeletonLoaderComment>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </details>
        </div>
    );
}
