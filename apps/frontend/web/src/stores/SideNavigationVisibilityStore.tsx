import { create } from "zustand";

interface SideNavigationVisibility {
    visible: boolean;
}

export const useSideNavigationVisibility = create<SideNavigationVisibility>(() => {
    return {
        visible: false
    }
});