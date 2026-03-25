import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINT } from "../../Config";
import { getStoredAccessToken, getUserIdFromJwt } from "../../auth/Authentication";
import { extractDetailFromErrorResponse } from "../../Utils";
import { notifyErrorDefault } from "../../stores/NotificationsStore";
import { Button } from "../../components/Button";
import {
    CreateSubforumForm,
    type SubforumDto,
} from "../../components/subforums/CreateSubforumForm";
import { UpdateSubforumForm } from "../../components/subforums/UpdateSubforumForm";

type SubforumWithPosts = SubforumDto & {
    posts: {
        id: number;
        title: string;
        created_at: string;
    }[];
};

export default function SubforumList() {
    const navigate = useNavigate();
    const [subforums, setSubforums] = useState<SubforumWithPosts[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingSlug, setUpdatingSlug] = useState<string | null>(null);
    const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);

    const currentUserId = useMemo(
        () => (token ? getUserIdFromJwt(token) : null),
        [token],
    );

    const loadSubforums = async () => {
        setLoading(true);
        try {
            const tokenValue = await getStoredAccessToken();
            setToken(tokenValue);

            const response = await fetch(`${API_ENDPOINT}/api/posts/subforums/`, {
                method: "GET",
                headers:
                    tokenValue != null
                        ? { Authorization: `Bearer ${tokenValue}` }
                        : {},
            });
            if (!response.ok) {
                throw new Error("Failed to load subforums");
            }
            const data = (await response.json()) as SubforumWithPosts[];
            setSubforums(data);
        } catch (error) {
            notifyErrorDefault(
                error instanceof Error ? error.message : "Failed to load subforums",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSubforums();
    }, []);

    const onDeleteSubforum = async (slug: string) => {
        if (deletingSlug != null) return;

        const shouldDelete = window.confirm(
            "Delete this subforum permanently? This cannot be undone.",
        );
        if (!shouldDelete) return;

        const tokenValue = await getStoredAccessToken();
        if (!tokenValue) {
            notifyErrorDefault("You need to be logged in to delete a subforum");
            return;
        }

        setDeletingSlug(slug);
        try {
            const response = await fetch(
                `${API_ENDPOINT}/api/posts/subforums/${slug}/`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${tokenValue}`,
                    },
                },
            );

            if (!response.ok) {
                const detail = await extractDetailFromErrorResponse(response);
                notifyErrorDefault(detail ?? "Failed to delete subforum");
                return;
            }

            setSubforums((prev) => prev.filter((subforum) => subforum.slug !== slug));
        } finally {
            setDeletingSlug(null);
        }
    };

    return (
        <main className="flex flex-col gap-4 w-full">
            <h1 className="text-2xl font-bold">Subforums</h1>

            <CreateSubforumForm
                onCreated={(created) => {
                    setSubforums((prev) => [
                        { ...created, posts: [] },
                        ...prev.filter((subforum) => subforum.slug !== created.slug),
                    ]);
                }}
            />

            {loading && <span className="text-black/50">Loading subforums...</span>}

            {!loading && subforums.length === 0 && (
                <span className="text-black/50">No subforums yet.</span>
            )}

            {subforums.map((subforum) => {
                const canManage =
                    currentUserId != null && subforum.creator === currentUserId;

                return (
                    <article
                        key={subforum.slug}
                        className="border border-black/15 rounded-md p-3 bg-white flex flex-col gap-2"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h2 className="text-lg font-semibold">{subforum.title}</h2>
                                <p className="text-black/70">{subforum.description || "No description"}</p>
                                <span className="text-xs text-black/50">
                                    {subforum.posts.length} posts
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    text="Open"
                                    onClick={() => navigate(`/subforums/${subforum.slug}`)}
                                />
                                {canManage && (
                                    <Button
                                        text={deletingSlug === subforum.slug ? "Deleting..." : "Delete"}
                                        onClick={() => onDeleteSubforum(subforum.slug)}
                                        disabled={deletingSlug === subforum.slug}
                                        isPrimary={true}
                                    />
                                )}
                            </div>
                        </div>

                        {canManage && (
                            <>
                                <div className="w-fit">
                                    <Button
                                        text={updatingSlug === subforum.slug ? "Cancel Update" : "Update"}
                                        onClick={() =>
                                            setUpdatingSlug((prev) =>
                                                prev === subforum.slug ? null : subforum.slug,
                                            )
                                        }
                                    />
                                </div>
                                {updatingSlug === subforum.slug && (
                                    <UpdateSubforumForm
                                        subforum={subforum}
                                        onUpdated={(updated) => {
                                            setSubforums((prev) =>
                                                prev.map((item) =>
                                                    item.slug === subforum.slug
                                                        ? {
                                                              ...item,
                                                              ...updated,
                                                              posts: item.posts,
                                                          }
                                                        : item,
                                                ),
                                            );
                                            setUpdatingSlug(null);
                                        }}
                                    />
                                )}
                            </>
                        )}
                    </article>
                );
            })}
        </main>
    );
}
