import { useRef } from "react";
import { Button } from "../../components/Button";
import { Panel } from "../../components/Panel";

interface Props {
    onReplyClicked: (textContent: string) => void;
    setVisible: (visibility: boolean) => void;
    placeholder: string;
}

export function CommentReplySection(props: Props) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${(e.target as HTMLTextAreaElement).scrollHeight}px`;
        }
    };

    return (
        <Panel className="flex flex-col gap-2" slim={true}>
            <textarea
                rows={1}
                className="w-full py-2 focus:outline-none h-auto"
                placeholder={props.placeholder}
                ref={textareaRef}
                onInput={handleInput}
            ></textarea>
            <div className="ml-auto flex items-center gap-2">
                <Button
                    icon={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                            className="text-white dark:text-black transition-all duration-300"
                        >
                            <path d="M440-400h80v-120h120v-80H520v-120h-80v120H320v80h120v120ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z" />
                        </svg>
                    }
                    isPrimary={true}
                    text="Reply"
                    onClick={() => props.onReplyClicked(textareaRef.current?.value ?? "")}
                ></Button>
                <Button
                    text="Cancel"
                    isPrimary={false}
                    onClick={() => props.setVisible(false)}
                ></Button>
            </div>
        </Panel>
    );
}
