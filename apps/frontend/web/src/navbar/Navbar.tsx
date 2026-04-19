import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { TransparentIconButton } from "../components/TransparentIconButton";
import { useScreenSizeState } from "../stores/ScreenSizeState";
import { useSideNavigationVisibility } from "../stores/SideNavigationVisibilityStore";
import { AccountDropdown } from "../components/Dropdown";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
    autoUpdate,
    flip,
    offset,
    shift,
    useFloating,
} from "@floating-ui/react-dom";
import { useAuthenticationStore } from "../stores/AuthenticationStore";
import { storeAccessToken, storeRefreshToken } from "../auth/Authentication";
import { createPortal } from "react-dom";
import { SearchDropdown } from "./SearchDropdown";
import clsx from "clsx";
import { notifyWarningDefault } from "../stores/NotificationsStore";
import type { SearchScope } from "./searchScopes";
import {
    getAppLanguageFromPath,
    localizePath,
    stripLanguagePrefix,
    type AppLanguage,
} from "../i18n";
import { LanguageSelection } from "./LanguageSelection";
import { resolveProfileImageInput } from "../Utils";
import { DarkModeToggleButton } from "./DarkModeToggleButton";

function SignedOutButtons({ language }: { language: AppLanguage }) {
    const navigate = useNavigate();

    return (
        <>
            <Button
                text={language === "fr" ? "Connexion" : "Login"}
                onClick={() => {
                    navigate("/auth?action=login");
                }}
            ></Button>
            <span className="md:block hidden">
                <Button
                    text={language === "fr" ? "Inscription" : "Sign up"}
                    isPrimary={true}
                    onClick={() => {
                        navigate("/auth?action=signup");
                    }}
                ></Button>
            </span>
        </>
    );
}

function getSearchQueryValue(search: string) {
    const params = new URLSearchParams(search);
    return (params.get("q") ?? "").trim();
}

function getCurrentSubforumSlug(pathname: string): string | null {
    const match = stripLanguagePrefix(pathname).match(/^\/subforums\/([^/]+)\/?$/);
    if (!match?.[1]) {
        return null;
    }

    return decodeURIComponent(match[1]);
}



function SignedInProfile({ language }: { language: AppLanguage }) {
    const [dropdownVisible, setDropdownVisible] = useState<boolean>(false);

    const referenceRef = useRef<HTMLButtonElement>(null);

    const navigate = useNavigate();
    const username = useAuthenticationStore(state => state.username);
    const profileImage = useAuthenticationStore((state) => state.profileImage);
    const resolvedProfileImage = resolveProfileImageInput(profileImage);

    const { refs, x, y, strategy } = useFloating({
        middleware: [offset(6), flip(), shift({ padding: 8 })],
        whileElementsMounted: autoUpdate,
    });

    useEffect(() => {
        if (referenceRef.current) {
            refs.setReference(referenceRef.current);
        }
    }, [refs]);

    const onLogoutClicked = () => {
        setDropdownVisible(false);
        notifyWarningDefault(
            "Logout only clears local browser tokens; server-side token revocation is not enabled.",
        );
        storeAccessToken("");
        storeRefreshToken("");
        useAuthenticationStore.setState({ isLoggedIn: false });
        navigate("/auth?action=login");
    };

    const onEditProfileClicked = () => {
        setDropdownVisible(false);
        navigate(localizePath("/profile", language));
    };

    return (
        <div className="flex items-center gap-2">
            <TransparentIconButton
                icon={
                    resolvedProfileImage != null ? (
                        <img
                            src={resolvedProfileImage}
                            alt={language === "fr" ? "Image de profil" : "Profile image"}
                            className="w-9 h-9 min-w-9 min-h-9 rounded-full object-cover border border-black/15 dark:border-white/15"
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
                    )
                }
                ref={referenceRef}
                onClick={() => {
                    setDropdownVisible(!dropdownVisible);
                }}
            ></TransparentIconButton>
            <AccountDropdown
                options={[
                    {
                        icon: (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="24px"
                                viewBox="0 -960 960 960"
                                width="24px"
                                fill="currentColor"
                            >
                                <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
                            </svg>
                        ),
                        text: language === "fr" ? "Modifier le profil" : "Edit Profile",
                        onClick: onEditProfileClicked,
                    },
                    {
                        icon: (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="24px"
                                viewBox="0 -960 960 960"
                                width="24px"
                                fill="currentColor"
                            >
                                <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z" />
                            </svg>
                        ),
                        text: language === "fr" ? "Déconnexion" : "Logout",
                        onClick: onLogoutClicked,
                    },
                ]}
                floatingRef={refs.setFloating}
                x={x}
                y={y}
                strategy={strategy}
                visible={dropdownVisible}
                accountUsername={username}
                resolvedProfileImage={resolvedProfileImage ?? ""}
                language={language}
            ></AccountDropdown>
        </div>
    );
}

