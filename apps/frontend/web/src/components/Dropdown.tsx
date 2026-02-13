import {type ReactNode } from "react";

type DropdownOption = {
    icon: ReactNode;
    text: string;
    onClick?: () => void;
};

interface Props {
    options: DropdownOption[];
    floatingRef: (node: HTMLElement | null) => void;
    x: number | null;
    y: number | null;
    strategy: React.CSSProperties["position"];
    visible: boolean;
}

export function Dropdown({
    options,
    floatingRef,
    x,
    y,
    strategy,
    visible,
}: Props) {
    const onOptionClicked = (option: DropdownOption) => {
        if (option.onClick) {
            option.onClick();
        }
    };

    return (
        visible && (
            <div
                ref={floatingRef}
                style={{
                    position: strategy,
                    top: y ?? 0,
                    left: x ?? 0,
                }}
                className="bg-white border border-black/15 rounded-md flex flex-col shadow-lg z-90"
            >
                {options.map((option, i) => (
                    <button
                        key={i}
                        onClick={() => onOptionClicked(option)}
                        className="border-b border-black/5 flex items-center gap-2 px-2 py-2 hover:bg-black/5 cursor-pointer transition-colors"
                    >
                        <span>{option.icon}</span>
                        <span className="font-bold">{option.text}</span>
                    </button>
                ))}
            </div>
        )
    );
}
