import { useEffect, useMemo, useState, type ClipboardEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TransparentIconButton } from "../components/TransparentIconButton";
import { FadeUp } from "../components/AnimatedPresenceDiv";
import {
    notifyErrorDefault,
    notifySuccessDefault,
} from "../stores/NotificationsStore";
import { LoadableButton } from "../components/LoadableButton";
import { TextAreaInput } from "../components/TextAreaInput";
import { InputComponent } from "../components/InputComponent";
import { getStoredAccessToken } from "../auth/Authentication";
import { extractDetailFromErrorResponse } from "../Utils";
import { API_ENDPOINT } from "../Config";
import { Panel } from "../components/Panel";
import { Button } from "../components/Button";
import { BlurredImage } from "../components/BlurredImage";
import {
    appendAttachedImageToContent,
    extractImageReferenceFromClipboardData,
    normalizeAttachedImageUrl,
} from "../contentFilter";
import { useImageProgressStore } from "../stores/ImageEncodingProgress";
import { Progress } from "../stores/ImageEncodingProgressState";
import { canLoadImage, dataToAvif } from "../ImageProcessing";
import { postsStore } from "../stores/PostsStore";

export default function CreatePostView() {
    const navigate = useNavigate();
    const location = useLocation();
    const postLanguage = useMemo(() => {
        const queryLang = new URLSearchParams(location.search).get("lang");
        if (queryLang === "fr") {
            return "fr";
        }
        return location.pathname.startsWith("/fr") ? "fr" : "en";
    }, [location.pathname, location.search]);

    // Post state
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [subforums, setSubforums] = useState<
        { title: string; slug: string }[]
    >([]);
    const [selectedSubforum, setSelectedSubforum] = useState("general");
    const imagePreviewUrl = normalizeAttachedImageUrl(imageUrl);

    const [plublishingText, setPublishingText] =
        useState<string>("Publishing...");

    const onImagePaste = async (event: ClipboardEvent<HTMLInputElement>) => {
        const pastedImageUrl = await extractImageReferenceFromClipboardData(
            event.clipboardData,
        );
        if (pastedImageUrl == null) {
            return;
        }

        event.preventDefault();
        setImageUrl(pastedImageUrl);
    };

    const onContentPaste = async (
        event: ClipboardEvent<HTMLTextAreaElement>,
    ) => {
        const pastedImageUrl = await extractImageReferenceFromClipboardData(
            event.clipboardData,
        );
        if (pastedImageUrl == null) {
            return;
        }

        event.preventDefault();
        setImageUrl(pastedImageUrl);
    };

    useEffect(() => {
        fetch(`${API_ENDPOINT}/api/posts/subforums/`, { method: "GET", credentials: "omit"})
            .then(async (res) => {
                if (!res.ok) {
                    throw new Error("Failed to load subforums");
                }
                return res.json();
            })
            .then((data) => {
                const parsed = Array.isArray(data)
                    ? data.map((v) => ({ title: v.title, slug: v.slug }))
                    : [];
                const hasGeneral = parsed.some((v) => v.slug === "general");
                const merged = hasGeneral
                    ? parsed
                    : [{ title: "General", slug: "general" }, ...parsed];
                setSubforums(merged);
            })
            .catch(() => {
                setSubforums([{ title: "General", slug: "general" }]);
            });
    }, []);

    const onCloseView = () => {
        navigate(postLanguage === "fr" ? "/fr" : "/");
    };

    /* image encoding progress */
    const imageEncodingProgress = useImageProgressStore(
        (state) => state.progress,
    );

    useEffect(() => {
        switch (imageEncodingProgress) {
            case Progress.NONE:
                setPublishingText("Publishing...");
                break;
            case Progress.DOWNLOADING_ENCODER:
                setPublishingText("Downloading Encoder...");
                break;
            case Progress.PREPROCESSING:
                setPublishingText("Preprocessing...");
                break;
            case Progress.ENCODING:
                setPublishingText("Encoding...");
                break;
            default:
                setPublishingText("Publishing...");
        }
    }, [imageEncodingProgress]);

    const onPublishPost = async () => {
        try {
            const trimmedTitle = title.trim();
            const trimmedContent = content.trim();
            const normalizedImageUrl = imagePreviewUrl;
            const availableSubforumSlugs = new Set(
                subforums.map((v) => v.slug),
            );
            const chosenSubforum = availableSubforumSlugs.has(selectedSubforum)
                ? selectedSubforum
                : null;

            if (!trimmedTitle) {
                notifyErrorDefault("Please enter a title");
                return;
            }

            if (imageUrl.trim().length > 0 && normalizedImageUrl == null) {
                notifyErrorDefault(
                    "Please paste an image or enter a valid image URL",
                );
                return;
            }

            if (!normalizedImageUrl) {
                notifyErrorDefault("Please attach a valid image");
                setLoading(false);
                return;
            }

            setLoading(true);
            setPublishingText("Verifying source...");
            const loadable = await canLoadImage(normalizedImageUrl);

            if (!loadable) {
                notifyErrorDefault(
                    "Image source cannot be loaded, possibly due to cross-origin restrictions or the target image could not be found. Try copying the actual image instead of the image URL.",
                );
                setLoading(false);
                return;
            }

            setPublishingText("Publishing...");

            const encodedImage = await dataToAvif(normalizedImageUrl, true);

            console.log(
                "Size reduction from reencoding and compression: original: ",
                normalizedImageUrl.length,
                " new: ",
                encodedImage.length,
                " ratio: ",
                encodedImage.length / normalizedImageUrl.length,
            );

            const composedContent = appendAttachedImageToContent(
                trimmedContent,
                encodedImage,
            );

            if (!composedContent) {
                setLoading(false);
                notifyErrorDefault("Please enter content or attach an image");
                return;
            }

            try {
                const token = await getStoredAccessToken();
                if (!token) {
                    throw new Error("No access token");
                }

                const payload = {
                    title: trimmedTitle,
                    content: composedContent,
                    content_markdown: composedContent,
                    language: postLanguage,
                    ...(chosenSubforum ? { subforum: chosenSubforum } : {}),
                };

                const res = await fetch(`${API_ENDPOINT}/api/posts/create/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                    credentials: "omit"
                });

                if (!res.ok) {
                    // Try to extract detail field
                    const detail = await extractDetailFromErrorResponse(res);
                    if (detail) throw new Error(detail);
                    else
                        throw new Error(
                            "Failed to create post: " + res.statusText,
                        );
                }

                await res.json();

                notifySuccessDefault("Post created!");
                setTitle("");
                setContent("");
                setImageUrl("");
                postsStore.getState().forceUpdate();
                navigate(postLanguage === "fr" ? "/fr" : "/");
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : String(err);
                notifyErrorDefault(message);
            } finally {
                setLoading(false);
            }
        } catch (err) {
            console.error("Error during publishing: ", err);
            notifyErrorDefault("An error occurred during publishing")
            setLoading(false);
            return;
        }
    };

    const onCreateSubforum = async () => {
        const title = window.prompt("Subforum title")?.trim() ?? "";
        if (!title) return;
        const description =
            window.prompt("Subforum description (optional)")?.trim() ?? "";

        const token = await getStoredAccessToken();
        if (!token) {
            notifyErrorDefault("You need to be logged in to create a subforum");
            return;
        }

        const res = await fetch(`${API_ENDPOINT}/api/posts/subforums/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ title, description }),
            credentials: "omit"
        });

        if (!res.ok) {
            const detail = await extractDetailFromErrorResponse(res);
            notifyErrorDefault(detail ?? "Failed to create subforum");
            return;
        }

        const created = await res.json();
        const next = [
            ...subforums.filter((v) => v.slug !== created.slug),
            { title: created.title, slug: created.slug },
        ];
        setSubforums(next);
        setSelectedSubforum(created.slug);
        notifySuccessDefault("Subforum created!");
    };

    return (
        <FadeUp className="w-full h-[100vh] flex justify-center items-center dark:bg-zinc-900 text-black dark:text-white transition-colors duration-300">
            <Panel className="flex flex-col gap-3 items-center relative shadow-lg max-h-[95vh] overflow-auto bg-white dark:bg-zinc-800 h-fit transition-colors duration-300">
                {/* Close button */}
                <div className="absolute top-0 right-0 m-1">
                    <TransparentIconButton
                        onClick={onCloseView}
                        icon={
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="24px"
                                viewBox="0 -960 960 960"
                                width="24px"
                                fill="currentColor"
                            >
                                <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                            </svg>
                        }
                    />
                </div>

                <h1 className="text-3xl font-bold text-black dark:text-white transition-colors duration-300">
                    Create Post
                </h1>

                <div className="w-[90vw] sm:w-[80vw] md:w-[60vw] lg:w-[40vw] flex justify-between items-center gap-2">
                    <select
                        className="px-2 py-2 border border-black/15 dark:border-white/15 rounded-md w-full transition-colors duration-300"
                        value={selectedSubforum}
                        onChange={(e) => setSelectedSubforum(e.target.value)}
                        disabled={loading}
                    >
                        {subforums.map((subforum) => (
                            <option key={subforum.slug} value={subforum.slug}>
                                {subforum.title}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Title input */}
                <InputComponent
                    className="w-[90vw] sm:w-[80vw] md:w-[60vw] lg:w-[40vw]"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={loading}
                />

                <InputComponent
                    className="w-[90vw] sm:w-[80vw] md:w-[60vw] lg:w-[40vw]"
                    placeholder="Paste image or image URL (optional)"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onPaste={onImagePaste}
                    disabled={loading}
                />
                <p className="w-[90vw] sm:w-[80vw] md:w-[60vw] lg:w-[40vw] text-sm text-black/60 dark:text-white/60 transition-colors duration-300">
                    Copy an image and press Ctrl+V in the image field or post
                    content to attach it.
                </p>

                {imagePreviewUrl != null && (
                    <div className="w-[90vw] sm:w-[80vw] md:w-[60vw] lg:w-[40vw]">
                        <BlurredImage
                            src={imagePreviewUrl}
                            alt={title || "Attached image"}
                            isBlurred={false}
                        />
                    </div>
                )}

                {/* Content textarea */}
                <TextAreaInput
                    className="px-2 py-2 w-[90vw] sm:w-[80vw] md:w-[60vw] lg:w-[40vw] h-[50vh] rounded-md border border-black/15 dark:border-white/15 focus:outline-none focus:border-black/35 dark:focus:border-white/35 transition-colors duration-300"
                    placeholder="Your random thoughts... (paste images directly)"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onPaste={onContentPaste}
                    disabled={loading}
                ></TextAreaInput>

                <div className="w-full flex justify-between">
                    <Button
                        onClick={onCreateSubforum}
                        disabled={loading}
                        text={"Create Subforum"}
                    ></Button>
                    <LoadableButton
                        text={loading ? plublishingText : "Publish"}
                        isPrimary={true}
                        icon={
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="24px"
                                viewBox="0 -960 960 960"
                                width="24px"
                                fill="currentColor"
                            >
                                <path d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z" />
                            </svg>
                        }
                        iconAtRight={true}
                        onClick={onPublishPost}
                        isLoading={loading}
                        isWhiteSpinner={true}
                    />
                </div>
            </Panel>
        </FadeUp>
    );
}
