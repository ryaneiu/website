import type { ReactNode } from "react";

interface Props {
    label: string;
    element: ReactNode;
}

export function ElementWithLabel(props: Props) {
    return <div className="flex flex-col gap-2">
        <label className="text-black font-bold">{props.label}</label>
        {props.element}
    </div>
}