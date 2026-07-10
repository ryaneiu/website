export type CommentType = {
    id: number;
    postId: number;
    parentReplyId: number | null;
    author: string;
    authorProfileImage?: string | null;
    description: string;
    subcomments: CommentType[];
    likesCount?: number;
    userHasLiked?: boolean;
}