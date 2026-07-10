import clsx from "clsx";
import { useRef, useState, type MouseEvent, type ReactNode } from "react";
import confetti from "canvas-confetti";

interface Props {
    icon: ReactNode;
    iconFilled: ReactNode;
    text: string;
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
    interactable: boolean;
    isActive?: boolean;
    fillColorText: string;
    fillColorBg: string;
    heartButton?: boolean;
}

const heartShape = confetti.shapeFromText({ text: "❤️" });

export function ReactionButton(props: Props) {
    const iconRef = useRef<HTMLSpanElement>(null);
    const [hovered, setHovered] = useState<boolean>(false);

    const showFilled =
        props.isActive === true || (hovered && props.interactable);

    const fireHearts = () => {
        const icon = iconRef.current;
        if (!icon) return;

        const rect = icon.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + (rect.height - 20) / 2) / window.innerHeight;

        confetti({
            particleCount: 20,
            spread: 360,
            startVelocity: 5,
            origin: { x, y },
            shapes: [heartShape],
            scalar: 1.5,
            ticks: 60,
            gravity: 0.5,
            drift: 0,
            disableForReducedMotion: true,
        });
    };

    const classes = clsx(
        "flex gap-6 items-center rounded-full bg-black/5 dark:bg-white/5 px-3 py-1 relative",
        props.interactable ? "cursor-pointer" : "",
        showFilled && props.fillColorText,
    );

    const hoverEffectClasses = clsx(
        "absolute w-full h-full top-[50%] left-[50%] -translate-[50%] rounded-full p-4 transition-all",
        hovered && props.interactable
            ? "scale-100 opacity-10"
            : "scale-0 opacity-0",
        props.fillColorBg,
    );

    const countClasses = clsx(
        "font-bold text-md transition-colors duration-300",
        showFilled && props.fillColorText,
    );

    return (
        <button
            className={classes}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={(e) => {
                if (props.heartButton && !props.isActive) {
                    fireHearts();
                }
                if (props.onClick) {
                    props.onClick(e);
                }
            }}
        >
            <span ref={iconRef} className="flex items-center relative">
                <div className={hoverEffectClasses}></div>
                {props.isActive ? props.iconFilled : props.icon}
            </span>

            <span className={countClasses}>{props.text}</span>
        </button>
    );
}
