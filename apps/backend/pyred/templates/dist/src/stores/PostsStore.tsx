import { create } from "zustand";

type Post = {
    id: number;
    title: string;
    body?: string;
    content: string;
    content_markdown?: string;
    author: number;
    created_at: string;
    votes?: number;
    likes_count?: number;
    replies_count?: number;
    can_delete?: boolean;
    subforum?: string | null;
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