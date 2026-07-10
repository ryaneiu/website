import { Button } from "./Button";

type Action = {
    text: string;
    handler: () => void;
    secondary: boolean;
};

interface Props {
    text: string;
    desc: string;
    actions: Action[];
}

export function NotificationBanner(props: Props) {
    return (
        <div className="w-full p-4 flex items-center justify-between gap-4 border border-black/15 dark:border-white/15 rounded-md">
            <div className="flex flex-col">
                <span className="font-semibold text-black dark:text-white">{props.text}</span>
                <span className="text-white/50 text-xs">{props.desc}</span>
            </div>
            
            <div className="flex items-center gap-2 md:flex-row flex-col">
                {props.actions.map((v) => {
                    return (
                        <Button
                            smaller={true}
                            text={v.text}
                            isPrimary={!v.secondary}
                            onClick={v.handler}
                            nowrap={true}
                        ></Button>
                    );
                })}
            </div>
        </div>
    );
}
