import type { ReactNode } from "react";

interface Props {
    icon: ReactNode;
    count: number;
}

export function ReactionButton(props: Props) {
    return <span className="flex gap-1 items-center">
        <span className="flex items-center">
            {props.icon}
        </span>
        <span className="font-bold text-black/80 text-md">{props.count}</span>
    </span>
}