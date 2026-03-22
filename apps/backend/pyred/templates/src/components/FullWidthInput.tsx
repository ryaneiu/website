import clsx from "clsx";
import { forwardRef, type HTMLInputTypeAttribute } from "react";

interface Props {
    disabled?: boolean;
    type: HTMLInputTypeAttribute;
    name: string;
    placeholder: string;
}

export const FullWidthInput = forwardRef<HTMLInputElement, Props>(
    function fullWidthInput(props: Props, ref) {
        const classes = clsx(
            "px-2 py-2 border border-black/15 rounded-md w-full",
            props.disabled ? "cursor-not-allowed opacity-50" : "",
        );

        return (
            <input
                className={classes}
                placeholder={props.placeholder}
                type={props.type}
                name={props.name}
                ref={ref}
            ></input>
        );
    },
);
