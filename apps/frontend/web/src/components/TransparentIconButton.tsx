import type { ReactNode } from "react";

interface Props {
    icon: ReactNode;
    onClick?: () => void;
}

export function TransparentIconButton(props: Props) {
    return <button onClick={props.onClick} className="px-0.5 py-0.5 border border-black/0 rounded-full hover:border-black/15 transition-colors cursor-pointer">
        {props.icon}
    </button>
}