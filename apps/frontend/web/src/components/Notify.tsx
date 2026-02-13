import clsx from "clsx";
import { useNotificationsStore } from "../stores/NotificationsStore";
import { FadeUp, FadeUpLeaveUp } from "./AnimatedPresenceDiv";
import { AnimatePresence } from "framer-motion";

interface Props {
    title: string;
    description?: string;
    type: "success" | "error" | "warning" | "info";
}

export function TopNotification(props: Props) {
    const notificatoinClasses = clsx(
        "w-full rounded-md border-b/15 px-2 py-2 flex gap-2 flex-grow-1 pointer-events-none",
        props.type == "error" && "bg-red-600/50",
        props.type == "success" && "bg-green-600/50",
        props.type == "warning" && "bg-yellow-600/50",
        props.type == "info" && "bg-blue-600/50",
    );

    return (
        <FadeUp className="flex">
            <div className={notificatoinClasses}>
                <span className="text-white font-bold">{props.title}</span>
                {props.description && (
                    <span className="text-white">{props.description}</span>
                )}
            </div>
        </FadeUp>
    );
}

export function NotificationList() {
    const notifications = useNotificationsStore((state) => state.notifications);

    return (
        <div className="fixed z-99 w-full px-2 py-2 pointer-events-none">
            <div className="flex flex-col gap-2">
                <AnimatePresence>
                    {notifications.map((notification, i) => {
                        return (
                            <TopNotification
                                title={notification.title}
                                description={notification.description}
                                type={notification.type}
                                key={i}
                            ></TopNotification>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
