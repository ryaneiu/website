import clsx from "clsx";
import { forwardRef, type HTMLInputTypeAttribute } from "react";

interface Props {
    disabled?: boolean;
    type: HTMLInputTypeAttribute;
    name: string;
    placeholder: string;
    hasError?: boolean;
    onChange?: () => void;
}

interface PropsWithLabel extends Props {
    labelName: string;
    currentError: string;
}

export const FullWidthInput = forwardRef<HTMLInputElement, Props>(
    function FullWidthInput(props: Props, ref) {
        const classes = clsx(
            "px-2 py-2 border rounded-md w-full transition-colors duration-300",
            props.disabled ? "cursor-not-allowed opacity-50" : "",
            props.hasError
                ? "border-red-700 text-red-700"
                : "border-black/35 dark:border-white/35",
        );

        return (
            <input
                className={classes}
                placeholder={props.placeholder}
                type={props.type}
                name={props.name}
                ref={ref}
                onChange={() => {
                    console.log("CHANGED");
                    if (props.onChange) {
                        
                        props.onChange();
                    }
                }}
            ></input>
        );
    },
);

export const FullWidthInputWithLabel = forwardRef<
    HTMLInputElement,
    PropsWithLabel
>(function fullWidthInputWithLabel(props: PropsWithLabel, ref) {
    console.log(
        "Error is:",
        props.currentError,
        "length: ",
        props.currentError.length,
    );

    return (
        <div className="flex flex-col w-full gap-1">
            <label className="text-xs text-black/75 dark:text-white/75">
                {props.labelName}
            </label>
            <FullWidthInput
                type={props.type}
                name={props.name}
                placeholder={props.placeholder}
                ref={ref}
                hasError={
                    props.currentError != "" && props.currentError != null
                }
                onChange={props.onChange}
            ></FullWidthInput>
            {props.currentError && (
                <span className="text-red-700 text-xs">
                    {props.currentError}
                </span>
            )}
        </div>
    );
});
