import { useNavigate, useParams } from "react-router-dom";
import { useSelectedPostStore } from "../../stores/CurrentSelectedPostStore";
import { Post } from "../home/Post";
import { Comment } from "./Comment";
import type { CommentType } from "./CommentType";
import { SkeletonLoaderComment } from "./SkeletonLoaderComment";
import { useCallback, useEffect, useState } from "react";
import { API_ENDPOINT } from "../../Config";
import { getStoredAccessToken } from "../../auth/Authentication";
import { notifyErrorDefault } from "../../stores/NotificationsStore";
import { CommentReplySection } from "./CommentReplySection";
import { extractDetailFromErrorResponse } from "../../Utils";
import { Button } from "../../components/Button";
import { postsStore } from "../../stores/PostsStore";

type PostResponse = {
    id: number;
    title: string;
    content: string;
    content_markdown?: string;
    author: number;
    likes_count?: number;
    votes?: number;
    replies_count?: number;
    created_at: string;
    can_delete?: boolean;
    subforum?: string | null;
};

type ReplyResponse = {
    id: number;
    post: number;
    parent_reply: number | null;
    author_username: string;
    content: string;
    content_markdown: string;
};

export default function PostPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const selectedPostId = useSelectedPostStore((state) => state.postId);

    const [loaded, setLoaded] = useState<boolean>(false);
    const [replyingToPost, setReplyingToPost] = useState(false);
    const [comments, setComments] = useState<CommentType[]>([]);
    const [postData, setPostData] = useState<PostResponse | null>(null);
    const [isDeletingPost, setIsDeletingPost] = useState(false);
    const [subforums, setSubforums] = useState<{ title: string; slug: string }[]>([]);
    const [subforumToAssign, setSubforumToAssign] = useState("general");
    const [isAssigningSubforum, setIsAssigningSubforum] = useState(false);

    const postId = id != null ? Number.parseInt(id) : selectedPostId;
    const canDisplay = Number.isFinite(postId) && postId > 0;
    const canDeletePost = postData?.can_delete === true;

    const buildCommentTree = useCallback(
        (replies: ReplyResponse[]): CommentType[] => {
            const map = new Map<number, CommentType>();

            replies.forEach((reply) => {
                map.set(reply.id, {
                    id: reply.id,
                    postId: reply.post,
                    parentReplyId: reply.parent_reply,
                    author: reply.author_username,
                    description: reply.content_markdown || reply.content,
                    subcomments: [],
                });
            });

            const roots: CommentType[] = [];
            map.forEach((comment) => {
                if (comment.parentReplyId == null) {
                    roots.push(comment);
                    return;
                }
                const parent = map.get(comment.parentReplyId);
                if (parent) {
                    parent.subcomments.push(comment);
                } else {
                    roots.push(comment);
                }
            });

            return roots;
        },
        [],
    );

    const fetchReplies = useCallback(async () => {
        if (!canDisplay) return;

        const response = await fetch(
            `${API_ENDPOINT}/api/posts/${postId}/replies/`,
            {
                method: "GET",
            },
        );

        if (!response.ok) {
            throw new Error("Failed to fetch replies");
        }

        const payload: ReplyResponse[] = await response.json();
        setComments(buildCommentTree(payload));
    }, [buildCommentTree, canDisplay, postId]);

    useEffect(() => {
        const loadPostPage = async () => {
            if (!canDisplay) return;

            try {
                const [postResponse] = await Promise.all([
                    fetch(`${API_ENDPOINT}/api/posts/${postId}/`, {
                        method: "GET",
                    }),
                    fetchReplies(),
                ]);

                if (!postResponse.ok) {
                    throw new Error("Failed to fetch post");
                }

                const postPayload: PostResponse = await postResponse.json();
                setPostData(postPayload);

                useSelectedPostStore.setState({
                    title: postPayload.title,
                    description:
                        postPayload.content_markdown || postPayload.content,
                    publishedTime: postPayload.created_at,
                    likes: postPayload.likes_count ?? postPayload.votes ?? 0,
                    comments: postPayload.replies_count ?? 0,
                    postId,
                    selectedAny: true,
                });
            } catch (error) {
                notifyErrorDefault(
                    error instanceof Error
                        ? error.message
                        : "Failed to load post page",
                );
            } finally {
                setLoaded(true);
            }
        };

        loadPostPage();
    }, [canDisplay, fetchReplies, postId]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        fetch(`${API_ENDPOINT}/api/posts/subforums/`, { method: "GET" })
            .then(async (res) => {
                if (!res.ok) {
                    throw new Error("Failed to load subforums");
                }
                return res.json();
            })
            .then((data) => {
                const parsed = Array.isArray(data)
                    ? data.map((v) => ({ title: v.title, slug: v.slug }))
                    : [];
                const hasGeneral = parsed.some((v) => v.slug === "general");
                const merged = hasGeneral
                    ? parsed
                    : [{ title: "General", slug: "general" }, ...parsed];
                setSubforums(merged);
            })
            .catch(() => {
                setSubforums([{ title: "General", slug: "general" }]);
            });
    }, []);

    useEffect(() => {
        if (postData?.subforum) {
            setSubforumToAssign(postData.subforum);
        }
    }, [postData?.subforum]);

    const skeletonLoaderComments: CommentType[] = [
        {
            id: -1,
            postId: -1,
            parentReplyId: null,
            author: "",
            description: "",
            subcomments: [
                {
                    id: -2,
                    postId: -1,
                    parentReplyId: -1,
                    author: "",
                    description: "",
                    subcomments: [
                        {
                            id: -3,
                            postId: -1,
                            parentReplyId: -2,
                            author: "",
                            description: "",
                            subcomments: [],
                        },
                    ],
                },
                {
                    id: -4,
                    postId: -1,
                    parentReplyId: -1,
                    author: "",
                    description: "",
                    subcomments: [],
                },
            ],
        },
    ];

    const onCreateReply = async (
        parentReplyId: number | null,
        textContent: string,
    ) => {
        if (!canDisplay || textContent.trim().length === 0) {
            return;
        }

        const token = await getStoredAccessToken();
        if (!token) {
            notifyErrorDefault("You need to be logged in to reply");
            return;
        }

        const response = await fetch(
            `${API_ENDPOINT}/api/posts/${postId}/replies/`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    content: textContent,
                    content_markdown: textContent,
                    parent_reply: parentReplyId,
                }),
            },
        );

        if (!response.ok) {
            const detail = await extractDetailFromErrorResponse(response);
            notifyErrorDefault(detail ?? "Failed to create reply");
            return;
        }

        await fetchReplies();
        setReplyingToPost(false);
        setPostData((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                replies_count: (prev.replies_count ?? 0) + 1,
            };
        });
    };

    const onPostLikeClick = async () => {
        if (!canDisplay) return;

        const token = await getStoredAccessToken();
        if (!token) {
            notifyErrorDefault("You need to be logged in to like");
            return;
        }

        const response = await fetch(
            `${API_ENDPOINT}/api/posts/${postId}/like/`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );

        if (!response.ok) {
            notifyErrorDefault("Failed to update like");
            return;
        }

        const payload = await response.json();
        const likesCount = payload.likes_count ?? 0;

        setPostData((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                likes_count: likesCount,
                votes: likesCount,
            };
        });

        useSelectedPostStore.setState({ likes: likesCount });
    };

    const onDeletePostClicked = async () => {
        if (!canDisplay || !canDeletePost || isDeletingPost) return;

        const shouldDelete = window.confirm(
            "Delete this post permanently? This cannot be undone.",
        );
        if (!shouldDelete) return;

        const token = await getStoredAccessToken();
        if (!token) {
            notifyErrorDefault("You need to be logged in to delete");
            return;
        }

        setIsDeletingPost(true);
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
            navigate("/");
        } finally {
            setIsDeletingPost(false);
        }
    };

    const onAssignSubforumClicked = async () => {
        if (!canDisplay || !canDeletePost || isAssigningSubforum) return;

        const token = await getStoredAccessToken();
        if (!token) {
            notifyErrorDefault("You need to be logged in to update subforum");
            return;
        }

        setIsAssigningSubforum(true);
        try {
            const response = await fetch(
                `${API_ENDPOINT}/api/posts/${postId}/subforum/`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ subforum: subforumToAssign }),
                },
            );

            if (!response.ok) {
                const detail = await extractDetailFromErrorResponse(response);
                notifyErrorDefault(detail ?? "Failed to update subforum");
                return;
            }

            const updated: PostResponse = await response.json();
            setPostData(updated);
            postsStore.setState((prev) => ({
                ...prev,
                posts: prev.posts.map((p) =>
                    p.id === updated.id ? { ...p, subforum: updated.subforum } : p,
                ),
            }));
        } finally {
            setIsAssigningSubforum(false);
        }
    };

    return (
        <div className="flex flex-col items-center px-2 py-2">
            <div className="flex flex-col gap-2 w-full">
                {!canDisplay && (
                    <span className="text-black/50">Invalid post id.</span>
                )}
                {canDisplay && postData && (
                    <>
                        <Post
                            title={postData.title}
                            description={
                                postData.content_markdown || postData.content
                            }
                            created_at={postData.created_at}
                            votes={postData.likes_count ?? postData.votes ?? 0}
                            commentsCount={postData.replies_count ?? 0}
                            id={postData.id}
                            onLikeClick={onPostLikeClick}
                            subforumText={`Subforum: ${postData.subforum || "general"}`}
                            subforumControl={
                                <div className="flex gap-2 items-center">
                                    <select
                                        className="px-2 py-2 border border-black/15 rounded-md"
                                        value={subforumToAssign}
                                        onChange={(e) =>
                                            setSubforumToAssign(e.target.value)
                                        }
                                        disabled={!canDeletePost || isAssigningSubforum}
                                    >
                                        {subforums.map((subforum) => (
                                            <option
                                                key={subforum.slug}
                                                value={subforum.slug}
                                            >
                                                {subforum.title}
                                            </option>
                                        ))}
                                    </select>
                                    <Button
                                        text={
                                            isAssigningSubforum
                                                ? "Updating..."
                                                : "Add to Subforum"
                                        }
                                        onClick={onAssignSubforumClicked}
                                        disabled={!canDeletePost || isAssigningSubforum}
                                        isPrimary={true}
                                    ></Button>
                                </div>
                            }
                            isInPostList={false}
                        ></Post>
                        {canDeletePost && (
                            <div className="w-full">
                                <Button
                                    icon={
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            height="24px"
                                            viewBox="0 -960 960 960"
                                            width="24px"
                                            fill="#1f1f1f"
                                        >
                                            <path d="M280-120q-33 0-56.5-23.5T200-200v-560h-40v-80h200v-40h240v40h200v80h-40v560q0 33-23.5 56.5T680-120H280Zm400-640H280v560h400v-560ZM360-280h80v-400h-80v400Zm160 0h80v-400h-80v400ZM280-760v560-560Z" />
                                        </svg>
                                    }
                                    text={isDeletingPost ? "Deleting..." : "Delete Post"}
                                    onClick={onDeletePostClicked}
                                    disabled={isDeletingPost}
                                ></Button>
                            </div>
                        )}
                    </>
                )}

                {canDisplay && replyingToPost && (
                    <CommentReplySection
                        placeholder="Reply to post"
                        onReplyClicked={(text) => onCreateReply(null, text)}
                        setVisible={setReplyingToPost}
                    ></CommentReplySection>
                )}

                {loaded && (
                    <div className="flex flex-col gap-2">
                        {!replyingToPost && (
                            <div className="w-full">
                                <Button
                                    icon={
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            height="24px"
                                            viewBox="0 -960 960 960"
                                            width="24px"
                                            fill="#fff"
                                        >
                                            <path d="M440-400h80v-120h120v-80H520v-120h-80v120H320v80h120v120ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z" />
                                        </svg>
                                    }
                                    text="Reply"
                                    onClick={() => setReplyingToPost(true)}
                                    isPrimary={true}
                                ></Button>
                            </div>
                        )}

                        {comments.map((v) => {
                            return (
                                <Comment
                                    key={v.id}
                                    comment={v}
                                    onReplyCreate={(parentId, text) =>
                                        onCreateReply(parentId, text)
                                    }
                                ></Comment>
                            );
                        })}

                        {comments.length === 0 && (
                            <span className="text-black/50">
                                No replies yet.
                            </span>
                        )}
                    </div>
                )}

                {!loaded && (
                    <div className="flex flex-col gap-2">
                        {skeletonLoaderComments.map((v) => {
                            return (
                                <SkeletonLoaderComment
                                    comment={v}
                                ></SkeletonLoaderComment>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
