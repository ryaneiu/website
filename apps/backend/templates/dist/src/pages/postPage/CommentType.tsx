export type CommentType = {
    id: number;
    postId: number;
    parentReplyId: number | null;
    author: string;
    description: string;
    subcomments: CommentType[];
}