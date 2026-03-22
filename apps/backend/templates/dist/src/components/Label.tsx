
interface Props {
    text: string;
}

export function Label(props: Props) {
    return <h3 className="font-bold text-black">{props.text}</h3>
}