import { create } from "zustand";

export const DisplayedTab = {
    Home: 0,
    Discover: 1,
    Trending: 2
}

interface DisplayedTabStore {
    displayedTab: number;
}

export const displayedTabStore = create<DisplayedTabStore>(() => {
    return {
        displayedTab: DisplayedTab.Home
    }
});