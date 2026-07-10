import { type ReactNode, useMemo, useState } from "react";
import { ReactionButton } from "../../components/ReactionButton";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { timeAgo } from "../../Utils";
import { useSelectedPostStore } from "../../stores/CurrentSelectedPostStore";
import { useLocation, useNavigate } from "react-router-dom";
import { MarkdownComponents } from "../../MarkdownComponents";
import clsx from "clsx";
import { LoadableButton } from "../../components/LoadableButton";
import { Panel } from "../../components/Panel";
import { getAppLanguageFromPath, localizePath } from "../../i18n";
import type { PostAttachment } from "../../stores/PostsStore";
import { API_ENDPOINT } from "../../Config";
import { ImageGrid } from "../../components/ImageGrid";
import { useAttachmentViewGoBackStore } from "../../stores/AttachmentViewGoBackStore";
import { resolveProfileImageInput } from "../../Utils";

const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/gi;
const DIRECT_IMAGE_URL_PATTERN =
    /(https?:\/\/[^\s]+?\.(?:png|jpe?g|gif|webp|avif))/gi;

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
    authorUsername?: string;
    authorBio?: string;
    authorDisplayName?: string;
    authorProfileImage?: string | null;
    hasLiked?: boolean;

    isInPostList: boolean;
    attachments: PostAttachment[];
}

type ImageGridImage = {
    width: number;
    height: number;
    src: string;
};

type MemoReturn = {
    imageStrings: ImageGridImage[];
    imageOriginal: string[];
};

