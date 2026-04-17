import { useState, type ClipboardEvent } from "react";
import { InputComponent } from "../InputComponent";
import { TextAreaInput } from "../TextAreaInput";
import { createPortal } from "react-dom";
import { TransparentIconButton } from "../TransparentIconButton";
import { LoadableButton } from "../LoadableButton";
import { Fade, FadeUp } from "../AnimatedPresenceDiv";
import { BlurredImage } from "../BlurredImage";

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
    onDescriptionPaste?: (event: ClipboardEvent<HTMLTextAreaElement>) => void;
    onTitleChanged: (s: string) => void;
    onImageUrlChanged?: (s: string) => void;
    onImagePaste?: (event: ClipboardEvent<HTMLInputElement>) => void;
    onCloseModal: () => void;
    buttonCreateText: string;
    buttonLoadingText: string;
    titlePlaceholder: string;
    imagePlaceholder?: string;
    imageValue?: string;
    imagePreviewUrl?: string | null;
    imageAltText?: string;
    imageInstruction?: string;
    descriptionPlaceholder: string;
    modalTitle: string;
    showImageInput?: boolean;
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
                            {props.modalTitle}
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
                        {props.showImageInput && (
                            <>
                                <InputComponent
                                    placeholder={
                                        props.imagePlaceholder ??
                                        "Paste image or image URL (optional)"
                                    }
                                    value={props.imageValue ?? ""}
                                    onChange={(event) =>
                                        props.onImageUrlChanged?.(
                                            event.target.value,
                                        )
                                    }
                                    onPaste={props.onImagePaste}
                                    disabled={loading}
                                    className="w-full"
                                />
                                {props.imageInstruction && (
                                    <p className="w-full text-sm text-black/60 dark:text-white/60 transition-colors duration-300">
                                        {props.imageInstruction}
                                    </p>
                                )}
                            </>
                        )}
                        {props.showImageInput && props.imagePreviewUrl != null && (
                            <div className="w-full">
                                <BlurredImage
                                    src={props.imagePreviewUrl}
                                    alt={props.imageAltText ?? "Attached image preview"}
                                    isBlurred={false}
                                />
                            </div>
                        )}
                        <TextAreaInput
                            className="!w-full h-28"
                            placeholder={props.descriptionPlaceholder}
                            defaultValue=""
                            onChange={(event) =>
                                props.onDescriptionChanged(event.target.value)
                            }
                            onPaste={props.onDescriptionPaste}
                            disabled={loading}
                        />
                        <div className="w-fit">
                            <LoadableButton
                                text={
                                    loading ? props.buttonLoadingText : props.buttonCreateText
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
