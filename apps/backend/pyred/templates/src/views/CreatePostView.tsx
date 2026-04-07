import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TransparentIconButton } from "../components/TransparentIconButton";
import { FadeUp } from "../components/AnimatedPresenceDiv";
import {
    notifyErrorDefault,
    notifySuccessDefault,
} from "../stores/NotificationsStore";
import { LoadableButton } from "../components/LoadableButton";
import { TextAreaInput } from "../components/TextAreaInput";
import { InputComponent } from "../components/InputComponent";
import { getStoredAccessToken } from "../auth/Authentication";
import { extractDetailFromErrorResponse } from "../Utils";
import { API_ENDPOINT } from "../Config";
import { Panel } from "../components/Panel";
import { Button } from "../components/Button";

export default function CreatePostView() {
    const navigate = useNavigate();

    // Post state
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [subforums, setSubforums] = useState<
        { title: string; slug: string }[]
    >([]);
    const [selectedSubforum, setSelectedSubforum] = useState("general");

    useEffect(() => {
        fetch(`${API_ENDPOINT}/api/posts/subforums/`, { method: "GET" })
            .then(async (res) => {
                if (!res.ok) {
                    throw new Error("Failed to load subforums");
                }
                return res.json();
            })
            .then((data) => {
                const parsed = Array.isArray(data)
                    ? data.map((v) => ({ title: v.title, slug: v.slug }))
                    : [];
                const hasGeneral = parsed.some((v) => v.slug === "general");
                const merged = hasGeneral
                    ? parsed
                    : [{ title: "General", slug: "general" }, ...parsed];
                setSubforums(merged);
            })
            .catch(() => {
                setSubforums([{ title: "General", slug: "general" }]);
            });
    }, []);

    const onCloseView = () => {
        navigate("/");
    };

    const onPublishPost = async () => {
        if (!title && !content) {
            alert("Please enter a title or content");
            return;
        }

        setLoading(true);
        try {
            console.log("Title: ", title, " content: ", content);

            const token = await getStoredAccessToken();
            if (!token) {
                throw new Error("No access token");
            }

            const res = await fetch(`${API_ENDPOINT}/api/posts/create/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    content,
                    content_markdown: content,
                    subforum: selectedSubforum,
                }),
            });

            if (!res.ok) {
                // Try to extract detail field
                const detail = await extractDetailFromErrorResponse(res);
                if (detail) throw new Error(detail);
                else
                    throw new Error("Failed to create post: " + res.statusText);
            }

            const data = await res.json();
            console.log("Post created:", data);

            /// alert("Post created!");
            notifySuccessDefault("Post created!");
            setTitle("");
            setContent("");
            navigate("/"); // back to homepage or wherever
        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : String(err);
            notifyErrorDefault(message);
        } finally {
            setLoading(false);
        }
    };

    const onCreateSubforum = async () => {
        const title = window.prompt("Subforum title")?.trim() ?? "";
        if (!title) return;
        const description =
            window.prompt("Subforum description (optional)")?.trim() ?? "";

        const token = await getStoredAccessToken();
        if (!token) {
            notifyErrorDefault("You need to be logged in to create a subforum");
            return;
        }

        const res = await fetch(`${API_ENDPOINT}/api/posts/subforums/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ title, description }),
        });

        if (!res.ok) {
            const detail = await extractDetailFromErrorResponse(res);
            notifyErrorDefault(detail ?? "Failed to create subforum");
            return;
        }

        const created = await res.json();
        const next = [
            ...subforums.filter((v) => v.slug !== created.slug),
            { title: created.title, slug: created.slug },
        ];
        setSubforums(next);
        setSelectedSubforum(created.slug);
        notifySuccessDefault("Subforum created!");
    };

    return (
        <FadeUp className="w-full h-[100vh] flex justify-center items-center dark:bg-zinc-900 text-black dark:text-white">
            <Panel className="flex flex-col gap-3 items-center relative shadow-lg max-h-[95vh] overflow-auto bg-white dark:bg-zinc-800 h-fit">
                {/* Close button */}
                <div className="absolute top-0 right-0 m-1">
                    <TransparentIconButton
                        onClick={onCloseView}
                        icon={
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="24px"
                                viewBox="0 -960 960 960"
                                width="24px"
                                fill="currentColor"
                            >
                                <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                            </svg>
                        }
                    />
                </div>

                <h1 className="text-3xl font-bold text-black dark:text-white">
                    Create Post
                </h1>

                <div className="w-[90vw] sm:w-[80vw] md:w-[60vw] lg:w-[40vw] flex justify-between items-center gap-2">
                    <select
                        className="px-2 py-2 border border-black/15 dark:border-white/15 rounded-md w-full"
                        value={selectedSubforum}
                        onChange={(e) => setSelectedSubforum(e.target.value)}
                        disabled={loading}
                    >
                        {subforums.map((subforum) => (
                            <option key={subforum.slug} value={subforum.slug}>
                                {subforum.title}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Title input */}
                <InputComponent
                    className="w-[90vw] sm:w-[80vw] md:w-[60vw] lg:w-[40vw]"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={loading}
                />

                {/* Content textarea */}
                <TextAreaInput
                    className="px-2 py-2 w-[90vw] sm:w-[80vw] md:w-[60vw] lg:w-[40vw] h-[50vh] rounded-md border border-black/15 dark:border-white/15 focus:outline-none focus:border-black/35 dark:focus:border-white/35"
                    placeholder="Your random thoughts..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={loading}
                ></TextAreaInput>

                <div className="w-full flex justify-between">
                    <Button
                        onClick={onCreateSubforum}
                        disabled={loading}
                        text={"Create Subforum"}
                    >
                        
                    </Button>
                    <LoadableButton
                        text={loading ? "Publishing..." : "Publish"}
                        isPrimary={true}
                        icon={
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="24px"
                                viewBox="0 -960 960 960"
                                width="24px"
                                fill="currentColor"
                            >
                                <path d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z" />
                            </svg>
                        }
                        iconAtRight={true}
                        onClick={onPublishPost}
                        isLoading={loading}
                        isWhiteSpinner={true}
                    />
                </div>
            </Panel>
        </FadeUp>
    );
}
