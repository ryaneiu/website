import { ReactionButton } from "../../components/ReactionButton";

interface Props {
    title: string;
    description: string;
    timePublished: string;
}

export function Post(props: Props) {
    return (
        <div className="flex flex-col gap-2 bg-white border border-black/15 p-4 rounded-md w-full">
            <h1 className="text-xl font-bold">{props.title}</h1>
            <p>{props.description}</p>

            <div className="flex gap-2">
                <ReactionButton
                    icon={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="20px"
                            viewBox="0 -960 960 960"
                            width="20px"
                            fill="#1f1f1f"
                        >
                            <path d="m480-120-58-52q-101-91-167-157T150-447.5Q111-500 95.5-544T80-634q0-94 63-157t157-63q52 0 99 22t81 62q34-40 81-62t99-22q94 0 157 63t63 157q0 46-15.5 90T810-447.5Q771-395 705-329T538-172l-58 52Zm0-108q96-86 158-147.5t98-107q36-45.5 50-81t14-70.5q0-60-40-100t-100-40q-47 0-87 26.5T518-680h-76q-15-41-55-67.5T300-774q-60 0-100 40t-40 100q0 35 14 70.5t50 81q36 45.5 98 107T480-228Zm0-273Z" />
                        </svg>
                    }
                    count={175}
                ></ReactionButton>
                <ReactionButton
                    icon={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="#1f1f1f"
                        >
                            <path d="M240-400h480v-80H240v80Zm0-120h480v-80H240v80Zm0-120h480v-80H240v80ZM880-80 720-240H160q-33 0-56.5-23.5T80-320v-480q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v720ZM160-320h594l46 45v-525H160v480Zm0 0v-480 480Z" />
                        </svg>
                    }
                    count={24}
                ></ReactionButton>
            </div>
            <span className="text-black/50 text-sm">
                Posted: {props.timePublished}
            </span>
        </div>
    );
}
