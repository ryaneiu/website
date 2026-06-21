import {
    useEffect,
    useMemo,
    useState,
    type ClipboardEvent,
} from "react";
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
import {
    extractImageReferenceFromClipboardData,
    normalizeAttachedImageUrl,
} from "../contentFilter";
import { useImageProgressStore } from "../stores/ImageEncodingProgress";
import { Progress } from "../stores/ImageEncodingProgressState";
import { dataToAvif, terminateWorker } from "../ImageProcessing";
import { postsStore } from "../stores/PostsStore";
import clsx from "clsx";
import { Spinner } from "../components/SimpleSpinner";

let nextId = 0;

function nextAttachmentId(): number {
    return ++nextId;
}

type Attachment = {
    id: number;
    previewUrl: string;
    encodedData: Blob | null;
    attachmentType: "image" | "video" | "gif";
    processingComplete: boolean;
};

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
    const [attachments, setAttachments] = useState<Attachment[]>([]);

    const updateAttachment = (id: number, updater: (prev: Attachment) => Attachment) => {
        setAttachments((prev) =>
            prev.map((a) => (a.id === id ? updater(a) : a)),
        );
    };

    const deleteAttachment = (id: number) => {
        setAttachments((prev) => {
            const idx = prev.findIndex((a) => a.id === id);
            if (idx === -1) return prev;
            const copy = [...prev];
            copy.splice(idx, 1);
            return copy;
        });
    };

    const insertAttachment = (attachment: Attachment) => {
        setAttachments((prev) => [...prev, attachment]);
    };

    const [loading, setLoading] = useState(false);
    const [subforums, setSubforums] = useState<
        { title: string; slug: string }[]
    >([]);
    const [selectedSubforum, setSelectedSubforum] = useState("general");
    // const imagePreviewUrl = normalizeAttachedImageUrl(imageUrl);

    const [plublishingText, setPublishingText] =
        useState<string>("Publishing...");

    const processImage = async (attachmentId: number, previewUrl: string) => {
        const ownImagePreviewUrl =
            normalizeAttachedImageUrl(previewUrl) ?? "";

        // Not a data URL — nothing to encode
        if (!ownImagePreviewUrl.startsWith("data:image/")) {
            updateAttachment(attachmentId, (a) => ({
                ...a,
                processingComplete: true,
            }));
            return;
        }

        console.log("Starting encoding for", attachmentId);

        try {
            const result: string = await dataToAvif(ownImagePreviewUrl);

            console.log("Task successful for", attachmentId);

            const blob = dataUrlToBlob(result);

            updateAttachment(attachmentId, (a) => ({
                ...a,
                encodedData: blob,
                processingComplete: true,
            }));

            console.log(
                "Size reduction from compression: ",
                ownImagePreviewUrl.length,
                result.length,
                result.length / ownImagePreviewUrl.length,
            );
        } catch (e) {
            console.error("encoding failed for", attachmentId, ":", e);

            notifyErrorDefault(
                "Failed to process your image. Please try another image.",
            );
            deleteAttachment(attachmentId);
        }
    };

    const dataUrlToBlob = (dataUrl: string): Blob => {
        const [header, base64Data] = dataUrl.split(",");
        // Extract mime type (e.g., image/avif)
        const mimeMatch = header.match(/:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : "image/avif";

        // Decode base64 string
        const byteCharacters = atob(base64Data);
        const byteArrays = [];

        // Process in chunks for better performance
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            byteArrays.push(new Uint8Array(byteNumbers));
        }

        return new Blob(byteArrays, { type: mimeType });
    };

    /* const onImagePaste = async (event: ClipboardEvent<HTMLInputElement>) => {
        const pastedImageUrl = await extractImageReferenceFromClipboardData(
            event.clipboardData,
        );
        if (pastedImageUrl == null) {
            return;
        }

        event.preventDefault();

        const id = nextAttachmentId();
        const newAttachment: Attachment = {
            id,
            attachmentType: "image",
            encodedData: null,
            previewUrl: pastedImageUrl,
            processingComplete: false,
        };

        insertAttachment(newAttachment);
        await processImage(id, pastedImageUrl);
    }; */

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

        const id = nextAttachmentId();
        const newAttachment: Attachment = {
            id,
            attachmentType: "image",
            encodedData: null,
            previewUrl: pastedImageUrl,
            processingComplete: false,
        };

        insertAttachment(newAttachment);
        await processImage(id, pastedImageUrl);
    };

    // Cleanup singleton worker on unmount
    useEffect(() => {
        return () => {
            terminateWorker();
        };
    }, []);

    useEffect(() => {
        fetch(`${API_ENDPOINT}/api/posts/subforums/list`, {
            method: "GET",
            credentials: "omit",
        })
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

    /* const uploadImage = async (dataUrl: string, token: string) => {
        const blob = dataUrlToBlob(dataUrl);
        const formData = new FormData();
        formData.append("file", blob, "upload.avif");

        const response = await fetch(`${API_ENDPOINT}/api/objects/upload`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const detail = await extractDetailFromErrorResponse(response);
            if (!detail) {
                throw new Error("Failed to upload the image!");
            }
            throw new Error(detail);
        }

        const result = await response.json();
        console.log("Download this later at:", result.file_url);

        return result.file_url as string;
    }; */

    const onPublishPost = async () => {
        try {
            const trimmedTitle = title.trim();
            const trimmedContent = content.trim();
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

            // Check if attachments are still processing

            let complete = true;
            for (const attachment of attachments) {
                if (!attachment.processingComplete) {
                    complete = false;
                    break;
                }
            }

            if (!complete) {
                notifyErrorDefault(
                    "Please wait for all attachments to finish processing!",
                );
                return;
            }

            /* if (imageUrl.trim().length > 0 && processedImage == null) {
                notifyErrorDefault(
                    "Please paste an image or enter a valid image URL",
                );
                return;
            }

            if (!processedImage) {
                notifyErrorDefault("Please attach a valid image");
                setLoading(false);
                return;
            } */

            setLoading(true);

            setPublishingText("Creating post...");

            const composedContent = trimmedContent;

            if (!composedContent) {
                setLoading(false);
                notifyErrorDefault("Please enter content");
                return;
            }

            try {
                const token = await getStoredAccessToken();
                if (!token) {
                    throw new Error("No access token");
                }

                const attachmentsPayload = [];
                for (const attachment of attachments) {
                    attachmentsPayload.push({
                        type: attachment.attachmentType,
                    });
                }

                const payload = {
                    title: trimmedTitle,
                    content: composedContent,
                    content_markdown: composedContent,
                    language: postLanguage,
                    attachments: attachmentsPayload,
                    ...(chosenSubforum ? { subforum: chosenSubforum } : {}),
                };

                setPublishingText("Creating post...");

                const res = await fetch(`${API_ENDPOINT}/api/posts/create/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                    credentials: "omit",
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

                const response = await res.json();
                // now extract

                const attachmentUploadTokens = response.upload_attachments;
                if (!attachmentUploadTokens) {
                    throw new Error("Invalid response returned by server");
                }

                const postData = response.post;
                if (!postData) {
                    throw new Error("No post data");
                }

                const postId = postData.id;
                if (postId == null) {
                    throw new Error("No Post ID");
                }

                // each one should have a type value

                const typesUploadTokens: Map<string, string[]> = new Map();
                for (const uploadToken of attachmentUploadTokens) {
                    console.log(uploadToken);
                    const req = uploadToken.request;
                    if (!req) {
                        throw new Error("No request");
                    }

                    const type: string = req.type;
                    if (!type) {
                        throw new Error("No type field under upload token");
                    }
                    const token: string = uploadToken.token;
                    if (!token) {
                        throw new Error("No token for upload token");
                    }

                    if (typesUploadTokens.get(type) == null) {
                        typesUploadTokens.set(type, []);
                    }

                    const arr = typesUploadTokens.get(type)!;
                    arr.push(token);
                }

                setPublishingText("Uploading attachments...");

                for (const attachment of attachments) {
                    if (!attachment.encodedData) {
                        throw new Error(
                            "Attachment did not finish processing; no blob stored",
                        );
                    }

                    // retrieve one type
                    const uploadTokensType = typesUploadTokens.get(
                        attachment.attachmentType,
                    );
                    if (!uploadTokensType) {
                        throw new Error(
                            `No upload token for attachment type: ${attachment.attachmentType}`,
                        );
                    }

                    if (uploadTokensType.length == 0) {
                        throw new Error(
                            `No more tokens for attachment type: ${attachment.attachmentType} available`,
                        );
                    }

                    const oneToken = uploadTokensType.pop()!;
                    typesUploadTokens.set(
                        attachment.attachmentType,
                        uploadTokensType,
                    );

                    // try uplaoding it
                    try {
                        const formData = new FormData();
                        formData.append(
                            "file",
                            attachment.encodedData,
                            "upload.bin",
                        );

                        const response = await fetch(
                            `${API_ENDPOINT}/api/posts/attachment/upload`,
                            {
                                method: "POST",
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    "X-Upload-Token": oneToken,
                                },
                                body: formData,
                            },
                        );

                        if (!response.ok) {
                            const detail =
                                await extractDetailFromErrorResponse(response);

                            throw new Error(
                                `Failed to upload attachment: ${detail}`,
                            );
                        }

                        console.log("Attachment uploaded successfully");
                    } catch (e) {
                        throw new Error(`Upload failed: ${e}`);
                    }
                }

                setPublishingText("Publishing...");
                // Now publish it
                try {
                    const response = await fetch(
                        `${API_ENDPOINT}/api/posts/publish/${postId}/`,
                        {
                            method: "PUT",
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        },
                    );
                    if (!response.ok) {
                        const detail =
                            await extractDetailFromErrorResponse(response);
                        throw new Error(`Failed to publish: ${detail}`);
                    }
                } catch (e) {
                    throw new Error(`Publish failed: ${e}`);
                }

                notifySuccessDefault("Post created!");
                setTitle("");
                setContent("");
                setAttachments([]);
                terminateWorker();
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
            notifyErrorDefault("An error occurred during publishing");
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
            credentials: "omit",
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

    const imageClassesEncoding = clsx(
        "blur-sm brightness-50 scale-105",
        "rounded-md duration-500 ease-in-out max-h-[40vh]",
    );

    const imageClassesNormal = clsx(
        "blur-0 brightness-100 scale-100",
        "rounded-md duration-500 ease-in-out max-h-[40vh]",
    );

    return (
        <FadeUp className="w-full h-[100vh] flex justify-center items-center dark:bg-zinc-900 text-black dark:text-white transition-colors duration-300">
            <Panel className="flex flex-col gap-3 items-center relative shadow-lg max-h-[95vh] overflow-y-auto bg-white dark:bg-zinc-800 h-fit transition-colors duration-300">
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

                <div className="flex flex-col gap-3 w-full h-fit">
                    {attachments.map((attachment) => {
                        return (
                            <div key={attachment.id} className="w-[90vw] sm:w-[80vw] md:w-[60vw] lg:w-[40vw] relative">
                                <div className="flex flex-col items-center">
                                    <div className="w-fit h-fit overflow-hidden rounded-md flex">
                                        <img
                                            className={
                                                attachment.processingComplete
                                                    ? imageClassesNormal
                                                    : imageClassesEncoding
                                            }
                                            src={attachment.previewUrl}
                                            alt="Attached Image"
                                        ></img>
                                    </div>
                                </div>

                                {!attachment.processingComplete && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex justify-center items-center pointer-events-none">
                                        <div className="flex flex-col gap-3 items-center">
                                            <Spinner
                                                isWhite={true}
                                                alwaysWhite={true}
                                            />
                                            <div className="flex flex-col text-white items-center">
                                                <span className="font-bold shimmer-text drop-shadow-md">
                                                    Processing
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {attachment.processingComplete && (
                                    <div className="absolute top-0 right-0 m-2">
                                        <TransparentIconButton
                                            icon={
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    height="24px"
                                                    viewBox="0 -960 960 960"
                                                    width="24px"
                                                    fill="#e3e3e3"
                                                >
                                                    <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                                                </svg>
                                            }
                                            filledIcon={<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm80-160h80v-360h-80v360Zm160 0h80v-360h-80v360Z"/></svg>}                                            onClick={() => {
                                                console.log("Delete! ", attachment.id);
                                                deleteAttachment(attachment.id);
                                        }}></TransparentIconButton>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Content textarea */}
                <TextAreaInput
                    className="px-2 py-2 w-[90vw] sm:w-[80vw] md:w-[60vw] lg:w-[40vw] h-[50vh] min-h-20 rounded-md border border-black/15 dark:border-white/15 focus:outline-none focus:border-black/35 dark:focus:border-white/35 transition-colors duration-300"
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
