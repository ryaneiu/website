import { useParams } from "react-router-dom";
import { useSelectedPostStore } from "../../stores/CurrentSelectedPostStore";
import { Post } from "../home/Post";
import { Comment } from "./Comment";
import type { CommentType } from "./CommentType";
import { SkeletonLoaderComment } from "./SkeletonLoaderComment";
import { useEffect, useState } from "react";

export default function PostPage() {
    /* temporary until API exposes an individual post query point */

    const { id } = useParams<{ id: string }>();
    const selectedPostId = useSelectedPostStore((state) => state.postId);

    const canDisplay = id != null && Number.parseInt(id) == selectedPostId;

    const title = useSelectedPostStore((state) => state.title);
    const description = useSelectedPostStore((state) => state.description);
    const createdAt = useSelectedPostStore((state) => state.publishedTime);
    const votes = useSelectedPostStore((state) => state.likes);

    /* delay for skeleton loader */
    const [loaded, setLoaded] = useState<boolean>(false);

    useEffect(() => {
        setTimeout(() => {
            setLoaded(true);
        }, 500);
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    /* skeleton loader data */
    const skeletonLoaderComments: CommentType[] = [
        {
            author: "",
            description: "",
            subcomments: [
                {
                    author: "",
                    description: "",
                    subcomments: [
                        {
                            author: "",
                            description: "",
                            subcomments: [],
                        },
                    ],
                },
                {
                    author: "",
                    description: "",
                    subcomments: [],
                },
            ],
        },
        {
            author: "",
            description: "",
            subcomments: [],
        },
    ];

    /* sample comments list */
    const comments: CommentType[] = [
        {
            author: "bob123",
            description:
                "**This is an example of a comment**. This is an example of a comment. `This is some code`",
            subcomments: [
                {
                    author: "developer123",
                    description: "Recursive comment",
                    subcomments: [
                        {
                            author: "rec",
                            description: "Recrusve recr",
                            subcomments: [],
                        },
                        {
                            author: "totallyofficialmrbeast",
                            description: "comment 2",
                            subcomments: [],
                        },
                    ],
                },
            ],
        },
    ];

    return (
        <div className="flex flex-col items-center px-2 py-2">
            <div className="flex flex-col gap-2 w-full">
                {!canDisplay && (
                    <span className="text-black/50">
                        Can't directly go to post.
                        <br></br>
                        The API currently does not expose an endpoint for this.
                    </span>
                )}
                {canDisplay && (
                    <Post
                        title={title}
                        description={description}
                        created_at={createdAt}
                        votes={votes}
                        id={selectedPostId}
                        isInPostList={false}
                    ></Post>
                )}

                {loaded && (
                    <div className="flex flex-col gap-2">
                        <div className="flex w-full justify-center">
                            <span className="text-black/50">
                                <strong>Note: </strong>example comments. For
                                demo only.
                            </span>
                        </div>
                        {comments.map((v) => {
                            return <Comment comment={v}></Comment>;
                        })}
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
