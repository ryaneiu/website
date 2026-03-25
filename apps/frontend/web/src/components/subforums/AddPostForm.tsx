import { useState } from "react";
import { API_ENDPOINT } from "../../Config";
import { getStoredAccessToken } from "../../auth/Authentication";
import { extractDetailFromErrorResponse } from "../../Utils";
import {
    notifyErrorDefault,
    notifySuccessDefault,
} from "../../stores/NotificationsStore";
import { PostCreationModal } from "./CreationModal";

export type SubforumPostDto = {
    id: number;
    title: string;
    content: string;
    content_markdown?: string;
    author: number;
    created_at: string;
    subforum?: string | null;
};

interface Props {
    subforumSlug: string;
    onPostAdded: (post: SubforumPostDto) => void;
    onHide: () => void;
}

export function AddPostForm({ subforumSlug, onPostAdded, onHide }: Props) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const onAddPost = async () => {
        const trimmedTitle = title.trim();
        const trimmedContent = content.trim();

        if (!trimmedTitle) {
            notifyErrorDefault("Post title cannot be empty");
            return;
        }
        if (!trimmedContent) {
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
                    content: trimmedContent,
                    content_markdown: trimmedContent,
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
        notifySuccessDefault("Post added to subforum");
        onHide()
    };

    return (
        <PostCreationModal
            onClickCreate={onAddPost}
            onDescriptionChanged={setContent}
            onTitleChanged={setTitle}
            onCloseModal={onHide}
            buttonCreateText="Add Post"
            buttonLoadingText="Adding..."
            titlePlaceholder="Post Title"
            descriptionPlaceholder="Post Content..."
        ></PostCreationModal>
    );
}
