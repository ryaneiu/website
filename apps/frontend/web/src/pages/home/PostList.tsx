import { useEffect, useState } from "react";
import { Post } from "./Post";
import { postsStore } from "../../stores/PostsStore";
import { API_ENDPOINT } from "../../Config";
import { useNavigate } from "react-router-dom";
import { getStoredAccessToken } from "../../auth/Authentication";
import { notifyErrorDefault } from "../../stores/NotificationsStore";

export function PostList() {
    const posts = postsStore((state) => state.posts);
    const hasLoaded = postsStore((state) => state.hasLoaded);

    const [errorOccurred, setErrorOccurred] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const a = async () => {
            if (hasLoaded) {
                return;
            }
            postsStore.setState({
                posts: [],
                hasLoaded: true,
            });

            console.log("LOAD POSTS!");
            // Load posts

            const token = await getStoredAccessToken();

            fetch(`${API_ENDPOINT}/api/posts`, {
                method: "GET",
                credentials: "include",
                headers:
                    token != null
                        ? {
                              Authorization: `Bearer ${token}`,
                          }
                        : {},
            })
                .then((response) => {
                    if (response.status != 200) {
                        if (response.status == 401 || response.status == 403) {
                            console.log(
                                "dbg: received unauthorized; need to login. Redirecting",
                            );
                            postsStore.setState({
                                posts: [],
                                hasLoaded: true,
                            });
                            navigate("/auth?action=login");
                            throw new Error("Unauthorized");
                        }
                        notifyErrorDefault("Couldn't fetch posts: " + response.statusText);
                        throw new Error(
                            "Error while fetching posts:" + response.statusText,
                        );
                    }
                    return response.json();
                })
                .then((response) => {
                    console.log("dbg: received response: ", response);

                    postsStore.setState({
                        posts: response,
                        hasLoaded: true,
                    });
                })
                .catch((e) => {
                    console.error("Error while trying to fetch posts: ", e);
                    notifyErrorDefault("An error occurred and we couldn't fetch posts");
                    setErrorOccurred(true);
                });
        };
        a();
    });

    return (
        <>
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

                {posts.length == 0 ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <h1 className="font-bold text-3xl">No posts!</h1>
                    </div>
                ) : null}

                {errorOccurred ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <div>
                            <h1 className="font-bold text-3xl text-black">
                                Error occurred!
                            </h1>
                            <p className="text-black">
                                Check console for more info
                            </p>
                        </div>
                    </div>
                ) : null}
            </div>
        </>
    );
}
