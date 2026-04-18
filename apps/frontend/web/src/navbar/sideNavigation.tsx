import { useLayoutEffect, useRef, type ReactNode } from "react";
import { SideNavigationButton } from "./SideNavigationButton";
import { DisplayedTab } from "../stores/DisplayedTabStore";
import { useSideNavigationVisibility } from "../stores/SideNavigationVisibilityStore";
import { useScreenSizeState } from "../stores/ScreenSizeState";
import { AnimatePresence } from "framer-motion";
import { FadeInFromLeft } from "../components/AnimatedPresenceDiv";
import {
    getAppLanguageFromPath,
    localizePath,
    stripLanguagePrefix,
} from "../i18n";
import { LanguageSelection } from "./LanguageSelection";
import { useAuthenticationStore } from "../stores/AuthenticationStore";
import { resolveProfileImageInput } from "../Utils";
import { useNavigate } from "react-router-dom";
import { DarkModeToggleButton } from "./DarkModeToggleButton";

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
                fill="currentColor"
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
                fill="currentColor"
            >
                <path d="M160-120v-480l320-240 320 240v480H560v-280H400v280H160Z" />
            </svg>
        ),
        navgiateTo: "/",
    },
    {
        id: DisplayedTab.Subforums,
        text: "Subforums",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="currentColor"
            >
                <path d="m260-520 220-360 220 360H260ZM700-80q-75 0-127.5-52.5T520-260q0-75 52.5-127.5T700-440q75 0 127.5 52.5T880-260q0 75-52.5 127.5T700-80Zm-580-20v-320h320v320H120Zm580-60q42 0 71-29t29-71q0-42-29-71t-71-29q-42 0-71 29t-29 71q0 42 29 71t71 29Zm-500-20h160v-160H200v160Zm202-420h156l-78-126-78 126Zm78 0ZM360-340Zm340 80Z" />
            </svg>
        ),
        filledIcon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="currentColor"
            >
                <path d="m260-520 220-360 220 360H260ZM700-80q-75 0-127.5-52.5T520-260q0-75 52.5-127.5T700-440q75 0 127.5 52.5T880-260q0 75-52.5 127.5T700-80Zm-580-20v-320h320v320H120Z" />
            </svg>
        ),
        navgiateTo: "/subforums",
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
                fill="currentColor"
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
                fill="currentColor"
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
                fill="currentColor"
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
                fill="currentColor"
            >
                <path d="M160-400q0-105 50-187t110-138q60-56 110-85.5l50-29.5v132q0 37 25 58.5t56 21.5q17 0 32.5-7t28.5-23l18-22q72 42 116 116.5T800-400q0 88-43 160.5T644-125q17-24 26.5-52.5T680-238q0-40-15-75.5T622-377L480-516 339-377q-29 29-44 64t-15 75q0 32 9.5 60.5T316-125q-70-42-113-114.5T160-400Zm320-4 85 83q17 17 26 38t9 45q0 49-35 83.5T480-120q-50 0-85-34.5T360-238q0-23 9-44.5t26-38.5l85-83Z" />
            </svg>
        ),
        navgiateTo: "/trending",
    },
];

