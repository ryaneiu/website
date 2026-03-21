export type CommentType = {
    author: string;
    description: string;
    subcomments: CommentType[]
}