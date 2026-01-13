import clsx from "clsx";
import type { ReactNode } from "react"

interface Props {
    icon: ReactNode;
    text: string;
    onClick?: () => void;
    selected: boolean;
}

export function SideNavigationButton(props: Props) {

    const buttonClasses = clsx(
        "flex items-center gap-2 px-4 py-2 border-b border-b-black/15 cursor-pointer",
        props.selected ? "bg-black/15" : "bg-transparent",
        props.selected ? "hover:bg-black/35" : "hover:bg-black/15",
        "transition-colors"
    )

    return <button className={buttonClasses} onClick={props.onClick}>
        <span>
            {props.icon}
        </span>
        <span className="text-black font-bold text-xl">
            {props.text}
        </span>
    </button>
}