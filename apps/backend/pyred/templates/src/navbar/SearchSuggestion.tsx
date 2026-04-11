import clsx from "clsx";
import type { ReactNode } from "react";

interface Props {
    icon: ReactNode;
    location: string;
    currentText: string;
    isLast: boolean;
    onClick?: () => void;
}

export function SearchSuggestion(props: Props) {

    const classes = clsx(
        "px-2 py-3 font-bold flex items-center gap-2 w-full text-left",
        !props.isLast && "border-b border-b-black/15 dark:border-b-white/15",
        "hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer",
        "text-black dark:text-white"
    )

    return (
        <button
            type="button"
            className={classes}
            onMouseDown={(event) => event.preventDefault()}
            onClick={props.onClick}
        >
            <span>
                {props.icon}
            </span>
            <span className="flex gap-1 min-w-0">
                <span className="font-normal text-black/50 dark:text-white/50 shrink-0 transition-colors duration-300">Search</span>
                <span className="font-bold text-black dark:text-white truncate min-w-0 transition-colors duration-300">{props.currentText}</span>
                <span className="font-normal text-black/50 dark:text-white/50 shrink-0 transition-colors duration-300">{props.location}</span>
            </span>
        </button>
    );
}
