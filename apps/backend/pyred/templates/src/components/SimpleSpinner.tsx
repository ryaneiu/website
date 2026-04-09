import clsx from "clsx";

interface Props {
    isWhite?: boolean;
}

export function Spinner(props: Props) {
    const classes = clsx(
        "w-5 h-5 border-3 border-t-transparent rounded-full animate-spin",
        props.isWhite ? "border-white dark:border-black transition-colors duration-300" : "border-black dark:border-white transition-colors duration-300"
    )
    return (
        <div className={classes}></div>
    );
}
