import { create } from "zustand";

type Notification = {
    title: string;
    description?: string;
    type: "success" | "error" | "warning" | "info";
    durationMs: number;
}

interface NotificationsStore {
    notifications: Notification[];
    addNotification: (notification: Notification) => void;
    removeNotification: (index: number) => void;
}

export const useNotificationsStore = create<NotificationsStore>((set) => {
    return {
        notifications: [],
        addNotification: (notification: Notification) => set((state) => {
            return {
                notifications: [...state.notifications, notification]
            }
        }),
        removeNotification: (index: number) => set((state) => {
            return {
                notifications: state.notifications.filter((_, i) => i != index)
            }
        })
    }
})

export function notify(notification: Notification) {
    useNotificationsStore.getState().addNotification(notification);
    setTimeout(() => {
        useNotificationsStore.getState().removeNotification(0);
    }, notification.durationMs);
}

export function notifyErrorDefault(text: string) {
    notify({
        title: text,
        type: "error", 
        durationMs: 5_000
    });
}

export function notifyInfoDefault(text: string) {
    notify({
        title: text,
        type: "info", 
        durationMs: 5_000
    });
}

export function notifyWarningDefault(text: string) {
    notify({
        title: text,
        type: "warning", 
        durationMs: 5_000
    });
}

export function notifySuccessDefault(text: string) {
    notify({
        title: text,
        type: "success", 
        durationMs: 5_000
    });
}