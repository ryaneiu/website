import clsx from "clsx";
import type { ReactNode } from "react";

interface Props {
    icon: ReactNode;
    location: string;
    currentText: string;
    isLast: boolean;
}

export function SearchSuggestion(props: Props) {

    const classes = clsx(
        "px-2 py-3 font-bold flex items-center gap-2",
        !props.isLast && "border-b border-b-black/15 dark:border-b-white/15 transition-colors duration-300",
        "hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors duration-300",
        "text-black dark:text-white transition-colors duration-300"
    )

    return (
        <div className={classes}>
            <span>
                {props.icon}
            </span>
            <span className="flex gap-1 min-w-0">
                <span className="font-normal text-black/50 dark:text-white/50 shrink-0 transition-colors duration-300">Search</span>
                <span className="font-bold text-black dark:text-white truncate min-w-0 transition-colors duration-300">{props.currentText}</span>
                <span className="font-normal text-black/50 dark:text-white/50 shrink-0 transition-colors duration-300">{props.location}</span>
            </span>
        </div>
    );
}
