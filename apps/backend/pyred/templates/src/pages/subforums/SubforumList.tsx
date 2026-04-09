import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINT } from "../../Config";
import {
    getStoredAccessToken,
    getUserIdFromJwt,
} from "../../auth/Authentication";
import { extractDetailFromErrorResponse } from "../../Utils";
import { notifyErrorDefault } from "../../stores/NotificationsStore";
import { Button } from "../../components/Button";
import { type SubforumDto } from "../../components/subforums/CreationModal";
import { UpdateSubforumForm } from "../../components/subforums/UpdateSubforumForm";
import { CreateSubforumForm } from "./CreateSubforumForm";
import { FadeUp } from "../../components/AnimatedPresenceDiv";
import { Panel } from "../../components/Panel";

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

    const [modalVisible, setModalVisible] = useState<boolean>(false);

    const currentUserId = useMemo(
        () => (token ? getUserIdFromJwt(token) : null),
        [token],
    );

    const loadSubforums = async () => {
        setLoading(true);
        try {
            const tokenValue = await getStoredAccessToken();
            setToken(tokenValue);

            const response = await fetch(
                `${API_ENDPOINT}/api/posts/subforums/`,
                {
                    method: "GET",
                    headers:
                        tokenValue != null
                            ? { Authorization: `Bearer ${tokenValue}` }
                            : {},
                },
            );
            if (!response.ok) {
                throw new Error("Failed to load subforums");
            }
            const data = (await response.json()) as SubforumWithPosts[];
            setSubforums(data);
        } catch (error) {
            notifyErrorDefault(
                error instanceof Error
                    ? error.message
                    : "Failed to load subforums",
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

            setSubforums((prev) =>
                prev.filter((subforum) => subforum.slug !== slug),
            );
        } finally {
            setDeletingSlug(null);
        }
    };

    return (
        <FadeUp>
            <main className="flex flex-col gap-4 w-full">
                <h1 className="text-2xl font-bold">Subforums</h1>

                <Button
                    icon={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                        >
                            <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                        </svg>
                    }
                    text="Create"
                    onClick={() => setModalVisible(true)}
                ></Button>

                {modalVisible && (
                    <CreateSubforumForm
                        onCreated={(created: SubforumDto) => {
                            setSubforums((prev) => [
                                { ...created, posts: [] },
                                ...prev.filter(
                                    (subforum) =>
                                        subforum.slug !== created.slug,
                                ),
                            ]);
                        }}
                        onHide={() => setModalVisible(false)}
                    />
                )}

                {loading && (
                    <span className="text-black/50">Loading subforums...</span>
                )}

                {!loading && subforums.length === 0 && (
                    <span className="text-black/50">No subforums yet.</span>
                )}

                {subforums.map((subforum) => {
                    const canManage =
                        currentUserId != null &&
                        subforum.creator === currentUserId;

                    return (
                        <Panel
                            key={subforum.slug}
                            className="flex flex-col gap-2 cursor-pointer"
                            onClick={() =>
                                navigate(`/subforums/${subforum.slug}`)
                            }
                            as="article"
                            aria-label="subforum"
                            hoverable={true}
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        {subforum.title}
                                    </h2>
                                    <p className="text-black/70 dark:text-white/70 transition-colors duration-300">
                                        {subforum.description ||
                                            "No description"}
                                    </p>
                                    <span className="text-xs text-black/50 dark:text-white/50 transition-colors duration-300">
                                        {subforum.posts.length} posts
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    {canManage && (
                                        <Button
                                            text={
                                                deletingSlug === subforum.slug
                                                    ? "Deleting..."
                                                    : "Delete"
                                            }
                                            onClick={() =>
                                                onDeleteSubforum(subforum.slug)
                                            }
                                            disabled={
                                                deletingSlug === subforum.slug
                                            }
                                            isPrimary={true}
                                        />
                                    )}
                                </div>
                            </div>

                            {canManage && (
                                <>
                                    <div className="w-fit">
                                        <Button
                                            text={
                                                updatingSlug === subforum.slug
                                                    ? "Cancel Update"
                                                    : "Update"
                                            }
                                            onClick={() =>
                                                setUpdatingSlug((prev) =>
                                                    prev === subforum.slug
                                                        ? null
                                                        : subforum.slug,
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
                                                        item.slug ===
                                                        subforum.slug
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
                        </Panel>
                    );
                })}
            </main>
        </FadeUp>
    );
}
