import clsx from "clsx";

interface Props {
    isWhite?: boolean;
}

export function Spinner(props: Props) {
    const classes = clsx(
        "w-5 h-5 border-3 border-t-transparent rounded-full animate-spin",
        props.isWhite ? "border-white" : "border-black"
    )
    return (
        <div className={classes}></div>
    );
}
