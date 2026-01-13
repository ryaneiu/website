import { Post } from "./Post";

export function PostList() {
    return <>
    <span className="text-black/50 text-md">Everything here is just a demo! Nothing is actually hooked to the rest API yet.</span>
    <div className="flex flex-col gap-4 items-center w-full">

        

        <Post title="Magnificne tUI" description="Thank you for creating such a cool and beautiful looking UI" timePublished="Yesterday"></Post>
        <Post title="this UI looks #$#@" description="Thank you for creating such a cool and beautiful looking UI" timePublished="2 Weeks ago"></Post>
    </div>
    </>
}