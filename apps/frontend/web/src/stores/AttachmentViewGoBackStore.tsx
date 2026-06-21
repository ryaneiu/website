import { create } from "zustand";

interface AttachmentViewGoBackStore {
    goBackTo: string;
    dataUrl: string;
    setGoBackTo: (v: string) => void;
}

export const useAttachmentViewGoBackStore = create<AttachmentViewGoBackStore>((set) => {
    return {
        goBackTo: "/",
        dataUrl: "",
        setGoBackTo: (v) => {
            set({goBackTo: v})
        }
    }
})