import { create } from "zustand";
import type { PostImage } from "../contentFilter";

export type Post = {
    id: number;
    title: string;
    body?: string;
    content: string;
    content_markdown?: string;
    author: number;
    author_username?: string;
    author_bio?: string;
    created_at: string;
    votes?: number;
    likes_count?: number;
    replies_count?: number;
    can_delete?: boolean;
    subforum?: string | null;
    is_nsfw?: boolean;
    has_swears?: boolean;
    image?: PostImage | null;
    language?: "en" | "fr";
}

interface PostsStore {
    posts: Post[],
    hasLoaded: boolean
}

export const postsStore = create<PostsStore>(() => {
    return {
        posts: [],
        hasLoaded: false
    }
});