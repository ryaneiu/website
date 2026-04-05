import { useEffect, useState } from "react";
import { Post } from "./Post";
import { postsStore } from "../../stores/PostsStore";
import { API_ENDPOINT } from "../../Config";
import { useNavigate } from "react-router-dom";
import { getStoredAccessToken } from "../../auth/Authentication";
import { notifyErrorDefault } from "../../stores/NotificationsStore";
import { useAuthenticationStore } from "../../stores/AuthenticationStore";
import { PostSkeletonLoader } from "./PostSkeletonLoader";
import { extractDetailFromErrorResponse } from "../../Utils";

export function PostList() {
    const posts = postsStore((state) => state.posts);
    const hasLoaded = postsStore((state) => state.hasLoaded);

    const [errorOccurred, setErrorOccurred] = useState(false);
    const [deletingPostId, setDeletingPostId] = useState<number | null>(null);

    const navigate = useNavigate();

    const onDeletePost = async (postId: number) => {
        if (deletingPostId != null) return;

        const shouldDelete = window.confirm(
            "Delete this post permanently? This cannot be undone.",
        );
        if (!shouldDelete) return;

        const token = await getStoredAccessToken();
        if (!token) {
            notifyErrorDefault("You need to be logged in to delete");
            return;
        }

        setDeletingPostId(postId);
        try {
            const response = await fetch(`${API_ENDPOINT}/api/posts/${postId}/`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const detail = await extractDetailFromErrorResponse(response);
                notifyErrorDefault(detail ?? "Failed to delete post");
                return;
            }

            postsStore.setState((prev) => ({
                ...prev,
                posts: prev.posts.filter((post) => post.id !== postId),
            }));
        } finally {
            setDeletingPostId(null);
        }
    };

    useEffect(() => {
        const loadPosts = async () => {
            setErrorOccurred(false);
            postsStore.setState({
                hasLoaded: false,
            });

            try {
                const token = await getStoredAccessToken();
                const response = await fetch(`${API_ENDPOINT}/api/posts/`, {
                    method: "GET",
                    credentials: "include",
                    headers:
                        token != null
                            ? {
                                  Authorization: `Bearer ${token}`,
                              }
                            : {},
                });

                if (response.status === 401 || response.status === 403) {
                    console.log("dbg: received unauthorized; need to login. Redirecting");
                    notifyErrorDefault("You need to login before you can view the posts");
                    postsStore.setState({
                        posts: [],
                        hasLoaded: true,
                    });
                    useAuthenticationStore.setState({
                        isLoggedIn: false,
                    });
                    navigate("/auth?action=login");
                    return;
                }

                if (!response.ok) {
                    const text = await response.text();
                    notifyErrorDefault(
                        `Couldn't fetch posts: ${response.status} ${response.statusText}`,
                    );
                    console.error("Error while trying to fetch posts (non-ok):", response.status, response.statusText, text);
                    setErrorOccurred(true);
                    postsStore.setState({
                        hasLoaded: true,
                    });
                    return;
                }

                const bodyText = await response.text();
                let data;
                try {
                    data = JSON.parse(bodyText);
                } catch (parseError) {
                    console.error("Could not parse posts JSON, payload:", bodyText, parseError);
                    notifyErrorDefault(
                        "Unexpected response format from posts endpoint. Please check the API server.",
                    );
                    setErrorOccurred(true);
                    postsStore.setState({
                        hasLoaded: true,
                    });
                    return;
                }

                postsStore.setState({
                    posts: data,
                    hasLoaded: true,
                });
            } catch (e) {
                console.error("Error while trying to fetch posts: ", e);
                if (e instanceof TypeError) {
                    notifyErrorDefault("Couldn't contact posts server. Is backend running?");
                } else {
                    notifyErrorDefault("An error occurred and we couldn't fetch posts");
                }
                setErrorOccurred(true);
                postsStore.setState({
                    hasLoaded: true,
                });
            }
        };

        loadPosts();
    }, [navigate]);

    return (
        <>
            <div className="flex flex-col gap-4 items-center w-full">
                {(!hasLoaded && !errorOccurred) && (
                    <>
                        <PostSkeletonLoader></PostSkeletonLoader>
                        <PostSkeletonLoader></PostSkeletonLoader>
                        <PostSkeletonLoader></PostSkeletonLoader>
                        <PostSkeletonLoader></PostSkeletonLoader>
                        <PostSkeletonLoader></PostSkeletonLoader>
                    </>
                )}

                {posts &&
                    posts.map((post) => {
                        return (
                            <Post
                                title={post.title}
                                description={post.content_markdown || post.content}
                                created_at={post.created_at}
                                key={post.id}
                                votes={post.likes_count ?? post.votes ?? 0}
                                commentsCount={post.replies_count ?? 0}
                                id={post.id}
                                isInPostList={true}
                                canDelete={post.can_delete !== false}
                                isDeleting={deletingPostId === post.id}
                                onDeleteClick={() => onDeletePost(post.id)}
                            ></Post>
                        );
                    })}

                {(posts == null || posts.length == 0) && hasLoaded ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <h1 className="font-bold text-3xl">No posts!</h1>
                    </div>
                ) : null}

                {errorOccurred ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <div>
                            <h1 className="font-bold text-3xl text-black">
                                Error occurred!
                            </h1>
                            <p className="text-black">
                                Check console for more info
                            </p>
                        </div>
                    </div>
                ) : null}
            </div>
        </>
    );
}
