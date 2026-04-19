import clsx from "clsx";
import { forwardRef, type HTMLInputTypeAttribute } from "react";

interface Props {
    disabled?: boolean;
    type: HTMLInputTypeAttribute;
    name: string;
    placeholder: string;
    hasError?: boolean;
    onChange?: (v: string) => void;
    value?: string;
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

        const {onChange, ...rest} = props;

        return (
            <input
                className={classes}
                ref={ref}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    console.log("CHANGED");
                    if (onChange) {
                        
                        onChange(e.target.value);
                    }
                }}
                {...rest}
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

    const labelClasses = clsx(
        "text-xs text-black/75 dark:text-white/75",
        props.disabled && "opacity-50"
    )

    return (
        <div className="flex flex-col w-full gap-1">
            <label className={labelClasses}>
                {props.labelName}
            </label>
            <FullWidthInput
                ref={ref}
                hasError={
                    props.currentError != "" && props.currentError != null
                }
                onChange={props.onChange}
                {...props}
            ></FullWidthInput>
            {props.currentError && (
                <span className="text-red-700 text-xs">
                    {props.currentError}
                </span>
            )}
        </div>
    );
});
