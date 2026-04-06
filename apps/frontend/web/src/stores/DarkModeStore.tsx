import { create } from "zustand";

interface DarkModeStore {
    isDarkMode: boolean;
}

export const useDarkModeStore = create<DarkModeStore>(() => {
    return {
        isDarkMode: false
    }
});