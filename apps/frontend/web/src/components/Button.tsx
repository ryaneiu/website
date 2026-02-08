import clsx from "clsx";
import type { ReactNode } from "react";

interface Props {
    text: string;
    onClick?: () => void;
    isPrimary?: boolean;
    icon?: ReactNode;
    iconAtRight?: boolean;
}

export function Button(props: Props) {
    const buttonClasses = clsx(
        "px-4 py-2 font-bold rounded-full border cursor-pointer transition-colors",
        "flex items-center gap-2",
        props.isPrimary
            ? "border-black bg-black text-white hover:bg-black/80"
            : "border-black/15 text-black bg-transparent hover:bg-black/15",
    );

    return (
        <button className={buttonClasses} onClick={props.onClick}>
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
