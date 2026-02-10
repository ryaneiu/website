import { create } from "zustand";

interface ScreenSizeState {
    width: number;
    height: number;
    setSize: (width: number, height: number) => void;
}

export const useScreenSizeState = create<ScreenSizeState>((set) => {
    return {
        width: 0,
        height: 0,
        setSize: (width: number, height: number) => set({ width, height }),
    }
});

