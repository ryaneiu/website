import { useState } from "react";
import { API_ENDPOINT } from "../../Config";
import { getStoredAccessToken } from "../../auth/Authentication";
import { extractDetailFromErrorResponse } from "../../Utils";
import { notifyErrorDefault, notifySuccessDefault } from "../../stores/NotificationsStore";
import { Button } from "../Button";
import { InputComponent } from "../InputComponent";
import { TextAreaInput } from "../TextAreaInput";
import type { SubforumDto } from "./CreationModal";

interface Props {
    subforum: SubforumDto;
    onUpdated: (subforum: SubforumDto) => void;
}

const prohibitedCharacters = ["\\", "/", "<", ">", "[", "]", "{", "}", "|"];

export function UpdateSubforumForm({ subforum, onUpdated }: Props) {
    const [title, setTitle] = useState(subforum.title);
    const [description, setDescription] = useState(subforum.description);
    const [loading, setLoading] = useState(false);

    const onUpdateSubforum = async () => {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            notifyErrorDefault("Subforum title cannot be empty");
            return;
        }
        if (prohibitedCharacters.some((character) => trimmedTitle.includes(character))) {
            notifyErrorDefault("Subforum title contains prohibited characters");
            return;
        }

        const token = await getStoredAccessToken();
        if (!token) {
            notifyErrorDefault("You need to be logged in to update a subforum");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `${API_ENDPOINT}/api/posts/subforums/${subforum.slug}/`,
                {
                    method: "PUT",
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
                notifyErrorDefault(detail ?? "Failed to update subforum");
                return;
            }

            const updated = (await response.json()) as SubforumDto;
            onUpdated(updated);
            notifySuccessDefault("Subforum updated");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-2 border border-black/15 rounded-md p-3 bg-white">
            <h3 className="font-semibold">Update Subforum</h3>
            <InputComponent
                placeholder="Subforum title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={loading}
            />
            <TextAreaInput
                className="w-full h-28"
                placeholder="Description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                disabled={loading}
            />
            <div className="w-fit">
                <Button
                    text={loading ? "Saving..." : "Save"}
                    onClick={onUpdateSubforum}
                    isPrimary={true}
                    disabled={loading}
                />
            </div>
        </div>
    );
}
