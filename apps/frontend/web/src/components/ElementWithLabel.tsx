import clsx from "clsx";
import type { ReactNode } from "react";

interface Props {
    label: string;
    element: ReactNode;
    className?: string;
}

export function ElementWithLabel(props: Props) {
    const classes = clsx(
        "flex flex-col gap-2",
        props.className
    );
    return <div className={classes}>
        <label className="font-bold">{props.label}</label>
        {props.element}
    </div>
}