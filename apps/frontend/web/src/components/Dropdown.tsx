import { type ReactNode } from "react";

type DropdownOption = {
    icon: ReactNode;
    text: string;
    onClick?: () => void;
};

interface Props {
    options: DropdownOption[];
    floatingRef: (node: HTMLElement | null) => void;
    x: number | null;
    y: number | null;
    strategy: React.CSSProperties["position"];
    visible: boolean;
}

interface AccountDropdownProps extends Props {
    accountUsername: string;
    language: string;
    resolvedProfileImage: string;
}

export function Dropdown({
    options,
    floatingRef,
    x,
    y,
    strategy,
    visible,
}: Props) {
    const onOptionClicked = (option: DropdownOption) => {
        if (option.onClick) {
            option.onClick();
        }
    };

    return (
        visible && (
            <div
                ref={floatingRef}
                style={{
                    position: strategy,
                    top: y ?? 0,
                    left: x ?? 0,
                }}
                className="bg-white dark:bg-zinc-800 border border-black/15 rounded-md flex flex-col shadow-lg dark:shadow-white/5 z-90 transition-colors duration-300"
            >
                {options.map((option, i) => (
                    <button
                        key={i}
                        onClick={() => onOptionClicked(option)}
                        className="border-b border-black/5 dark:border-white/5 flex items-center gap-2 px-2 py-2 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                    >
                        <span>{option.icon}</span>
                        <span className="font-bold">{option.text}</span>
                    </button>
                ))}
            </div>
        )
    );
}

export function AccountDropdown({
    options,
    floatingRef,
    x,
    y,
    strategy,
    visible,
    accountUsername,
    language,
    resolvedProfileImage,
}: AccountDropdownProps) {
    const onOptionClicked = (option: DropdownOption) => {
        if (option.onClick) {
            option.onClick();
        }
    };

    return (
        visible && (
            <div
                ref={floatingRef}
                style={{
                    position: strategy,
                    top: y ?? 0,
                    left: x ?? 0,
                }}
                className="bg-white dark:bg-zinc-800 border border-black/15 rounded-md flex flex-col shadow-lg dark:shadow-white/5 z-90 transition-colors duration-300"
            >
                <div className="flex items-center gap-3 px-4 py-3 border-b border-black/15 dark:border-white/15">
                    <div>
                        {resolvedProfileImage != null ? (
                            <img
                                src={resolvedProfileImage}
                                alt={
                                    language === "fr"
                                        ? "Image de profil"
                                        : "Profile image"
                                }
                                className="w-11 h-11 rounded-full object-cover border border-black/15 dark:border-white/15"
                            />
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="44px"
                                viewBox="0 -960 960 960"
                                width="44px"
                                fill="currentColor"
                            >
                                <path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm146.5-204.5Q340-521 340-580t40.5-99.5Q421-720 480-720t99.5 40.5Q620-639 620-580t-40.5 99.5Q539-440 480-440t-99.5-40.5ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm100-95.5q47-15.5 86-44.5-39-29-86-44.5T480-280q-53 0-100 15.5T294-220q39 29 86 44.5T480-160q53 0 100-15.5ZM523-537q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Zm-43-43Zm0 360Z" />
                            </svg>
                        )}
                    </div>

                    <div className="flex flex-col">
                        <span className="font-bold">{accountUsername}</span>
                        <span className="text-xs text-black/50 dark:text-white/50">
                            Logged in
                        </span>
                    </div>
                </div>
                {options.map((option, i) => (
                    <button
                        key={i}
                        onClick={() => onOptionClicked(option)}
                        className="border-b border-black/5 dark:border-white/5 flex items-center gap-2 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                    >
                        <span>{option.icon}</span>
                        <span className="font-bold">{option.text}</span>
                    </button>
                ))}
            </div>
        )
    );
}
