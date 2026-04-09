interface Props {
    sectionName: string;
}

export function SectionSeparator(props: Props) {
    return (
        <div className="flex gap-3 w-full items-center">
            <div className="h-[1px] bg-black dark:bg-white flex-grow-1 transition-colors duration-300"></div>
            <h2 className="font-bold">{props.sectionName}</h2>
            <div className="h-[1px] bg-black dark:bg-white flex-grow-1 transition-colors duration-300"></div>
        </div>
    );
}
