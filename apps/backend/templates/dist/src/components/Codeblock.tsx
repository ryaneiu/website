import type { ReactNode } from "react";

interface Props {
    children: ReactNode
}

export function Codeblock(props: Props) {
    return <code className="bg-black/5 rounded-md px-2 py-0.25 whitespace-pre-wrap">
        {props.children}
    </code>
}