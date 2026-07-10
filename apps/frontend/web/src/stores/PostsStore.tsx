import { create } from "zustand";
import type { PostImage } from "../contentFilter";

export type PostAttachment = {
    id: number;
    object_id: string;
    width: number;
    height: number;
    type: string;
    post: number;
};

export type Post = {
    id: number;
    title: string;
    body?: string;
    content: string;
    content_markdown?: string;
    author: number;
    author_username?: string;
    author_bio?: string;
    author_display_name?: string;
    author_profile_image?: string | null;
    created_at: string;
    votes?: number;
    likes_count?: number;
    user_has_liked?: boolean;
    replies_count?: number;
    can_delete?: boolean;
    subforum?: string | null;
    is_nsfw?: boolean;
    has_swears?: boolean;
    image?: PostImage | null;
    language?: "en" | "fr";
    attachments: PostAttachment[];
};

interface PostsStore {
    posts: Post[];
    hasLoaded: boolean;
    fetchKeyHash: string; // used for checking if the state actually needs to change
    hashUpdateKey: number; // triggers a rerender on post list

    forceUpdate: () => void; // Please call this if you want to force the post list to update, such as after publishing a post
}

export const postsStore = create<PostsStore>((set) => {
    return {
        posts: [],
        hasLoaded: false,
        fetchKeyHash: "",
        hashUpdateKey: 0,

        forceUpdate: () => {
            set({ hashUpdateKey: Math.random() * 99999999 });
        },
    };
});
