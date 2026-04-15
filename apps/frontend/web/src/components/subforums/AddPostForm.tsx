import { useState, type ClipboardEvent } from "react";
import { API_ENDPOINT } from "../../Config";
import { getStoredAccessToken } from "../../auth/Authentication";
import { extractDetailFromErrorResponse } from "../../Utils";
import {
    notifyErrorDefault,
    notifySuccessDefault,
} from "../../stores/NotificationsStore";
import { PostCreationModal } from "./CreationModal";
import {
    appendAttachedImageToContent,
    extractImageUrlFromClipboardData,
    normalizeAttachedImageUrl,
    type PostImage,
} from "../../contentFilter";

export type SubforumPostDto = {
    id: number;
    title: string;
    body?: string;
    content: string;
    content_markdown?: string;
    author: number;
    created_at: string;
    subforum?: string | null;
    is_nsfw?: boolean;
    has_swears?: boolean;
    image?: PostImage | null;
};

interface Props {
    subforumSlug: string;
    onPostAdded: (post: SubforumPostDto) => void;
    onHide: () => void;
}

export function AddPostForm({ subforumSlug, onPostAdded, onHide }: Props) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const imagePreviewUrl = normalizeAttachedImageUrl(imageUrl);

    const onImagePaste = (event: ClipboardEvent<HTMLInputElement>) => {
        const pastedImageUrl = extractImageUrlFromClipboardData(
            event.clipboardData,
        );
        if (pastedImageUrl == null) {
            return;
        }

        event.preventDefault();
        setImageUrl(pastedImageUrl);
    };

    const onDescriptionPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
        const pastedImageUrl = extractImageUrlFromClipboardData(
            event.clipboardData,
        );
        if (pastedImageUrl == null) {
            return;
        }

        setImageUrl(pastedImageUrl);
    };

    const onAddPost = async () => {
        const trimmedTitle = title.trim();
        const trimmedContent = content.trim();
        const normalizedImageUrl = normalizeAttachedImageUrl(imageUrl);

        if (imageUrl.trim().length > 0 && normalizedImageUrl == null) {
            notifyErrorDefault("Please enter a valid http(s) image URL");
            return;
        }

        const composedContent = appendAttachedImageToContent(
            trimmedContent,
            normalizedImageUrl,
        );

        if (!trimmedTitle) {
            notifyErrorDefault("Post title cannot be empty");
            return;
        }
        if (!composedContent) {
            notifyErrorDefault("Post content cannot be empty");
            return;
        }

        const token = await getStoredAccessToken();
        if (!token) {
            notifyErrorDefault("You need to be logged in to create a post");
            return;
        }

        const response = await fetch(
            `${API_ENDPOINT}/api/posts/subforums/${subforumSlug}/posts/`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: trimmedTitle,
                    content: composedContent,
                    content_markdown: composedContent,
                }),
            },
        );

        if (!response.ok) {
            const detail = await extractDetailFromErrorResponse(response);
            notifyErrorDefault(detail ?? "Failed to add post");
            return;
        }

        const created = (await response.json()) as SubforumPostDto;
        onPostAdded(created);
        setTitle("");
        setContent("");
        setImageUrl("");
        notifySuccessDefault("Post added to subforum");
        onHide()
    };

    return (
        <PostCreationModal
            onClickCreate={onAddPost}
            onDescriptionChanged={setContent}
            onDescriptionPaste={onDescriptionPaste}
            onTitleChanged={setTitle}
            onImageUrlChanged={setImageUrl}
            onImagePaste={onImagePaste}
            onCloseModal={onHide}
            buttonCreateText="Add Post"
            buttonLoadingText="Adding..."
            titlePlaceholder="Post Title"
            imagePlaceholder="Image URL (optional)"
            imageValue={imageUrl}
            imagePreviewUrl={imagePreviewUrl}
            imageAltText={title || "Attached image"}
            descriptionPlaceholder="Post Content..."
            modalTitle="Add Post"
            showImageInput={true}
        ></PostCreationModal>
    );
}
