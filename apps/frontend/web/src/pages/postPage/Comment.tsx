import ReactMarkdown from "react-markdown";
import { MarkdownComponents } from "../../MarkdownComponents";
import { ReactionButton } from "../../components/ReactionButton";
import type { CommentType } from "./CommentType";
import { useRef, useState } from "react";
import { CommentReplySection } from "./CommentReplySection";

interface Props {
    comment: CommentType;
}

export function Comment(props: Props) {
    const commentContentRef = useRef<HTMLDivElement>(null);

    const [replying, setReplying] = useState<boolean>(false);

    const onReplyClicked = () => {
        /* Called when reply is clicked 
        
        You probably need more logic to keep track of input (ref) and comment ID (requiring React stores) so you can
        tell the server which comment you are replying to.
        */

        alert("Not implemented");
        
    }

    return (
        <div className="w-full flex flex-col gap-2 px-2 py-2">
            <details open>
                <summary className="flex items-center gap-2">
                    <div>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="#1f1f1f"
                        >
                            <path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm146.5-204.5Q340-521 340-580t40.5-99.5Q421-720 480-720t99.5 40.5Q620-639 620-580t-40.5 99.5Q539-440 480-440t-99.5-40.5ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm100-95.5q47-15.5 86-44.5-39-29-86-44.5T480-280q-53 0-100 15.5T294-220q39 29 86 44.5T480-160q53 0 100-15.5ZM523-537q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Zm-43-43Zm0 360Z" />
                        </svg>
                    </div>
                    <span className="font-bold text-black">
                        {props.comment.author}
                    </span>
                </summary>
                <div className="ml-2 pl-2 relative">
                    <div className="absolute left-0 top-0 w-[1px] bg-black/20 h-full"></div>
                    <div
                        className="flex flex-col gap-2"
                        ref={commentContentRef}
                    >
                        <ReactMarkdown components={MarkdownComponents}>
                            {props.comment.description}
                        </ReactMarkdown>
                        <div className="flex items-center gap-3">
                            <ReactionButton
                                icon={
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        height="24px"
                                        viewBox="0 -960 960 960"
                                        width="24px"
                                        fill="#1f1f1f"
                                    >
                                        <path d="m480-120-58-52q-101-91-167-157T150-447.5Q111-500 95.5-544T80-634q0-94 63-157t157-63q52 0 99 22t81 62q34-40 81-62t99-22q94 0 157 63t63 157q0 46-15.5 90T810-447.5Q771-395 705-329T538-172l-58 52Zm0-108q96-86 158-147.5t98-107q36-45.5 50-81t14-70.5q0-60-40-100t-100-40q-47 0-87 26.5T518-680h-76q-15-41-55-67.5T300-774q-60 0-100 40t-40 100q0 35 14 70.5t50 81q36 45.5 98 107T480-228Zm0-273Z" />
                                    </svg>
                                }
                                iconFilled={
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        height="24px"
                                        viewBox="0 -960 960 960"
                                        width="24px"
                                        fill="#1f1f1f"
                                    >
                                        <path d="m480-120-58-52q-101-91-167-157T150-447.5Q111-500 95.5-544T80-634q0-94 63-157t157-63q52 0 99 22t81 62q34-40 81-62t99-22q94 0 157 63t63 157q0 46-15.5 90T810-447.5Q771-395 705-329T538-172l-58 52Z" />
                                    </svg>
                                }
                                interactable={true}
                                text={"0"}
                            ></ReactionButton>

                            <ReactionButton
                                icon={
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        height="24px"
                                        viewBox="0 -960 960 960"
                                        width="24px"
                                        fill="#1f1f1f"
                                    >
                                        <path d="M440-400h80v-120h120v-80H520v-120h-80v120H320v80h120v120ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z" />
                                    </svg>
                                }
                                iconFilled={
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        height="24px"
                                        viewBox="0 -960 960 960"
                                        width="24px"
                                        fill="#1f1f1f"
                                    >
                                        <path d="M440-400h80v-120h120v-80H520v-120h-80v120H320v80h120v120ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Z" />
                                    </svg>
                                }
                                interactable={true}
                                text="Reply"
                                onClick={() => {
                                    setReplying(true);
                                }}
                            ></ReactionButton>
                        </div>

                        {replying && (
                            <CommentReplySection onReplyClicked={onReplyClicked} comment={props.comment} setVisible={setReplying}></CommentReplySection>
                        )}

                        <div className="flex flex-col gap-2">
                            {props.comment.subcomments.map((v) => {
                                return <Comment comment={v}></Comment>;
                            })}
                        </div>
                    </div>
                </div>
            </details>
        </div>
    );
}
