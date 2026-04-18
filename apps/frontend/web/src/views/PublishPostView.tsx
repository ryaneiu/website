import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TransparentIconButton } from "../components/TransparentIconButton";
import { FadeUp } from "../components/AnimatedPresenceDiv";
import { notifyErrorDefault, notifySuccessDefault } from "../stores/NotificationsStore";
import { LoadableButton } from "../components/LoadableButton";
import { getStoredAccessToken } from "../auth/Authentication";
import { extractDetailFromErrorResponse } from "../Utils";
import { API_ENDPOINT } from "../Config";

interface Post {
    id: number;
    title: string;
    content: string;
    published: boolean;
    created_at: string;
}

export default function PublishPostView() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const token = await getStoredAccessToken();
                if (!token) {
                    throw new Error("No access token");
                }

                const res = await fetch(`${API_ENDPOINT}/api/posts`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    },
                    credentials: "omit"
                });

                if (!res.ok) {
                    throw new Error("Failed to fetch posts");
                }

                const posts: Post[] = await res.json();
                const foundPost = posts.find(p => p.id === Number(id));
                if (foundPost) {
                    setPost(foundPost);
                }
            } catch (err) {
                console.error(err);
                notifyErrorDefault("Error fetching post: " + err);
            } finally {
                setFetching(false);
            }
        };

        if (id) {
            fetchPost();
        }
    }, [id]);

    const onCloseView = () => {
        navigate("/");
    };

    const onPublishPost = async () => {
        if (!id) {
            notifyErrorDefault("No post ID provided");
            return;
        }

        setLoading(true);
        try {
            const token = await getStoredAccessToken();
            if (!token) {
                throw new Error("No access token");
            }

            const res = await fetch(`${API_ENDPOINT}/api/posts/publish/${id}/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                credentials: "omit"
            });

            if (!res.ok) {
                const detail = await extractDetailFromErrorResponse(res);
                if (detail) throw new Error(detail);
                else throw new Error("Failed to publish post: " + res.statusText);
            }

            notifySuccessDefault("Post published!");
            navigate("/");
        } catch (err) {
            console.error(err);
            notifyErrorDefault("Error while publishing post: " + err);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <FadeUp className="w-full h-[100vh] flex justify-center items-center">
                <p className="text-xl">Loading...</p>
            </FadeUp>
        );
    }

    if (!post) {
        return (
            <FadeUp className="w-full h-[100vh] flex justify-center items-center">
                <p className="text-xl text-red-500">Post not found</p>
            </FadeUp>
        );
    }

    return (
        <FadeUp className="w-full h-[100vh] flex justify-center items-center">
            <div className="flex flex-col gap-3 border border-black/15 px-4 py-4 items-center relative rounded-md bg-white shadow-lg max-w-[600px]">
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

                <h1 className="text-3xl font-bold text-black">Publish Post</h1>

                <div className="w-full text-left">
                    <h2 className="text-xl font-semibold">{post.title}</h2>
                    <p className="text-black/70 mt-2">{post.content}</p>
                    <p className="text-black/50 text-sm mt-2">
                        Status: {post.published ? "Published" : "Draft"}
                    </p>
                </div>

                {!post.published && (
                    <div className="mt-4">
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
                )}

                {post.published && (
                    <p className="text-green-600 font-semibold">This post is already published.</p>
                )}
            </div>
        </FadeUp>
    );
}
