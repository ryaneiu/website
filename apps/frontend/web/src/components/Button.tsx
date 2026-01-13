import clsx from "clsx";

interface Props {
    text: string;
    onClick?: () => void;
    isPrimary?: boolean;
}

export function Button(props: Props) {

    const buttonClasses = clsx(
        "px-4 py-2 font-bold rounded-full border cursor-pointer transition-colors",
        props.isPrimary ? "border-black bg-black text-white hover:bg-black/80" : "border-black/15 text-black bg-transparent hover:bg-black/15"
    )

    return <button className={buttonClasses} onClick={props.onClick}>
        {props.text}
    </button>
}