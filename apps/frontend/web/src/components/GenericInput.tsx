import clsx from "clsx";
import type React from "react";



export function GenericInput(props: React.InputHTMLAttributes<HTMLInputElement>) {

    const classes = clsx(
        "px-2 py-2 rounded-md border border-black/15",
        "focus:outline-none focus:border-black/35",
        "transition-colors",
        props.disabled ? "cursor-not-allowed opacity-50" : "",
        props.className,
    )

    return <input {...props} className={classes}></input>

}