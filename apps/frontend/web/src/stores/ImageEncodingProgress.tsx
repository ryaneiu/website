import { create } from "zustand";
import { Progress, type ProgressType } from "./ImageEncodingProgressState";



/*
Tracks image encoding progress */
interface ImageEncodingProgressStore {
    progress: ProgressType;
    setProgress: (p: ProgressType) => void;
}

export const useImageProgressStore = create<ImageEncodingProgressStore>((set) => {
    return {
        progress: Progress.NONE,
        setProgress: (p: ProgressType) => set({progress: p})
    }
});