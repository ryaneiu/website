import clsx from "clsx";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
    disabled?: boolean;
}

export function InputComponent({
    disabled = false,
    className,
    ...props
}: Props) {
    const classes = clsx(
        "transition-colors border p-2 rounded-md focus:outline-none focus:border-black/35",
        disabled ? "cursor-not-allowed opacity-50" : "",
        className,
    );
    //w-[90vw] sm:w-[80vw] md:w-[60vw] lg:w-[40vw]

    return <input className={classes} disabled={disabled} {...props} />;
}
