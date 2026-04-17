import { type ReactNode, useState } from "react";
import { ReactionButton } from "../../components/ReactionButton";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { timeAgo } from "../../Utils";
import { useSelectedPostStore } from "../../stores/CurrentSelectedPostStore";
import { useNavigate } from "react-router-dom";
import { MarkdownComponents } from "../../MarkdownComponents";
import clsx from "clsx";
import { LoadableButton } from "../../components/LoadableButton";
import { Panel } from "../../components/Panel";
import type { PostImage } from "../../contentFilter";
import { BlurredImage } from "../../components/BlurredImage";

const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/gi;

interface Props {
    title: string;
    description: string;
    created_at: string;
    votes: number;
    commentsCount?: number;
    id: number;
    onLikeClick?: () => void;
    onDeleteClick?: () => void;
    canDelete?: boolean;
    isDeleting?: boolean;
    subforumText?: string;
    subforumControl?: ReactNode;
    image?: PostImage | null;

    isInPostList: boolean;
}

export function Post(props: Props) {
    const [expanded, setExpanded] = useState(!props.isInPostList);
    const descriptionWithoutImage = props.description
        .replace(MARKDOWN_IMAGE_PATTERN, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    const needsExpandButton = descriptionWithoutImage.length > 500;
    const needsTruncatedTitle = props.title.length > 100;
    const truncatedText = needsExpandButton
        ? `${descriptionWithoutImage.slice(0, 500)}...`
        : descriptionWithoutImage;
    const truncatedTitle = needsTruncatedTitle
        ? `${props.title.slice(0, 100)}...`
        : props.title;

    const navigate = useNavigate();

    const onPostClicked = () => {
        if (!props.isInPostList) return;
        useSelectedPostStore.setState({
            title: props.title,
            description: props.description,
            publishedTime: props.created_at,
            selectedAny: true,
            likes: props.votes,
            comments: props.commentsCount ?? 0,
            postId: props.id,
        });

        navigate(`/post/${props.id}`);
    };

    const postClasses = clsx(
        "flex flex-col gap-2 w-full",
        props.isInPostList && props.canDelete && "relative pr-44",
        props.isInPostList && "cursor-pointer"
    );

    const deleteButtons = props.isInPostList && props.canDelete ? [0] : [];

    return (
        <Panel as="article" aria-label="post" className={postClasses} onClick={onPostClicked} hoverable={props.isInPostList}>
            {deleteButtons.map((deleteButtonIndex) => (
                <div
                    key={deleteButtonIndex}
                    className="absolute top-4 right-4"
                    onClick={(e) => e.stopPropagation()}
                >
                    <LoadableButton
                        icon={
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="24px"
                                viewBox="0 -960 960 960"
                                width="24px"
                                fill="currentColor"
                                className="text-white dark:text-black transition-colors duration-300"
                            >
                                <path d="M280-120q-33 0-56.5-23.5T200-200v-560h-40v-80h200v-40h240v40h200v80h-40v560q0 33-23.5 56.5T680-120H280Zm400-640H280v560h400v-560ZM360-280h80v-400h-80v400Zm160 0h80v-400h-80v400ZM280-760v560-560Z" />
                            </svg>
                        }
                        text={props.isDeleting ? "Deleting..." : "Delete"}
                        onClick={() => props.onDeleteClick?.()}
                        isPrimary={true}
                        disabled={props.isDeleting}
                        additionalClasses="w-fit shadow-lg/20"
                        isLoading={props.isDeleting == true}
                    ></LoadableButton>
                </div>
            ))}
            <h1 className="text-3xl font-bold whitespace-pre-wrap break-all">
                {needsTruncatedTitle && !expanded
                    ? truncatedTitle
                    : props.title}
            </h1>
            <div>
                <ReactMarkdown
                    components={MarkdownComponents}
                    remarkPlugins={[remarkGfm]}
                >
                    {expanded ? descriptionWithoutImage : truncatedText}
                </ReactMarkdown>
                {props.image != null && (
                    <BlurredImage
                        src={props.image.url}
                        alt={props.title}
                        isBlurred={props.image.isBlurred}
                    />
                )}
                {needsExpandButton && props.isInPostList && (
                    <button
                        className="text-blue-600 hover:underline focus:outline-none cursor-pointer"
                        onClick={() => {
                            setExpanded(!expanded);
                        }}
                    >
                        {expanded ? "Show less" : "Show more"}
                    </button>
                )}
            </div>

            {!props.isInPostList &&
                (props.subforumText || props.subforumControl) && (
                    <div className="flex flex-wrap items-center gap-2">
                        {props.subforumText && (
                            <span className="text-black/60 dark:text-white/60 text-sm transition-colors duration-300">
                                {props.subforumText}
                            </span>
                        )}
                        {props.subforumControl}
                    </div>
                )}

            <div className="flex gap-2">
                <ReactionButton
                    icon={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
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
                            fill="currentColor"
                        >
                            <path d="m480-120-58-52q-101-91-167-157T150-447.5Q111-500 95.5-544T80-634q0-94 63-157t157-63q52 0 99 22t81 62q34-40 81-62t99-22q94 0 157 63t63 157q0 46-15.5 90T810-447.5Q771-395 705-329T538-172l-58 52Z" />
                        </svg>
                    }
                    interactable={true}
                    text={`${props.votes ?? 0}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        props.onLikeClick?.();
                    }}
                ></ReactionButton>
                <ReactionButton
                    icon={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                        >
                            <path d="M240-400h480v-80H240v80Zm0-120h480v-80H240v80Zm0-120h480v-80H240v80ZM880-80 720-240H160q-33 0-56.5-23.5T80-320v-480q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v720ZM160-320h594l46 45v-525H160v480Zm0 0v-480 480Z" />
                        </svg>
                    }
                    iconFilled={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                        >
                            <path d="M240-400h480v-80H240v80Zm0-120h480v-80H240v80Zm0-120h480v-80H240v80ZM880-80 720-240H160q-33 0-56.5-23.5T80-320v-480q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v720ZM160-320h594l46 45v-525H160v480Zm0 0v-480 480Z" />
                        </svg>
                    }
                    interactable={false}
                    text={`${props.commentsCount ?? 0}`}
                ></ReactionButton>
            </div>
            <span className="text-black/50 dark:text-white/50 text-sm transition-colors duration-300">
                Posted {timeAgo(props.created_at)}
            </span>
        </Panel>
    );
}