export function Post(props: Props) {
    const [expanded, setExpanded] = useState(!props.isInPostList);
    // const [showAuthorBio, setShowAuthorBio] = useState(false);
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
    const language = getAppLanguageFromPath(window.location.pathname);
    const authorAvatarUrl = props.authorProfileImage
        ? resolveProfileImageInput(props.authorProfileImage)
        : null;

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

        navigate(localizePath(`/post/${props.id}`, language));
    };

    const postClasses = clsx(
        "flex flex gap-2 w-full",
        props.isInPostList && props.canDelete && "relative",
        props.isInPostList && "cursor-pointer",
    );

    const deleteButtons = props.isInPostList && props.canDelete ? [0] : [];

    const imageStrings: MemoReturn = useMemo(() => {
        const objs: ImageGridImage[] = [];
        const original: string[] = [];

        // New CAS attachment system
        for (const attachment of props.attachments) {
            original.push(attachment.object_id);
            objs.push({
                src: `${API_ENDPOINT}/objects/${attachment.object_id}.bin`,
                width: attachment.width,
                height: attachment.height,
            });
        }

        const seen: Set<string> = new Set();
        objs.forEach((v) => seen.add(v.src));
        const text = props.description;

        // Old posts: markdown images ![alt](url)
        let match;
        while ((match = MARKDOWN_IMAGE_PATTERN.exec(text)) !== null) {
            const url = match[1].trim();
            if (url && !seen.has(url)) {
                objs.push({ src: url, width: 0, height: 0 });
                seen.add(url);
                original.push(url);
            }
        }

        // Old posts: direct image URLs (e.g. https://...jpg)
        while ((match = DIRECT_IMAGE_URL_PATTERN.exec(text)) !== null) {
            const url = match[1].trim();
            if (url && !seen.has(url)) {
                objs.push({ src: url, width: 0, height: 0 });
                seen.add(url);
                original.push(url);
            }
        }

        console.log(original, objs);

        return {
            imageOriginal: original,
            imageStrings: objs,
        };
    }, [props.attachments, props.description]);

    const loc = useLocation();

    const imageClicked = (index: number) => {
        const target = imageStrings.imageStrings[index];
        if (
            !imageStrings.imageOriginal[index].startsWith("http") &&
            !imageStrings.imageOriginal[index].startsWith("data")
        ) {
            useAttachmentViewGoBackStore.setState({ goBackTo: loc.pathname });
            navigate(`/view/${props.attachments[index].object_id}`);
        } else {
            useAttachmentViewGoBackStore.setState({
                dataUrl: target.src,
                goBackTo: loc.pathname,
            });
            navigate("/view/data");
        }
    };

    return (
        <Panel
            as="article"
            aria-label="post"
            className={postClasses}
            onClick={onPostClicked}
            hoverable={props.isInPostList}
        >
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
                        text={
                            props.isDeleting
                                ? language === "fr"
                                    ? "Suppression..."
                                    : "Deleting..."
                                : language === "fr"
                                  ? "Supprimer"
                                  : "Delete"
                        }
                        onClick={() => props.onDeleteClick?.()}
                        isPrimary={true}
                        disabled={props.isDeleting}
                        additionalClasses="w-fit shadow-lg/20"
                        isLoading={props.isDeleting == true}
                    ></LoadableButton>
                </div>
            ))}
            <div>
                {authorAvatarUrl ? (
                    <img
                        src={authorAvatarUrl}
                        alt=""
                        className="w-12 h-12 min-w-12 min-h-12 rounded-full object-cover border border-black/15 dark:border-white/15"
                    />
                ) : (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill="currentColor"
                        className="w-12 h-12"
                    >
                        <path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm146.5-204.5Q340-521 340-580t40.5-99.5Q421-720 480-720t99.5 40.5Q620-639 620-580t-40.5 99.5Q539-440 480-440t-99.5-40.5ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm100-95.5q47-15.5 86-44.5-39-29-86-44.5T480-280q-53 0-100 15.5T294-220q39 29 86 44.5T480-160q53 0 100-15.5ZM523-537q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Zm-43-43Zm0 360Z" />
                    </svg>
                )}
            </div>
            <div className="flex flex-col gap-2">
                <div className="flex flex-col w-full">
                    <div className="flex gap-2 items-center">
                        <span className="font-bold">
                            {props.authorDisplayName
                                ? props.authorDisplayName
                                : props.authorUsername}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-black/50 dark:bg-white/50"></div>

                        <span className="text-black/50 dark:text-white/50">
                            u/{props.authorUsername}
                        </span>
                    </div>
                    <span className="text-black/50 dark:text-white/50 text-sm">
                        {timeAgo(props.created_at)}
                    </span>
                </div>

                <h1 className="text-3xl font-bold whitespace-pre-wrap break-all tracking-tight">
                    {needsTruncatedTitle && !expanded
                        ? truncatedTitle
                        : props.title}
                </h1>
                <div>
                    <ReactMarkdown
                        components={MarkdownComponents}
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                    >
                        {expanded ? descriptionWithoutImage : truncatedText}
                    </ReactMarkdown>
                    <ImageGrid
                        images={imageStrings.imageStrings}
                        onImageClick={imageClicked}
                    ></ImageGrid>
                    {needsExpandButton && props.isInPostList && (
                        <button
                            className="text-blue-600 hover:underline focus:outline-none cursor-pointer"
                            onClick={() => {
                                setExpanded(!expanded);
                            }}
                        >
                            {expanded
                                ? language === "fr"
                                    ? "Afficher moins"
                                    : "Show less"
                                : language === "fr"
                                  ? "Afficher plus"
                                  : "Show more"}
                        </button>
                    )}
                </div>

                {/*props.authorUsername && (
                <div className="flex items-center gap-2 text-sm text-black/70 dark:text-white/70 transition-colors duration-300">
                    {authorAvatarUrl ? (
                        <img
                            src={authorAvatarUrl}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover border border-black/15 dark:border-white/15"
                        />
                    ) : (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                            className="w-6 h-6"
                        >
                            <path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm146.5-204.5Q340-521 340-580t40.5-99.5Q421-720 480-720t99.5 40.5Q620-639 620-580t-40.5 99.5Q539-440 480-440t-99.5-40.5ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm100-95.5q47-15.5 86-44.5-39-29-86-44.5T480-280q-53 0-100 15.5T294-220q39 29 86 44.5T480-160q53 0 100-15.5ZM523-537q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Zm-43-43Zm0 360Z" />
                        </svg>
                    )}
                    {props.authorDisplayName ? (
                        <>
                            <span className="font-medium text-black/85 dark:text-white/85">{props.authorDisplayName}</span>
                            <span className="text-black/50 dark:text-white/50">u/{props.authorUsername}</span>
                        </>
                    ) : (
                        <span>u/{props.authorUsername}</span>
                    )}
                    <button
                        className="px-2 py-1 rounded-mb border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-300 cursor-pointer"
                        onClick={(event) => {
                            event.stopPropagation();
                            setShowAuthorBio((v) => !v);
                        }}
                    >
                        {showAuthorBio
                            ? language === "fr"
                                ? "Masquer la bio"
                                : "Hide bio"
                            : "Bio"}
                    </button>
                </div>
            )/*}
            {/*props.authorUsername && showAuthorBio && (
                <Panel className="w-full">
                    <p className="text-black/80 dark:text-white/80 transition-colors duration-300 whitespace-pre-wrap break-words">
                        {props.authorBio?.trim() ||
                            (language === "fr"
                                ? "Aucune bio pour cet utilisateur."
                                : "No bio available for this user.")}
                    </p>
                </Panel>
            )*/}

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

                <div className="flex gap-4 text-black/80 dark:text-white/80 mt-2">
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
                        isActive={props.hasLiked}
                        text={`${props.votes ?? 0}`}
                        onClick={(e) => {
                            if (props.onLikeClick) {
                                e.stopPropagation();
                                props.onLikeClick?.();
                            }
                        }}
                        fillColorText="text-red-400"
                        fillColorBg="bg-red-400"
                        heartButton={true}
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
                                <path d="M880-80 720-240H160q-33 0-56.5-23.5T80-320v-480q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v720ZM160-320h594l46 45v-525H160v480Zm0 0v-480 480Z" />
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
                                <path d="M160-240q-33 0-56.5-23.5T80-320v-480q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v720L720-240H160Z" />
                            </svg>
                        }
                        interactable={false}
                        text={`${props.commentsCount ?? 0}`}
                        fillColorText="text-blue-400"
                        fillColorBg="bg-blue-400"
                    ></ReactionButton>
                </div>
            </div>
        </Panel>
    );
}
