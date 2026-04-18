import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { FadeUp } from "../../components/AnimatedPresenceDiv";
import { API_ENDPOINT } from "../../Config";
import type { Post as PostDto } from "../../stores/PostsStore";
import { Post } from "../home/Post";
import {
    buildContentFilterQuery,
    censorText,
    getHiddenPostMessage,
    getStoredContentFilterPreferences,
    resolvePostImage,
} from "../../contentFilter";
import { Panel } from "../../components/Panel";
import { PostSkeletonLoader } from "../home/PostSkeletonLoader";
import { notifyErrorDefault } from "../../stores/NotificationsStore";
import { getAppLanguageFromPath } from "../../i18n";

type DiscoverScope = "users" | "everywhere";

type UserSearchResult = {
    id: number;
    username: string;
};

function getSearchQuery(search: string): string {
    const params = new URLSearchParams(search);
    return (params.get("q") ?? "").trim();
}

function getScope(search: string): DiscoverScope {
    const params = new URLSearchParams(search);
    return params.get("scope") === "users" ? "users" : "everywhere";
}

export default function Discover() {
    const location = useLocation();
    const activeLanguage = getAppLanguageFromPath(location.pathname);
    const searchQuery = useMemo(() => getSearchQuery(location.search), [
        location.search,
    ]);
    const scope = useMemo(() => getScope(location.search), [location.search]);
    const filterPreferences = useMemo(
        () => getStoredContentFilterPreferences(),
        [],
    );

    const [users, setUsers] = useState<UserSearchResult[]>([]);
    const [posts, setPosts] = useState<PostDto[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (searchQuery.length === 0) {
            setUsers([]);
            setPosts([]);
            setLoading(false);
            return;
        }

        let cancelled = false;

        const loadResults = async () => {
            setLoading(true);

            try {
                const usersResponsePromise = fetch(
                    `${API_ENDPOINT}/api/users/search/?q=${encodeURIComponent(searchQuery)}`,
                    { method: "GET", credentials: "omit"},
                );

                const postsResponsePromise: Promise<Response | null> =
                    scope === "everywhere"
                        ? fetch(
                              `${API_ENDPOINT}/api/posts/?${buildContentFilterQuery(filterPreferences, searchQuery, activeLanguage)}`,
                              { method: "GET", credentials: "omit"},
                          )
                        : Promise.resolve(null);

                const [usersResponse, postsResponse] = await Promise.all([
                    usersResponsePromise,
                    postsResponsePromise,
                ]);

                if (!usersResponse.ok) {
                    throw new Error("Failed to load users search results.");
                }

                const usersPayload =
                    (await usersResponse.json()) as UserSearchResult[];

                if (!Array.isArray(usersPayload)) {
                    throw new Error("Unexpected users response format.");
                }

                let postsPayload: PostDto[] = [];

                if (postsResponse != null) {
                    if (!postsResponse.ok) {
                        throw new Error("Failed to load posts search results.");
                    }

                    const parsedPosts = await postsResponse.json();

                    if (!Array.isArray(parsedPosts)) {
                        throw new Error("Unexpected posts response format.");
                    }

                    postsPayload = parsedPosts as PostDto[];
                }

                if (!cancelled) {
                    setUsers(usersPayload);
                    setPosts(postsPayload);
                }
            } catch (error) {
                if (!cancelled) {
                    notifyErrorDefault(
                        error instanceof Error
                            ? error.message
                            : "Failed to load search results.",
                    );
                    setUsers([]);
                    setPosts([]);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadResults();

        return () => {
            cancelled = true;
        };
    }, [scope, searchQuery, filterPreferences, activeLanguage]);

    return (
        <FadeUp>
            <main className="flex flex-col gap-4">
                <h1 className="text-2xl font-bold">
                    {scope === "users"
                        ? activeLanguage === "fr"
                            ? "Résultats de recherche utilisateurs"
                            : "User search results"
                        : activeLanguage === "fr"
                          ? "Recherche globale"
                          : "Search everywhere"}
                </h1>

                {searchQuery.length === 0 && (
                    <span className="text-black/50 dark:text-white/50 transition-colors duration-300">
                        {activeLanguage === "fr"
                            ? "Utilisez la recherche de la barre de navigation pour trouver des publications et des utilisateurs."
                            : "Use the navbar search to find posts and users."}
                    </span>
                )}

                {loading && (
                    <>
                        {scope === "everywhere" && (
                            <>
                                <PostSkeletonLoader />
                                <PostSkeletonLoader />
                            </>
                        )}
                        <span className="text-black/50 dark:text-white/50 transition-colors duration-300">
                            {activeLanguage === "fr" ? "Recherche..." : "Searching..."}
                        </span>
                    </>
                )}

                {!loading && searchQuery.length > 0 && scope === "everywhere" && (
                    <section className="flex flex-col gap-3">
                        <h2 className="text-lg font-semibold">{activeLanguage === "fr" ? "Publications" : "Posts"}</h2>
                        {posts.length === 0 && (
                            <span className="text-black/50 dark:text-white/50 transition-colors duration-300">
                                {activeLanguage === "fr" ? "Aucune publication correspondante." : "No matching posts."}
                            </span>
                        )}
                        {posts.map((post) => {
                            const hiddenPostMessage = getHiddenPostMessage(
                                post,
                                filterPreferences,
                            );

                            if (hiddenPostMessage != null) {
                                return (
                                    <Panel
                                        key={post.id}
                                        className="flex flex-col gap-2"
                                    >
                                        <h3 className="text-lg font-semibold">
                                            Post hidden
                                        </h3>
                                        <p className="text-black/70 dark:text-white/70 transition-colors duration-300">
                                            {hiddenPostMessage}
                                        </p>
                                    </Panel>
                                );
                            }

                            const sourceText =
                                post.body ?? post.content_markdown ?? post.content;
                            const description = censorText(
                                sourceText,
                                filterPreferences.includeSwears,
                            );
                            const image = resolvePostImage(
                                post.image,
                                sourceText,
                                filterPreferences.includeNsfw,
                                post.is_nsfw,
                            );

                            return (
                                <Post
                                    key={post.id}
                                    title={post.title}
                                    description={description}
                                    created_at={post.created_at}
                                    votes={post.likes_count ?? post.votes ?? 0}
                                    commentsCount={post.replies_count ?? 0}
                                    id={post.id}
                                    image={image}
                                    authorUsername={post.author_username}
                                    authorBio={post.author_bio}
                                    isInPostList={true}
                                />
                            );
                        })}
                    </section>
                )}

                {!loading && searchQuery.length > 0 && (
                    <section className="flex flex-col gap-3">
                        <h2 className="text-lg font-semibold">{activeLanguage === "fr" ? "Utilisateurs" : "Users"}</h2>
                        {users.length === 0 && (
                            <span className="text-black/50 dark:text-white/50 transition-colors duration-300">
                                {activeLanguage === "fr" ? "Aucun utilisateur correspondant." : "No matching users."}
                            </span>
                        )}
                        {users.map((user) => (
                            <Panel key={user.id} className="font-semibold">
                                u/{user.username}
                            </Panel>
                        ))}
                    </section>
                )}
            </main>
        </FadeUp>
    );
}