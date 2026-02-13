import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { TransparentIconButton } from "../components/TransparentIconButton";
import { FadeUp } from "../components/AnimatedPresenceDiv";

export function CreatePostView() {
    const navigate = useNavigate();

    // Post state
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);

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
            const res = await fetch("http://127.0.0.1:8000/api/posts/", {
                method: "POST",
                credentials: "include", // if using session auth
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ title, content }),
            });

            if (!res.ok) throw new Error("Failed to create post");

            const data = await res.json();
            console.log("Post created:", data);

            alert("Post created!");
            setTitle("");
            setContent("");
            navigate("/"); // back to homepage or wherever
        } catch (err) {
            console.error(err);
            alert("Error creating post");
        } finally {
            setLoading(false);
        }
    };

    return (
        <FadeUp className="w-full h-[100vh] flex justify-center items-center">
            <div className="flex flex-col gap-3 border border-black/15 px-4 py-2 items-center relative rounded-md bg-white">
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
                                fill="#1f1f1f"
                            >
                                <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                            </svg>
                        }
                    />
                </div>

                <h1 className="text-3xl font-bold text-black">Create Post</h1>

                {/* Title input */}
                <input
                    className="border p-2 w-[90vw] sm:w-[80vw] md:w-[60vw] lg:w-[40vw] rounded-md focus:outline-none focus:border-black/35"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                {/* Content textarea */}
                <textarea
                    className="px-2 py-2 w-[90vw] sm:w-[80vw] md:w-[60vw] lg:w-[40vw] h-[60vh] rounded-md border border-black/15 focus:outline-none focus:border-black/35"
                    placeholder="Your random thoughts..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                ></textarea>

                {/* Publish button */}
                <div>
                    <Button
                        text={loading ? "Publishing..." : "Publish Post"}
                        isPrimary={true}
                        icon={
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="24px"
                                viewBox="0 -960 960 960"
                                width="24px"
                                fill="#fff"
                            >
                                <path d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z" />
                            </svg>
                        }
                        iconAtRight={true}
                        onClick={onPublishPost}
                        disabled={loading}
                    />
                </div>
            </div>
        </FadeUp>
    );
}
