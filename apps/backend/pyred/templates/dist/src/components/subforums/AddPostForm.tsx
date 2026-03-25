import { useState } from "react";
import { API_ENDPOINT } from "../../Config";
import { getStoredAccessToken } from "../../auth/Authentication";
import { extractDetailFromErrorResponse } from "../../Utils";
import { notifyErrorDefault, notifySuccessDefault } from "../../stores/NotificationsStore";
import { Button } from "../Button";
import { InputComponent } from "../InputComponent";
import { TextAreaInput } from "../TextAreaInput";

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
}

export function AddPostForm({ subforumSlug, onPostAdded }: Props) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);

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

        setLoading(true);
        try {
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
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-2 border border-black/15 rounded-md p-3 bg-white">
            <h3 className="font-semibold">Add Post</h3>
            <InputComponent
                placeholder="Post title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={loading}
            />
            <TextAreaInput
                className="w-full h-28"
                placeholder="Post content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                disabled={loading}
            />
            <div className="w-fit">
                <Button
                    text={loading ? "Adding..." : "Add Post"}
                    onClick={onAddPost}
                    isPrimary={true}
                    disabled={loading}
                />
            </div>
        </div>
    );
}
