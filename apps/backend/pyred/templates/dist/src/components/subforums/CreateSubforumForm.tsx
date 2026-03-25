import { useState } from "react";
import { API_ENDPOINT } from "../../Config";
import { getStoredAccessToken } from "../../auth/Authentication";
import { extractDetailFromErrorResponse } from "../../Utils";
import { notifyErrorDefault, notifySuccessDefault } from "../../stores/NotificationsStore";
import { Button } from "../Button";
import { InputComponent } from "../InputComponent";
import { TextAreaInput } from "../TextAreaInput";

export type SubforumDto = {
    id: number;
    title: string;
    slug: string;
    description: string;
    creator: number | null;
    created_at: string;
};

interface Props {
    onCreated: (subforum: SubforumDto) => void;
}

const prohibitedCharacters = ["\\", "/", "<", ">", "[", "]", "{", "}", "|"];

export function CreateSubforumForm({ onCreated }: Props) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    const onCreateSubforum = async () => {
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
            notifyErrorDefault("You need to be logged in to create a subforum");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_ENDPOINT}/api/posts/subforums/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: trimmedTitle,
                    description: description.trim(),
                }),
            });

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
    };

    return (
        <div className="flex flex-col gap-2 border border-black/15 rounded-md p-3 bg-white">
            <h2 className="font-semibold text-lg">Create Subforum</h2>
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
                    text={loading ? "Creating..." : "Create Subforum"}
                    onClick={onCreateSubforum}
                    isPrimary={true}
                    disabled={loading}
                />
            </div>
        </div>
    );
}
