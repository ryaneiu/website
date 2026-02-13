import { Button, type ButtonProps } from "./Button";
import { Spinner } from "./SimpleSpinner";

interface LoadableButtonProps extends ButtonProps {
    isLoading: boolean;
}

export function LodableButton(props: LoadableButtonProps) {

    const icon = props.isLoading ? <Spinner></Spinner> : props.icon;

    return <Button icon={icon} iconAtRight={props.iconAtRight} isPrimary={props.isPrimary} onClick={props.onClick} text={props.text} disabled={props.isLoading || props.disabled}></Button>
}