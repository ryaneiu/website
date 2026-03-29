import { useState } from "react";
import { InputComponent } from "../InputComponent";
import { TextAreaInput } from "../TextAreaInput";
import { createPortal } from "react-dom";
import { TransparentIconButton } from "../TransparentIconButton";
import { LoadableButton } from "../LoadableButton";
import { Fade, FadeUp } from "../AnimatedPresenceDiv";

export type SubforumDto = {
    id: number;
    title: string;
    slug: string;
    description: string;
    creator: number | null;
    created_at: string;
};

interface Props {
    onClickCreate: () => void;
    onDescriptionChanged: (s: string) => void;
    onTitleChanged: (s: string) => void;
    onCloseModal: () => void;
    buttonCreateText: string;
    buttonLoadingText: string;
    titlePlaceholder: string;
    descriptionPlaceholder: string;
}

export function PostCreationModal(props: Props) {
    // const [title, setTitle] = useState("");
    // const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    /* const onCreateSubforum = async () => {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            notifyErrorDefault("Subforum title cannot be empty");
            return;
        }
        if (
            prohibitedCharacters.some((character) =>
                trimmedTitle.includes(character),
            )
        ) {
            notifyErrorDefault("Subforum title contains prohibited characters");
            return;
        }

        const token = await getStoredAccessToken();
        if (!token) {
            notifyErrorDefault("You need to be logged in to create a subforum");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `${API_ENDPOINT}/api/posts/subforums/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        title: trimmedTitle,
                        description: description.trim(),
                    }),
                },
            );

            if (!response.ok) {
                const detail = await extractDetailFromErrorResponse(response);
                notifyErrorDefault(detail ?? "Failed to create subforum");
                return;
            }

            const created = (await response.json()) as SubforumDto;
            onCreated(created);
            setTitle("");
            setDescription("");
            notifySuccessDefault("Subforum created");
        } finally {
            setLoading(false);
        }
    }; */

    const onCreateClicked = async () => {
        setLoading(true);
        await props.onClickCreate();
        setLoading(false);
    };

    return createPortal(
        <Fade className="fixed top-0 left-0 z-99 bg-black/50 w-full h-full">
            <FadeUp
                className="border border-black/15 rounded-md bg-white fixed top-0 left-0 z-99 bg-white w-[90vw] max-w-[600px] 
  h-fit fixed top-1/2 left-1/2 z-50
  -translate-x-1/2 -translate-y-1/2 shadow-lg"
            >
                <div className="relative w-full h-fit">
                    <div className="absolute right-0 top-0 m-1">
                        <TransparentIconButton
                            icon={
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="24px"
                                    viewBox="0 -960 960 960"
                                    width="24px"
                                    fill="#1f1f1f"
                                >
                                    <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                                </svg>
                            }
                            onClick={props.onCloseModal}
                        ></TransparentIconButton>
                    </div>
                    <div className="flex flex-col gap-2 items-center p-3">
                        <h2 className="font-semibold text-lg">
                            Create Subforum
                        </h2>
                        <InputComponent
                            placeholder={props.titlePlaceholder}
                            defaultValue=""
                            onChange={(event) =>
                                props.onTitleChanged(event.target.value)
                            }
                            disabled={loading}
                            className="w-full"
                        />
                        <TextAreaInput
                            className="!w-full h-28"
                            placeholder={props.descriptionPlaceholder}
                            defaultValue=""
                            onChange={(event) =>
                                props.onDescriptionChanged(event.target.value)
                            }
                            disabled={loading}
                        />
                        <div className="w-fit">
                            <LoadableButton
                                text={
                                    loading ? "Creating..." : "Create Subforum"
                                }
                                onClick={onCreateClicked}
                                isPrimary={true}
                                disabled={loading}
                                isLoading={loading}
                            />
                        </div>
                    </div>
                </div>
            </FadeUp>
        </Fade>,

        document.body,
    );
}
