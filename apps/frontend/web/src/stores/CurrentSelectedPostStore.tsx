import { create } from "zustand";

interface SelectedPostStore {
    selectedAny: boolean;
    title: string;
    description: string;
    publishedTime: string;
    likes: number;
    comments: number;
    postId: number;
}

export const useSelectedPostStore = create<SelectedPostStore>(() => {
    return {
        selectedAny: false,
        title: "",
        description: "",
        publishedTime: "",
        likes: -1,
        comments: -1,
        postId: -1
    }
})