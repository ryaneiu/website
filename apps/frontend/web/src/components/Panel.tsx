import clsx from "clsx";
import type { ReactNode, ElementType, ComponentPropsWithoutRef } from "react";

type PanelProps<T extends ElementType> = {
    as?: T;
    children: ReactNode;
    className?: string;
    slim?: boolean;
    hoverable?: boolean;
} & ComponentPropsWithoutRef<T>;

export function Panel<T extends ElementType = "div">({
    as,
    children,
    className,
    slim,
    hoverable,
    ...rest
}: PanelProps<T>) {
    const Component = as || "div";

    const panelClasses = clsx(
        "rounded-md border border-black/15 shadow-md dark:shadow-white/5 dark:border-white/15",
        slim ? "px-2 py-2" : "px-4 py-4",
        hoverable && "hover:bg-black/3 dark:hover:bg-white/3",
        className,
    );

    return (
        <Component className={panelClasses} {...rest}>
            {children}
        </Component>
    );
}
