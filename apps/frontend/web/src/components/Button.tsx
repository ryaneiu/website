import clsx from "clsx";
import type { ReactNode } from "react";

export interface ButtonProps {
    text: string;
    onClick?: () => void;
    isPrimary?: boolean;
    icon?: ReactNode;
    iconAtRight?: boolean;
    disabled?: boolean;
}

export function Button(props: ButtonProps) {
    const buttonClasses = clsx(
        "px-4 py-2 font-bold rounded-full border transition-colors",
        "flex items-center gap-2",
        props.isPrimary
            ? "border-black bg-black text-white hover:bg-black/80"
            : "border-black/15 text-black bg-transparent hover:bg-black/15",
        props.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
    );

    return (
        <button className={buttonClasses} onClick={props.onClick} disabled={props.disabled}>
            {props.icon != null && !props.iconAtRight ? (
                <span>{props.icon}</span>
            ) : null}
            {props.text}
            {props.icon != null && props.iconAtRight ? (
                <span>{props.icon}</span>
            ) : null}
        </button>
    );
}
