import clsx from "clsx";
import type React from "react";

interface Props extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    disabled?: boolean;
}

export function TextAreaInput({disabled = false, className, ...props}: Props) {
    const classes = clsx(
        "transition-colors px-2 py-2 w-[90vw] sm:w-[80vw] md:w-[60vw] lg:w-[40vw] h-[60vh] rounded-md border border-black/15 focus:outline-none focus:border-black/35",
        disabled ? "cursor-not-allowed opacity-50" : "",
        className
    );

    

    return <textarea disabled={disabled} className={classes} {...props}></textarea>;
}
