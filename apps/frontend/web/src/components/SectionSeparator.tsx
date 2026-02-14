interface Props {
    sectionName: string;
}

export function SectionSeparator(props: Props) {
    return (
        <div className="flex gap-3 w-full items-center">
            <div className="h-[1px] bg-black flex-grow-1"></div>
            <h2 className="text-black font-bold">{props.sectionName}</h2>
            <div className="h-[1px] bg-black flex-grow-1"></div>
        </div>
    );
}
