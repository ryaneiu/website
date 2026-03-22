import clsx from "clsx";
import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom";

interface Props {
    icon: ReactNode;
    text: string;
    navigateTo: string;
    selected: boolean;
    filledIcon: ReactNode;
}

export function SideNavigationButton(props: Props) {
    const navigate = useNavigate();

    const buttonClasses = clsx(
        "flex items-center gap-2 px-4 py-2 cursor-pointer rounded-md w-full",
        props.selected ? "bg-black/10" : "bg-transparent",
        props.selected ? "hover:bg-black/15" : "hover:bg-black/5",
        "transition-colors"
    )

    return <button className={buttonClasses} onClick={() => {
        navigate(props.navigateTo);
    }}>
        <span>
            {props.selected ? props.filledIcon : props.icon}
        </span>
        <span className="text-black font-bold">
            {props.text}
        </span>
    </button>
}