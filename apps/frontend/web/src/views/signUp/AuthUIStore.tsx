import { create } from "zustand";

interface AuthUIStore {
    loading: boolean;
    setLoading: (v: boolean) => void;
}

export const useAuthUIStore = create<AuthUIStore>((set) => {
    return {
        loading: false,
        setLoading: (v) => {
            set({loading: v});
        }
    }
});