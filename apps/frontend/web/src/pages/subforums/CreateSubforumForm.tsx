import { useState } from "react";
import {
    notifyErrorDefault,
    notifySuccessDefault,
} from "../../stores/NotificationsStore";
import { API_ENDPOINT } from "../../Config";
import { getStoredAccessToken } from "../../auth/Authentication";
import { extractDetailFromErrorResponse } from "../../Utils";
import {
    PostCreationModal,
    type SubforumDto,
} from "../../components/subforums/PostCreationModal";

interface Props {
    onCreated: (s: SubforumDto) => void;
    onHide: () => void;
}

const prohibitedCharacters = ["\\", "/", "<", ">", "[", "]", "{", "}", "|"];

export function CreateSubforumForm(props: Props) {
    const [title, setTitle] = useState<string>("");
    const [description, setDescription] = useState<string>("");

    const onCreateSubforum = async () => {
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
            props.onCreated(created);
            setTitle("");
            setDescription("");
            notifySuccessDefault("Subforum created");
            props.onHide();
        } catch (e) {
            throw new Error("Error: " + e);
        }
    };

    return <PostCreationModal
        onClickCreate={onCreateSubforum}
        onCloseModal={props.onHide}
        onDescriptionChanged={setDescription}
        onTitleChanged={setTitle}
        buttonCreateText="Create Subforum"
        buttonLoadingText="Creating..."
        titlePlaceholder="Subforum Name"
        descriptionPlaceholder="Let people know what this subforum is about!"
    ></PostCreationModal>;
}
