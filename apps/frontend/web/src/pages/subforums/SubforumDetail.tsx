import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_ENDPOINT } from "../../Config";
import { getStoredAccessToken, getUserIdFromJwt } from "../../auth/Authentication";
import { extractDetailFromErrorResponse, timeAgo } from "../../Utils";
import { notifyErrorDefault } from "../../stores/NotificationsStore";
import { Button } from "../../components/Button";
import { Post } from "../home/Post";
import { AddPostForm, type SubforumPostDto } from "../../components/subforums/AddPostForm";
import { UpdateSubforumForm } from "../../components/subforums/UpdateSubforumForm";
import type { SubforumDto } from "../../components/subforums/CreateSubforumForm";

type SubforumDetailDto = SubforumDto & {
    posts: SubforumPostDto[];
};

export default function SubforumDetail() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [subforum, setSubforum] = useState<SubforumDetailDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [showUpdateForm, setShowUpdateForm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    const currentUserId = useMemo(
        () => (token ? getUserIdFromJwt(token) : null),
        [token],
    );

    const canManage =
        subforum != null &&
        currentUserId != null &&
        subforum.creator === currentUserId;

    const loadSubforum = useCallback(async () => {
        if (!slug) return;
        setLoading(true);
        try {
            const tokenValue = await getStoredAccessToken();
            setToken(tokenValue);

            const response = await fetch(
                `${API_ENDPOINT}/api/posts/subforums/${slug}/`,
                {
                    method: "GET",
                    headers:
                        tokenValue != null
                            ? { Authorization: `Bearer ${tokenValue}` }
                            : {},
                },
            );

            if (!response.ok) {
                throw new Error("Failed to load subforum");
            }

            const payload = (await response.json()) as SubforumDetailDto;
            setSubforum(payload);
        } catch (error) {
            notifyErrorDefault(
                error instanceof Error ? error.message : "Failed to load subforum",
            );
        } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        loadSubforum();
    }, [loadSubforum]);

    const onDeleteSubforum = async () => {
        if (!subforum || !slug || deleting) return;

        const shouldDelete = window.confirm(
            "Delete this subforum permanently? This cannot be undone.",
        );
        if (!shouldDelete) return;

        const tokenValue = await getStoredAccessToken();
        if (!tokenValue) {
            notifyErrorDefault("You need to be logged in to delete a subforum");
            return;
        }

        setDeleting(true);
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

            navigate("/subforums");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <main className="flex flex-col gap-4 w-full">
            {loading && <span className="text-black/50">Loading subforum...</span>}

            {!loading && subforum == null && (
                <span className="text-black/50">Subforum not found.</span>
            )}

            {subforum != null && (
                <>
                    <div className="border border-black/15 rounded-md p-3 bg-white flex flex-col gap-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h1 className="text-2xl font-bold">{subforum.title}</h1>
                                <p className="text-black/70">{subforum.description || "No description"}</p>
                                <span className="text-xs text-black/50">
                                    Created {timeAgo(subforum.created_at)}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <Button text="Back" onClick={() => navigate("/subforums")} />
                                {canManage && (
                                    <Button
                                        text={deleting ? "Deleting..." : "Delete"}
                                        isPrimary={true}
                                        disabled={deleting}
                                        onClick={onDeleteSubforum}
                                    />
                                )}
                            </div>
                        </div>

                        {canManage && (
                            <>
                                <div className="w-fit">
                                    <Button
                                        text={showUpdateForm ? "Cancel Update" : "Update"}
                                        onClick={() => setShowUpdateForm((prev) => !prev)}
                                    />
                                </div>
                                {showUpdateForm && (
                                    <UpdateSubforumForm
                                        subforum={subforum}
                                        onUpdated={(updated) => {
                                            setSubforum((prev) =>
                                                prev == null
                                                    ? prev
                                                    : { ...prev, ...updated, posts: prev.posts },
                                            );
                                            setShowUpdateForm(false);
                                        }}
                                    />
                                )}
                            </>
                        )}
                    </div>

                    <AddPostForm
                        subforumSlug={subforum.slug}
                        onPostAdded={(post) => {
                            setSubforum((prev) =>
                                prev == null ? prev : { ...prev, posts: [post, ...prev.posts] },
                            );
                        }}
                    />

                    <section className="flex flex-col gap-3">
                        <h2 className="text-lg font-semibold">Posts</h2>
                        {subforum.posts.length === 0 && (
                            <span className="text-black/50">No posts in this subforum yet.</span>
                        )}

                        {subforum.posts.map((post) => (
                            <Post
                                key={post.id}
                                title={post.title}
                                description={post.content_markdown || post.content}
                                created_at={post.created_at}
                                votes={0}
                                commentsCount={0}
                                id={post.id}
                                isInPostList={true}
                            />
                        ))}
                    </section>
                </>
            )}
        </main>
    );
}
