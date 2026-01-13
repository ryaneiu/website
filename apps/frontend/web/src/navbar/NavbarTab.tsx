
interface Props {
    text: string;
}

export function NavbarTab(props: Props) {
    return <span className="text-xl hover:underline cursor-pointer">
        {props.text}
    </span> 
}