import { create } from "zustand";
import type { SubforumDto } from "../components/subforums/CreationModal";

export type SubforumWithPosts = SubforumDto & {
    posts: {
        id: number;
        title: string;
        created_at: string;
    }[];
};

interface SubforumsListStore {
    fetchKey: number;
    lastFetchKey: number;
    subforums: SubforumWithPosts[];
    setSubforums: (
        value:
            | SubforumWithPosts[]
            | ((prev: SubforumWithPosts[]) => SubforumWithPosts[])
    ) => void;
    setLoading: (v: boolean) => void;
    loading: boolean;
    forceUpdate: () => void;
}

export const useSubforumsListStore = create<SubforumsListStore>((set) => {
    return {
        fetchKey: 0,
        lastFetchKey: -1,
        forceUpdate: () => {
            set((state) => ({
                fetchKey: state.fetchKey + 1
            }))
        },
        subforums: [],
        setSubforums: (value) =>
            set((state) => ({
                subforums:
                    typeof value === "function"
                        ? value(state.subforums)
                        : value,
            })),
        setLoading: (v: boolean) => set({loading: v}),
        loading: false
    };
});
