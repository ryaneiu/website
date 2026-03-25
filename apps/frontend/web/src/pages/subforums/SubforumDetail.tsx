import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_ENDPOINT } from "../../Config";
import {
    getStoredAccessToken,
    getUserIdFromJwt,
} from "../../auth/Authentication";
import { extractDetailFromErrorResponse, timeAgo } from "../../Utils";
import { notifyErrorDefault } from "../../stores/NotificationsStore";
import { Button } from "../../components/Button";
import { Post } from "../home/Post";
import {
    AddPostForm,
    type SubforumPostDto,
} from "../../components/subforums/AddPostForm";
import { UpdateSubforumForm } from "../../components/subforums/UpdateSubforumForm";
import type { SubforumDto } from "../../components/subforums/CreationModal";

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

    const [modalVisible, setModalVisible] = useState<boolean>(false);

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
                error instanceof Error
                    ? error.message
                    : "Failed to load subforum",
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
            {loading && (
                <span className="text-black/50">Loading subforum...</span>
            )}

            {!loading && subforum == null && (
                <span className="text-black/50">Subforum not found.</span>
            )}

            <div>
                <Button
                    text="Back"
                    icon={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="#1f1f1f"
                        >
                            <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
                        </svg>
                    }
                    onClick={() => navigate("/subforums")}
                />
            </div>

            {subforum != null && (
                <>
                    <div className="border border-black/15 rounded-md p-3 bg-white flex flex-col gap-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h1 className="text-2xl font-bold">
                                    {subforum.title}
                                </h1>
                                <p className="text-black/70">
                                    {subforum.description || "No description"}
                                </p>
                                <span className="text-xs text-black/50">
                                    Created {timeAgo(subforum.created_at)}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                {canManage && (
                                    <Button
                                        text={
                                            deleting ? "Deleting..." : "Delete"
                                        }
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
                                        text={
                                            showUpdateForm
                                                ? "Cancel Update"
                                                : "Update"
                                        }
                                        onClick={() =>
                                            setShowUpdateForm((prev) => !prev)
                                        }
                                    />
                                </div>
                                {showUpdateForm && (
                                    <UpdateSubforumForm
                                        subforum={subforum}
                                        onUpdated={(updated) => {
                                            setSubforum((prev) =>
                                                prev == null
                                                    ? prev
                                                    : {
                                                          ...prev,
                                                          ...updated,
                                                          posts: prev.posts,
                                                      },
                                            );
                                            setShowUpdateForm(false);
                                        }}
                                    />
                                )}
                            </>
                        )}
                    </div>

                    <div>
                        <Button
                            icon={
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="24px"
                                    viewBox="0 -960 960 960"
                                    width="24px"
                                    fill="#fff"
                                >
                                    <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                                </svg>
                            }
                            text="Add Post"
                            onClick={() => setModalVisible(true)}
                            isPrimary={true}
                        ></Button>
                    </div>

                    {modalVisible && (
                        <AddPostForm
                            subforumSlug={subforum.slug}
                            onPostAdded={(post) => {
                                setSubforum((prev) =>
                                    prev == null
                                        ? prev
                                        : {
                                              ...prev,
                                              posts: [post, ...prev.posts],
                                          },
                                );
                            }}
                            onHide={() => setModalVisible(false)}
                        />
                    )}

                    <section className="flex flex-col gap-3">
                        <h2 className="text-lg font-semibold">Posts</h2>
                        {subforum.posts.length === 0 && (
                            <span className="text-black/50">
                                No posts in this subforum yet.
                            </span>
                        )}

                        {subforum.posts.map((post) => (
                            <Post
                                key={post.id}
                                title={post.title}
                                description={
                                    post.content_markdown || post.content
                                }
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