export function SideNavigation() {
    const screenSize = useScreenSizeState((state) => state.width);
    const language = getAppLanguageFromPath(window.location.pathname);
    const pathWithoutLanguage = stripLanguagePrefix(window.location.pathname);

    const username = useAuthenticationStore((state) => state.username);
    const profileImage = useAuthenticationStore((state) => state.profileImage);
    const resolvedProfileImage = resolveProfileImageInput(profileImage);

    const visible = useSideNavigationVisibility((state) => state.visible);

    const tabsRef = useRef<HTMLDivElement | null>(null);
    const totalRef = useRef<HTMLDivElement | null>(null);
    const languageSelectionRef = useRef<HTMLDivElement | null>(null);
    const spacerRef = useRef<HTMLDivElement | null>(null);

    const navigate = useNavigate();

    /*
    THERE HAS TO BE A CLEANER WAY TO DO THIS
    literally using AABBs to calculate overflow and position a spacer div
    */
    useLayoutEffect(() => {
        if (
            !tabsRef.current ||
            !totalRef.current ||
            !spacerRef.current ||
            !languageSelectionRef.current
        )
            return;

        const styles = window.getComputedStyle(totalRef.current);

        const paddingTop = parseFloat(styles.paddingTop);
        const paddingBottom = parseFloat(styles.paddingBottom);

        const borderTop = parseFloat(styles.borderTopWidth);
        const borderBottom = parseFloat(styles.borderBottomWidth);

        const fullHeight = totalRef.current.offsetHeight;

        const rect = totalRef.current.getBoundingClientRect();

        const elTop = rect.top;
        const elBottom = rect.bottom;

        const overflowTop = Math.max(0, 0 - elTop);
        const overflowBottom = Math.max(0, elBottom - window.innerHeight);

        const totalOverflow = overflowTop + overflowBottom;

        const totalHeight =
            fullHeight -
            paddingTop -
            paddingBottom -
            borderTop -
            borderBottom -
            totalOverflow;
        const tabsHeight = tabsRef.current.clientHeight;
        const languageSelectionHeight =
            languageSelectionRef.current.clientHeight;

        console.log(
            "Total height: ",
            totalHeight,
            " Tabs height: ",
            tabsHeight,
            " Language selection height: ",
            languageSelectionHeight,
        );

        const remaining = Math.max(
            totalHeight - tabsHeight - languageSelectionHeight,
            0,
        );

        console.log("Remaining space: ", remaining);

        spacerRef.current.style.height = `${remaining}px`;
    }, [screenSize, visible]);

    return (
        <AnimatePresence>
            {visible || screenSize > 640 ? (
                <FadeInFromLeft
                    className="flex flex-col h-full max-h-full border-r border-r-black/15 dark:border-r-white/15 h-full px-2 z-97 py-2 lg:min-w-60 sm:min-w-fit min-w-75 fixed sm:relative sm:w-fit w-75 bg-white dark:bg-zinc-800 transition-colors duration-300"
                    ref={totalRef}
                >
                    <div
                        className="flex flex-col gap-1 overflow-y-auto h-fit"
                        ref={tabsRef}
                    >
                        {TABS.map((tab) => {
                            return (
                                <SideNavigationButton
                                    key={tab.id}
                                    icon={tab.icon}
                                    text={
                                        language === "fr"
                                            ? ({
                                                  Home: "Accueil",
                                                  Subforums: "Sous-forums",
                                                  Discover: "Découvrir",
                                                  Trending: "Tendances",
                                              }[tab.text] ?? tab.text)
                                            : tab.text
                                    }
                                    selected={
                                        (pathWithoutLanguage.startsWith(
                                            tab.navgiateTo,
                                        ) &&
                                            tab.navgiateTo != "/") ||
                                        pathWithoutLanguage == tab.navgiateTo
                                    }
                                    navigateTo={localizePath(
                                        tab.navgiateTo,
                                        language,
                                    )}
                                    filledIcon={tab.filledIcon}
                                    onClick={() => {
                                        useSideNavigationVisibility.setState({
                                            visible: false,
                                        });
                                    }}
                                ></SideNavigationButton>
                            );
                        })}
                    </div>
                    <div ref={spacerRef}></div>
                    <div
                        className="flex sm:hidden flex-col gap-1"
                        ref={languageSelectionRef}
                    >
                        <div className="flex flex-col gap-2">
                            <LanguageSelection></LanguageSelection>
                            <div className="cursor-pointer flex items-center gap-2 border-t border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 px-2 transition-colors">
                                <div
                                    className="flex-grow-1 py-2 flex gap-3 items-center"
                                    onClick={() => {
                                        navigate(
                                            localizePath("/profile", language),
                                        );
                                        useSideNavigationVisibility.setState({
                                            visible: false,
                                        });
                                    }}
                                >
                                    <div>
                                        {resolvedProfileImage != null ? (
                                            <img
                                                src={resolvedProfileImage}
                                                alt={
                                                    language === "fr"
                                                        ? "Image de profil"
                                                        : "Profile image"
                                                }
                                                className="w-9 h-9 rounded-full object-cover border border-black/15 dark:border-white/15"
                                            />
                                        ) : (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                height="36px"
                                                viewBox="0 -960 960 960"
                                                width="36px"
                                                fill="currentColor"
                                            >
                                                <path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm146.5-204.5Q340-521 340-580t40.5-99.5Q421-720 480-720t99.5 40.5Q620-639 620-580t-40.5 99.5Q539-440 480-440t-99.5-40.5ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm100-95.5q47-15.5 86-44.5-39-29-86-44.5T480-280q-53 0-100 15.5T294-220q39 29 86 44.5T480-160q53 0 100-15.5ZM523-537q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Zm-43-43Zm0 360Z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold">
                                            {username}
                                        </span>
                                        <span className="text-xs text-black/50 dark:text-white/50">
                                            Logged in
                                        </span>
                                    </div>
                                </div>
                                <DarkModeToggleButton></DarkModeToggleButton>
                            </div>
                        </div>
                    </div>
                </FadeInFromLeft>
            ) : null}
        </AnimatePresence>
    );
}