export function Navbar() {
    const screenSize = useScreenSizeState((state) => state.width);
    const navigate = useNavigate();
    const location = useLocation();

    const onMenuBarClick = () => {
        const currentVisibility =
            useSideNavigationVisibility.getState().visible;

        useSideNavigationVisibility.setState({
            visible: !currentVisibility,
        });
    };

    const isLoggedIn = useAuthenticationStore((state) => state.isLoggedIn);
    const locationSearchValue = getSearchQueryValue(location.search);
    const currentSubforumSlug = getCurrentSubforumSlug(location.pathname);
    const activeLanguage = getAppLanguageFromPath(location.pathname);

    const [searchBarFocused, setBarFocused] = useState<boolean>(false);
    const [searchBarContent, setBarContent] = useState<string>(() =>
        getSearchQueryValue(location.search),
    );

    const runSearch = (
        searchText: string,
        scope: SearchScope = "everywhere",
    ) => {
        const trimmed = searchText.trim();

        setBarContent(trimmed);
        setBarFocused(false);

        if (trimmed.length === 0) {
            navigate({
                pathname: localizePath("/", activeLanguage),
                search: "",
            });
            return;
        }

        const params = new URLSearchParams();
        params.set("q", trimmed);

        let targetPathname = "/";

        if (scope === "posts") {
            targetPathname = "/subforums/general";
        } else if (scope === "subforum") {
            targetPathname = currentSubforumSlug
                ? `/subforums/${currentSubforumSlug}`
                : "/subforums/general";
        } else if (scope === "users") {
            targetPathname = "/discover";
            params.set("scope", "users");
        } else if (scope === "everywhere") {
            targetPathname = "/discover";
            params.set("scope", "everywhere");
        }

        navigate({
            pathname: localizePath(targetPathname, activeLanguage),
            search: `?${params.toString()}`,
        });
    };

    const { refs, x, y, strategy } = useFloating({
        placement: "bottom-start",
        middleware: [offset(6), flip(), shift({ padding: 8 })],
        whileElementsMounted: autoUpdate,
    });
    const [width, setWidth] = useState<number | null>(null);
    useLayoutEffect(() => {
        if (!refs.reference) return;

        const el = refs.reference.current as HTMLElement;

        const updateWidth = () => {
            setWidth(el.getBoundingClientRect().width);
        };

        updateWidth();

        const resizeObserver = new ResizeObserver(updateWidth);
        resizeObserver.observe(el);

        return () => resizeObserver.disconnect();
    }, [refs.reference]);

    const searchInputRef = useRef<HTMLInputElement | null>(null);


    return (
        <header className="px-4 gap-4 w-[100vw] h-16 bg-white dark:bg-zinc-800 border-b border-b-black/15 dark:border-b-white/15 flex justify-between items-center px-2 py-2 transition-colors duration-300">
            {screenSize < 640 && (
                <TransparentIconButton
                    icon={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                            className="dark:text-white transition-colors duration-300"
                        >
                            <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z" />
                        </svg>
                    }
                    square={true}
                    onClick={onMenuBarClick}
                    larger={true}
                ></TransparentIconButton>
            )}

            <div className="block md:hidden"></div>
            <h1 className="font-bold text-2xl sm:block hidden ml-4 whitespace-nowrap">
                LT-Forum
            </h1>

            <div
                className="relative w-full sm:w-100 md:w-140 lg:w-200"
                ref={(node) => {
                    refs.setReference(node);
                }}
            >
                <div className="rounded-full border border-black/15 px-4 dark:border-white/15 flex items-center gap-3 transition-colors duration-300 cursor-text" onClick={() => searchInputRef.current?.focus()}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill="currentColor"
                        className="min-w-6 min-h-6"
                    >
                        <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
                    </svg>
                    <input
                        className="focus:outline-none flex-grow-1 py-2 h-full w-full"
                        placeholder={activeLanguage === "fr" ? "Rechercher" : "Search"}
                        onFocus={() => {
                            setBarContent(locationSearchValue);
                            setBarFocused(true);
                        }}
                        onBlur={() => setBarFocused(false)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                runSearch(event.currentTarget.value);
                            }
                        }}
                        onChange={(event) => {
                            setBarContent(event.currentTarget.value);
                        }}
                        value={searchBarFocused ? searchBarContent : locationSearchValue}
                        ref={searchInputRef}
                    ></input>
                    <span
                        className={clsx(
                            searchBarContent == "" && "opacity-0",
                            "cursor-pointer max-[460px]:hidden",
                        )}
                        onClick={() => {
                            runSearch("");
                        }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                            className="text-black/50 dark:text-white/50 block transition-colors duration-300"
                        >
                            <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                        </svg>
                    </span>
                </div>
                {searchBarFocused && searchBarContent != "" &&
                    createPortal(
                        <SearchDropdown
                            refs={refs}
                            x={x}
                            y={y}
                            width={width ?? 0}
                            strategy={strategy}
                            currentContent={searchBarContent}
                            onSearch={runSearch}
                        ></SearchDropdown>,
                        document.body,
                    )}
            </div>

            <div className="w-fit h-full flex items-center gap-1">
                <div className="hidden sm:block">
                    <LanguageSelection></LanguageSelection>
                </div>
                <div className="hidden sm:block">
                    <DarkModeToggleButton></DarkModeToggleButton>
                </div>
                

                {isLoggedIn ? (
                    <SignedInProfile language={activeLanguage}></SignedInProfile>
                ) : (
                    <SignedOutButtons language={activeLanguage}></SignedOutButtons>
                )}
            </div>
        </header>
    );
}
