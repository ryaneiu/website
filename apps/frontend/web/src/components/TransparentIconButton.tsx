import clsx from "clsx";
import type { ReactNode } from "react";

interface Props {
    icon: ReactNode;
    square?: boolean;
    onClick?: () => void;
}

export function TransparentIconButton(props: Props) {

    const classes = clsx(
        "px-0.5 py-0.5 border border-black/0 hover:border-black/15 transition-colors cursor-pointer",
        props.square ? "rounded-md": "rounded-full"
    );

    return <button onClick={props.onClick} className={classes}>
        {props.icon}
    </button>
}