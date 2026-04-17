import { useEffect, useMemo, useState } from "react";
import { Post } from "./Post";
import { postsStore, type Post as PostDto } from "../../stores/PostsStore";
import { API_ENDPOINT } from "../../Config";
import { useLocation, useNavigate } from "react-router-dom";
import { getStoredAccessToken } from "../../auth/Authentication";
import { notifyErrorDefault } from "../../stores/NotificationsStore";
import { useAuthenticationStore } from "../../stores/AuthenticationStore";
import { PostSkeletonLoader } from "./PostSkeletonLoader";
import { extractDetailFromErrorResponse } from "../../Utils";
import {
    buildContentFilterQuery,
    censorText,
    getHiddenPostMessage,
    getStoredContentFilterPreferences,
    persistContentFilterPreferences,
    resolvePostImage,
    type ContentFilterPreferences,
    type PostLanguage,
} from "../../contentFilter";
import { Panel } from "../../components/Panel";

interface PostListProps {
    language?: PostLanguage;
}

interface FilterToggleProps {
    label: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}

function FilterToggle({ label, checked, onChange }: FilterToggleProps) {
    return (
        <label className="flex items-center gap-3 cursor-pointer select-none">
            <span>{label}</span>
            <span className="relative inline-flex h-6 w-11">
                <input
                    aria-label={label}
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => onChange(event.target.checked)}
                    className="peer sr-only"
                />
                <span className="absolute inset-0 rounded-full bg-black/20 dark:bg-white/20 transition-colors duration-300 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></span>
                <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300 peer-checked:translate-x-5"></span>
            </span>
        </label>
    );
}

export function PostList({ language = "en" }: PostListProps) {
    const posts = postsStore((state) => state.posts);
    const hasLoaded = postsStore((state) => state.hasLoaded);

    const [errorOccurred, setErrorOccurred] = useState(false);
    const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
    const [preferences, setPreferences] = useState<ContentFilterPreferences>(() =>
        getStoredContentFilterPreferences(),
    );

    const navigate = useNavigate();
    const location = useLocation();
    const includeNsfw = preferences.includeNsfw;
    const includeSwears = preferences.includeSwears;
    const searchQuery = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return (params.get("q") ?? "").trim();
    }, [location.search]);

    const updatePreferences = (next: ContentFilterPreferences) => {
        setPreferences(next);
        persistContentFilterPreferences(next);
    };

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
                const endpoint = `${API_ENDPOINT}/api/posts/?${buildContentFilterQuery({
                    includeNsfw,
                    includeSwears,
                }, searchQuery, language)}`;

                const response = await fetch(endpoint, {
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

                if (!Array.isArray(data)) {
                    notifyErrorDefault(
                        "Unexpected posts response format. Expected an array.",
                    );
                    setErrorOccurred(true);
                    postsStore.setState({
                        posts: [],
                        hasLoaded: true,
                    });
                    return;
                }

                postsStore.setState({
                    posts: data as PostDto[],
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
    }, [navigate, includeNsfw, includeSwears, searchQuery, language]);

    return (
        <>
            <div className="flex flex-col gap-4 items-center w-full">
                <div className="w-full flex justify-end">
                    <div className="flex items-center gap-4 text-sm text-black/70 dark:text-white/70 transition-colors duration-300">
                        <FilterToggle
                            label="NSFW"
                            checked={includeNsfw}
                            onChange={(checked) =>
                                updatePreferences({
                                    includeNsfw: checked,
                                    includeSwears,
                                })
                            }
                        />
                        <FilterToggle
                            label="Swears"
                            checked={includeSwears}
                            onChange={(checked) =>
                                updatePreferences({
                                    includeNsfw,
                                    includeSwears: checked,
                                })
                            }
                        />
                    </div>
                </div>

                {(!hasLoaded && !errorOccurred) && (
                    <>
                        <PostSkeletonLoader></PostSkeletonLoader>
                        <PostSkeletonLoader></PostSkeletonLoader>
                        <PostSkeletonLoader></PostSkeletonLoader>
                        <PostSkeletonLoader></PostSkeletonLoader>
                        <PostSkeletonLoader></PostSkeletonLoader>
                    </>
                )}

                {posts.map((post) => {
                        const hiddenPostMessage = getHiddenPostMessage(
                            post,
                            preferences,
                        );

                        if (hiddenPostMessage != null) {
                            return (
                                <Panel key={post.id} className="w-full">
                                    <h2 className="text-xl font-semibold">
                                        Post hidden
                                    </h2>
                                    <p className="text-black/70 dark:text-white/70 transition-colors duration-300">
                                        {hiddenPostMessage}
                                    </p>
                                </Panel>
                            );
                        }

                        const sourceText =
                            post.body ?? post.content_markdown ?? post.content;
                        const renderedDescription = censorText(
                            sourceText,
                            includeSwears,
                        );
                        const image = resolvePostImage(
                            post.image,
                            sourceText,
                            includeNsfw,
                            post.is_nsfw,
                        );

                        return (
                            <Post
                                title={post.title}
                                description={renderedDescription}
                                created_at={post.created_at}
                                key={post.id}
                                votes={post.likes_count ?? post.votes ?? 0}
                                commentsCount={post.replies_count ?? 0}
                                id={post.id}
                                image={image}
                                isInPostList={true}
                                canDelete={post.can_delete !== false}
                                isDeleting={deletingPostId === post.id}
                                onDeleteClick={() => onDeletePost(post.id)}
                            ></Post>
                        );
                    })}

                {posts.length == 0 && hasLoaded ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <h1 className="font-bold text-3xl">
                            {searchQuery.length > 0
                                ? "No matching posts!"
                                : "No posts!"}
                        </h1>
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
