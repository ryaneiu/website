import clsx from "clsx";
import type { ReactNode } from "react";

export interface ButtonProps {
    text: string;
    onClick?: () => void;
    isPrimary?: boolean;
    icon?: ReactNode;
    iconAtRight?: boolean;
    disabled?: boolean;
    additionalClasses?: string;
    alignText?: boolean;
}

export function Button(props: ButtonProps) {
    const buttonClasses = clsx(
        "px-4 py-2 font-bold rounded-full border transition-colors",
        "flex items-center gap-2",
        props.isPrimary
            ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black hover:bg-black/80 dark:hover:bg-white/80"
            : "border-black/15 dark:border-white/15 text-black dark:text-white bg-transparent hover:bg-black/15 dark:hover:bg-white/15",
        props.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        props.additionalClasses
    );

    const textClasses = clsx(
        props.alignText && "text-center flex-grow-1"
    )

    return (
        <button className={buttonClasses} onClick={props.onClick} disabled={props.disabled}>
            {props.icon != null && !props.iconAtRight ? (
                <span>{props.icon}</span>
            ) : null}
            <span className={textClasses}>
                {props.text}
            </span>
            
            {props.icon != null && props.iconAtRight ? (
                <span>{props.icon}</span>
            ) : null}
        </button>
    );
}
