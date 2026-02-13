import clsx from "clsx";
import { forwardRef, type ReactNode } from "react";

interface Props {
    icon: ReactNode;
    square?: boolean;
    larger?: boolean;
    onClick?: () => void;
}

export const  TransparentIconButton = forwardRef<HTMLButtonElement, Props>(function TransparentIconButton(props: Props, ref) {

    const classes = clsx(
        "border border-black/0 hover:border-black/15 transition-colors cursor-pointer",
        props.square ? "rounded-md": "rounded-full",
        props.larger ? "px-1 py-1" : "px-0.5 py-0.5"
    );

    return <button onClick={props.onClick} className={classes} ref={ref}>
        {props.icon}
    </button>
});