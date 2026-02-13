import type { ReactNode } from "react";
import { SideNavigationButton } from "./SideNavigationButton";
import { DisplayedTab } from "../stores/DisplayedTabStore";
import { useSideNavigationVisibility } from "../stores/SideNavigationVisibilityStore";
import { useScreenSizeState } from "../stores/ScreenSizeState";
import { AnimatePresence } from "framer-motion";
import { FadeInFromLeft } from "../components/AnimatedPresenceDiv";

type TabInfo = {
    id: number;
    text: string;
    icon: ReactNode;
    filledIcon: ReactNode;
    navgiateTo: string;
};

const TABS: TabInfo[] = [
    {
        id: DisplayedTab.Home,
        text: "Home",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#1f1f1f"
            >
                <path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z" />
            </svg>
        ),
        filledIcon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#1f1f1f"
            >
                <path d="M160-120v-480l320-240 320 240v480H560v-280H400v280H160Z" />
            </svg>
        ),
        navgiateTo: "/",
    },
    {
        id: DisplayedTab.Discover,
        text: "Discover",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#1f1f1f"
            >
                <path d="m300-300 280-80 80-280-280 80-80 280Zm180-120q-25 0-42.5-17.5T420-480q0-25 17.5-42.5T480-540q25 0 42.5 17.5T540-480q0 25-17.5 42.5T480-420Zm0 340q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Zm0-320Z" />
            </svg>
        ),
        filledIcon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#1f1f1f"
            >
                <path d="m300-300 280-80 80-280-280 80-80 280Zm180-120q-25 0-42.5-17.5T420-480q0-25 17.5-42.5T480-540q25 0 42.5 17.5T540-480q0 25-17.5 42.5T480-420Zm0 340q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
            </svg>
        ),
        navgiateTo: "/discover",
    },
    {
        id: DisplayedTab.Trending,
        text: "Trending",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#1f1f1f"
            >
                <path d="M240-400q0 52 21 98.5t60 81.5q-1-5-1-9v-9q0-32 12-60t35-51l113-111 113 111q23 23 35 51t12 60v9q0 4-1 9 39-35 60-81.5t21-98.5q0-50-18.5-94.5T648-574q-20 13-42 19.5t-45 6.5q-62 0-107.5-41T401-690q-39 33-69 68.5t-50.5 72Q261-513 250.5-475T240-400Zm240 52-57 56q-11 11-17 25t-6 29q0 32 23.5 55t56.5 23q33 0 56.5-23t23.5-55q0-16-6-29.5T537-292l-57-56Zm0-492v132q0 34 23.5 57t57.5 23q18 0 33.5-7.5T622-658l18-22q74 42 117 117t43 163q0 134-93 227T480-80q-134 0-227-93t-93-227q0-129 86.5-245T480-840Z" />
            </svg>
        ),
        filledIcon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#1f1f1f"
            >
                <path d="M160-400q0-105 50-187t110-138q60-56 110-85.5l50-29.5v132q0 37 25 58.5t56 21.5q17 0 32.5-7t28.5-23l18-22q72 42 116 116.5T800-400q0 88-43 160.5T644-125q17-24 26.5-52.5T680-238q0-40-15-75.5T622-377L480-516 339-377q-29 29-44 64t-15 75q0 32 9.5 60.5T316-125q-70-42-113-114.5T160-400Zm320-4 85 83q17 17 26 38t9 45q0 49-35 83.5T480-120q-50 0-85-34.5T360-238q0-23 9-44.5t26-38.5l85-83Z" />
            </svg>
        ),
        navgiateTo: "/trending",
    },
];

export function SideNavigation() {
    const screenSize = useScreenSizeState((state) => state.width);

    const visible = useSideNavigationVisibility((state) => state.visible);

    return (
        <AnimatePresence>
            {visible || screenSize > 640 ? (
                <FadeInFromLeft className="flex flex-col border-r border-r-black/15 h-full gap-1 px-2 z-97 py-2 lg:min-w-60 min-w-0 fixed sm:relative sm:w-fit w-75 bg-white">
                    {TABS.map((tab) => {
                        return (
                            <SideNavigationButton
                                key={tab.id}
                                icon={tab.icon}
                                text={tab.text}
                                selected={
                                    window.location.pathname == tab.navgiateTo
                                }
                                navigateTo={tab.navgiateTo}
                                filledIcon={tab.filledIcon}
                            ></SideNavigationButton>
                        );
                    })}
                </FadeInFromLeft>
            ) : null}
        </AnimatePresence>
    );
}
