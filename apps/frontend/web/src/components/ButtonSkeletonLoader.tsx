import clsx from "clsx";

interface Props {
    additionalClasses: string;
}

export function ButtonSkeletonLOader(props: Props) {
    const buttonClasses = clsx(
        "px-4 py-2 font-bold rounded-full skeleton-loader w-fit h-fit"
    );

    return <div className={buttonClasses}>
        <div className={props.additionalClasses}></div>
    </div>;
}
