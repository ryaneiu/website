import type { ReactNode } from "react"

interface Props {
    icon: ReactNode;
    text: string;
    onClick?: () => void;
}

export function SideNavigationButton(props: Props) {
    return <button className="flex items-center gap-2 px-4 py-2 border-b border-b-black/15 cursor-pointer hover:bg-black/15 transition-colors">
        <span>
            {props.icon}
        </span>
        <span className="text-black font-bold text-xl">
            {props.text}
        </span>
    </button>
}