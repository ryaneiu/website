import { useParams } from "react-router-dom";
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

type PostResponse = {
    id: number;
    title: string;
    content: string;
    content_markdown?: string;
    likes_count?: number;
    votes?: number;
    replies_count?: number;
    created_at: string;
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
    const selectedPostId = useSelectedPostStore((state) => state.postId);

    const [loaded, setLoaded] = useState<boolean>(false);
    const [replyingToPost, setReplyingToPost] = useState(false);
    const [comments, setComments] = useState<CommentType[]>([]);
    const [postData, setPostData] = useState<PostResponse | null>(null);

    const postId = id != null ? Number.parseInt(id) : selectedPostId;
    const canDisplay = Number.isFinite(postId) && postId > 0;

    const buildCommentTree = useCallback((replies: ReplyResponse[]): CommentType[] => {
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
    }, []);

    const fetchReplies = useCallback(async () => {
        if (!canDisplay) return;

        const response = await fetch(`${API_ENDPOINT}/api/posts/${postId}/replies/`, {
            method: "GET",
        });

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
                    fetch(`${API_ENDPOINT}/api/posts/${postId}/`, { method: "GET" }),
                    fetchReplies(),
                ]);

                if (!postResponse.ok) {
                    throw new Error("Failed to fetch post");
                }

                const postPayload: PostResponse = await postResponse.json();
                setPostData(postPayload);

                useSelectedPostStore.setState({
                    title: postPayload.title,
                    description: postPayload.content_markdown || postPayload.content,
                    publishedTime: postPayload.created_at,
                    likes: postPayload.likes_count ?? postPayload.votes ?? 0,
                    comments: postPayload.replies_count ?? 0,
                    postId,
                    selectedAny: true,
                });
            } catch (error) {
                notifyErrorDefault(error instanceof Error ? error.message : "Failed to load post page");
            } finally {
                setLoaded(true);
            }
        };

        loadPostPage();
    }, [canDisplay, fetchReplies, postId]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

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
        }
    ];

    const onCreateReply = async (parentReplyId: number | null, textContent: string) => {
        if (!canDisplay || textContent.trim().length === 0) {
            return;
        }

        const token = await getStoredAccessToken();
        if (!token) {
            notifyErrorDefault("You need to be logged in to reply");
            return;
        }

        const response = await fetch(`${API_ENDPOINT}/api/posts/${postId}/replies/`, {
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
        });

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

        const response = await fetch(`${API_ENDPOINT}/api/posts/${postId}/like/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

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

    return (
        <div className="flex flex-col items-center px-2 py-2">
            <div className="flex flex-col gap-2 w-full">
                {!canDisplay && (
                    <span className="text-black/50">
                        Invalid post id.
                    </span>
                )}
                {canDisplay && postData && (
                    <Post
                        title={postData.title}
                        description={postData.content_markdown || postData.content}
                        created_at={postData.created_at}
                        votes={postData.likes_count ?? postData.votes ?? 0}
                        commentsCount={postData.replies_count ?? 0}
                        id={postData.id}
                        onLikeClick={onPostLikeClick}
                        isInPostList={false}
                    ></Post>
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
                                <button
                                    className="px-3 py-1 border border-black/20 rounded-md cursor-pointer"
                                    onClick={() => setReplyingToPost(true)}
                                >
                                    Add reply
                                </button>
                            </div>
                        )}

                        {comments.map((v) => {
                            return <Comment key={v.id} comment={v} onReplyCreate={(parentId, text) => onCreateReply(parentId, text)}></Comment>;
                        })}

                        {comments.length === 0 && (
                            <span className="text-black/50">No replies yet.</span>
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
