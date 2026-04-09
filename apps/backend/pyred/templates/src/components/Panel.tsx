import clsx from "clsx";
import type React from "react";
import type { ReactNode, ElementType, ComponentPropsWithoutRef } from "react";

type PolymorphicRef<T extends ElementType> =
  React.ComponentPropsWithRef<T>["ref"];

type PanelProps<T extends ElementType> = {
    as?: T;
    children: ReactNode;
    className?: string;
    slim?: boolean;
    hoverable?: boolean;
    ref?: PolymorphicRef<T>;
} & ComponentPropsWithoutRef<T>;

export function Panel<T extends ElementType = "div">({
    as,
    children,
    className,
    slim,
    hoverable,
    ref,
    ...rest
}: PanelProps<T>) {
    const Component = as || "div";

    const panelClasses = clsx(
        "rounded-md border border-black/15 shadow-md dark:shadow-white/5 dark:border-white/15 transition-colors duration-300",
        slim ? "px-2 py-2" : "px-4 py-4",
        hoverable && "hover:bg-black/3 dark:hover:bg-white/3 transition-colors duration-300",
        className,
    );

    return (
        <Component className={panelClasses} ref={ref} {...rest}>
            {children}
        </Component>
    )
}
