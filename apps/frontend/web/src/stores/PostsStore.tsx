import { create } from "zustand";

type Post = {
    title: string;
    body: string;
    author: string;
    createdAt: string;
    votes: number;
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