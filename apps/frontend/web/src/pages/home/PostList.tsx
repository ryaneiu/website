import { useEffect, useRef, useState } from "react";
import { Post } from "./Post";
import { postsStore, type Post as PostDto } from "../../stores/PostsStore";
import { API_ENDPOINT } from "../../Config";
import { useLocation, useNavigate } from "react-router-dom";
import { getStoredAccessToken } from "../../auth/Authentication";
import { notifyErrorDefault } from "../../stores/NotificationsStore";
import { useAuthenticationStore } from "../../stores/AuthenticationStore";
import { PostSkeletonLoader } from "../../components/PostSkeletonLoader";
import { extractDetailFromErrorResponse } from "../../Utils";
import {
    buildContentFilterQuery,
    censorText,
    getHiddenPostMessage,
    getStoredContentFilterPreferences,
    resolvePostImage,
    type ContentFilterPreferences,
    type PostLanguage,
} from "../../contentFilter";
import { Panel } from "../../components/Panel";
import { getAppLanguageFromPath } from "../../i18n";

interface PostListProps {
    language?: PostLanguage;
}

export function PostList({ language = "en" }: PostListProps) {
    const appLanguage = getAppLanguageFromPath(window.location.pathname);
    const posts = postsStore((state) => state.posts);
    const hasLoaded = postsStore((state) => state.hasLoaded);

    const [errorOccurred, setErrorOccurred] = useState(false);
    const [deletingPostId, setDeletingPostId] = useState<number | null>(null);

    const [preferences] = useState<ContentFilterPreferences>(() =>
        getStoredContentFilterPreferences(),
    );

    const navigate = useNavigate();
    const location = useLocation();
    const includeNsfw = preferences.includeNsfw;
    const includeSwears = preferences.includeSwears;

    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const nextQuery = (params.get("q") ?? "").trim();

        setSearchQuery((prev) => {
            if (prev === nextQuery) return prev; // no change means no rerender
            console.log("Search query has changed from: ", prev, nextQuery);
            return nextQuery;
        });
    }, [location.search]);

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
            const response = await fetch(
                `${API_ENDPOINT}/api/posts/${postId}/`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    credentials: "omit",
                },
            );

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

    // prevent useEffect() from reloading posts when nothing actually changed
    // this is a temporary fix
    const lastFetchKey = useRef<string | null>(null);

    const hashUpdateKey = postsStore(state => state.hashUpdateKey);



    useEffect(() => {

        const fetchKey = `${includeNsfw}-${includeSwears}-${searchQuery}-${language}-${hashUpdateKey}`;



        if (postsStore.getState().fetchKeyHash == fetchKey) {
            console.log("Skipping duplicate render");
            return;
        }
        console.log("Allowing duplicate render: different key: B:", lastFetchKey.current, "B2:", fetchKey);
        console.log(lastFetchKey.current);
        console.log(fetchKey);
        postsStore.setState({fetchKeyHash: fetchKey});

        const loadPosts = async () => {
            setErrorOccurred(false);
            postsStore.setState({
                hasLoaded: false,
                posts: [],
            });

            try {
                const token = await getStoredAccessToken();
                const endpoint = `${API_ENDPOINT}/api/posts/?${buildContentFilterQuery(
                    {
                        includeNsfw,
                        includeSwears,
                    },
                    searchQuery,
                    language,
                )}`;

                const response = await fetch(endpoint, {
                    method: "GET",
                    credentials: "omit",
                    headers:
                        token != null
                            ? {
                                  Authorization: `Bearer ${token}`,
                              }
                            : {},
                });

                if (response.status === 401 || response.status === 403) {
                    console.log(
                        "dbg: received unauthorized; need to login. Redirecting",
                    );
                    postsStore.setState({
                        posts: [],
                        hasLoaded: true,
                    });
                    useAuthenticationStore.setState({
                        isLoggedIn: false,
                    });
                    navigate("/auth?action=signup");
                    return;
                }

                if (!response.ok) {
                    const text = await response.text();
                    notifyErrorDefault(
                        `Couldn't fetch posts: ${response.status} ${response.statusText}`,
                    );
                    console.error(
                        "Error while trying to fetch posts (non-ok):",
                        response.status,
                        response.statusText,
                        text,
                    );
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
                    console.error(
                        "Could not parse posts JSON, payload:",
                        bodyText,
                        parseError,
                    );
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
                    notifyErrorDefault(
                        "Couldn't contact posts server. Is backend running?",
                    );
                } else {
                    notifyErrorDefault(
                        "An error occurred and we couldn't fetch posts",
                    );
                }
                setErrorOccurred(true);
                postsStore.setState({
                    hasLoaded: true,
                });
            }
        };

        console.log(
            "Load post triggered in useEffect: values: ",
            navigate,
            includeNsfw,
            includeSwears,
            searchQuery,
            language,
        );
        loadPosts();
    }, [navigate, includeNsfw, includeSwears, searchQuery, language, hashUpdateKey]);

    return (
        <>
            <div className="flex flex-col gap-4 items-center w-full">
                <div className="w-full flex justify-end">
                    <div className="flex items-center gap-4 text-sm text-black/70 dark:text-white/70 transition-colors duration-300"></div>
                </div>

                {!hasLoaded && !errorOccurred && (
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
                            authorUsername={post.author_username}
                            authorBio={post.author_bio}
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
                                ? appLanguage === "fr"
                                    ? "Aucune publication correspondante !"
                                    : "No matching posts!"
                                : appLanguage === "fr"
                                  ? "Aucune publication !"
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
