import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TransparentIconButton } from "../components/TransparentIconButton";
import { FadeUp } from "../components/AnimatedPresenceDiv";
import { notifyErrorDefault, notifySuccessDefault } from "../stores/NotificationsStore";
import { LoadableButton } from "../components/LoadableButton";
import { TextAreaInput } from "../components/TextAreaInput";
import { InputComponent } from "../components/InputComponent";
import { getStoredAccessToken } from "../auth/Authentication";
import { extractDetailFromErrorResponse } from "../Utils";
import { API_ENDPOINT } from "../Config";

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

            console.log("Title: ", title, " content: ", content);

            const token = await getStoredAccessToken();
            if (!token) {
                throw new Error("No access token");
            }

            const res = await fetch(`${API_ENDPOINT}/api/posts/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ title, content }),
            });

            if (!res.ok) {
                // Try to extract detail field
                const detail = await extractDetailFromErrorResponse(res);
                if (detail) throw new Error(detail);
                else throw new Error("Failed to create post: " + res.statusText);
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
            // alert("Error creating post");
            notifyErrorDefault("Error while creating post: " + err);
            notifyErrorDefault("note: not implemented. Unable to create post from the client because no appropriate post creation & publish endpoints are exposed and usable.")
        } finally {
            setLoading(false);
        }
    };

    return (
        <FadeUp className="w-full h-[100vh] flex justify-center items-center">
            <div className="flex flex-col gap-3 border border-black/15 px-4 py-2 items-center relative rounded-md bg-white shadow-lg">
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
                <InputComponent
                    className="w-[90vw] sm:w-[80vw] md:w-[60vw] lg:w-[40vw]"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={loading}
                />

                {/* Content textarea */}
                <TextAreaInput
                    className="px-2 py-2 w-[90vw] sm:w-[80vw] md:w-[60vw] lg:w-[40vw] h-[60vh] rounded-md border border-black/15 focus:outline-none focus:border-black/35"
                    placeholder="Your random thoughts..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={loading}
                ></TextAreaInput>

                {/* Publish button */}
                <div>
                    <LoadableButton
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
                        isLoading={loading}
                        isWhiteSpinner={true}
                    />
                </div>
            </div>
        </FadeUp>
    );
}
