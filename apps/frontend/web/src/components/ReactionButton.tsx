import clsx from "clsx";
import { useState, type ReactNode } from "react";

interface Props {
    icon: ReactNode;
    iconFilled: ReactNode;
    text: string;
    onClick?: () => void;
    interactable: boolean;
}

export function ReactionButton(props: Props) {

    const [hovered, setHovered] = useState<boolean>(false);

    const classes = clsx(
        "flex gap-1 items-center",
        props.interactable ? "cursor-pointer" : ""
    );

    return <button className={classes} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={props.onClick}>
        <span className="flex items-center">
            {(hovered && props.interactable) ? props.iconFilled : props.icon}
        </span>
        <span className="font-bold text-black/80 text-md">{props.text}</span>
    </button>
}