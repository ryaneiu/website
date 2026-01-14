import { useEffect } from "react";
import { Post } from "./Post";
import { postsStore } from "../../stores/PostsStore";
import { API_ENDPOINT } from "../../Config";

export function PostList() {
    const posts = postsStore((state) => state.posts);
    const hasLoaded = postsStore((state) => state.hasLoaded);

    useEffect(() => {
        if (hasLoaded) {
            return;
        }
        postsStore.setState({
            posts: [],
            hasLoaded: true
        });


        console.log("LOAD POSTS!");
        // Load posts

        fetch(`${API_ENDPOINT}/posts`, {
            method: "GET",
        })
            .then((response) => response.json())
            .then((response) => {
                console.log("dbg: received response: ", response);
                postsStore.setState({
                    posts: response,
                    hasLoaded: true,
                });
            });
    }, []);

    return (
        <>
            <span className="text-black/50 text-md">
                Everything here is just a demo! Nothing is actually hooked to
                the rest API yet.
            </span>
            <div className="flex flex-col gap-4 items-center w-full">
                {posts.map((post, index) => {
                    return (
                        <Post
                            title={post.title}
                            description={post.body}
                            timePublished={post.createdAt}
                            key={index}
                            upVotes={post.votes}
                        ></Post>
                    );
                })}

                {posts.length == 0 ? <div className="w-full h-full flex items-center justify-center">
                    <h1>No posts!</h1>
                </div> : null}
            </div>
        </>
    );
}
