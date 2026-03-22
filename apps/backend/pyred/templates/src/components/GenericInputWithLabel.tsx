import { ElementWithLabel } from "./ElementWithLabel";
import { GenericInput } from "./GenericInput";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

export function InputWithLabel(props: Props) {
    return (
        <ElementWithLabel
            label={props.label}
            element={<GenericInput {...props} />}
        />
    );
}
