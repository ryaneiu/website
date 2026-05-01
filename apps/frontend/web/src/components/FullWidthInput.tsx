import clsx from "clsx";
import { forwardRef, useLayoutEffect, useRef, useState, type HTMLInputTypeAttribute } from "react";

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
            "px-2 py-2 border rounded-md w-full transition-colors duration-300 w-full max-w-full",
            props.disabled ? "cursor-not-allowed opacity-50" : "",
            props.hasError
                ? "border-red-700 text-red-700"
                : "border-black/35 dark:border-white/35",
        );

fgdgfdgfs

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
>(function FullWidthInputWithLabel(props: PropsWithLabel, forwardedRef) {
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

    // hacky fix for css problem
    // TODO: properly fix reflow thing
    const localRef = useRef<HTMLInputElement | null>(null);
    const [inputWidth, setInputWidth] = useState<number | null>(null);

    const setRefs = (node: HTMLInputElement | null) => {
        localRef.current = node;

        if (typeof forwardedRef === "function") {
            forwardedRef(node);
        } else if (forwardedRef) {
            (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }
    };

    useLayoutEffect(() => {
        if (!localRef.current) return;

        const update = () => {
            setInputWidth(localRef.current!.getBoundingClientRect().width);
        };

        update();

        const ro = new ResizeObserver(update);
        ro.observe(localRef.current);

        return () => ro.disconnect();
    }, []);

    return (
        <div className="reflex flex-col w-full min-w-0 gap-1">
            <label className={labelClasses}>
                {props.labelName}
            </label>
            <FullWidthInput
                ref={setRefs}
                hasError={
                    props.currentError != "" && props.currentError != null
                }
                onChange={props.onChange}
                {...props}
            ></FullWidthInput>
            {props.currentError && (
                <p className="min-w-0 text-red-700 text-xs whitespace-normal break-words" style={{
                    width: `${inputWidth}px`
                }}>
                {props.currentError || "\u00A0"}
                </p>
            )}
        </div>
    );
});
