import { useEffect, useState } from "react";
import { Button } from "../components/Button";

interface Post {
    id: number;
    title: string;
    content: string;
    published: boolean;
}

export function PublishPostView() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch all posts (or only your posts)
    const fetchPosts = async () => {
        try {
            const res = await fetch("http://127.0.0.1:8000/api/posts/", {
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to fetch posts");
            const data = await res.json();
            setPosts(data);
        } catch (err) {
            console.error(err);
            alert("Error fetching posts");
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const onPublish = async (postId: number) => {
        setLoading(true);
        try {
            const res = await fetch(
                `http://127.0.0.1:8000/api/posts/${postId}/publish/`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                }
            );
            if (!res.ok) throw new Error("Failed to publish post");
            const updatedPost = await res.json();
            // Update local state
            setPosts((prev) =>
                prev.map((p) => (p.id === postId ? updatedPost : p))
            );
        } catch (err) {
            console.error(err);
            alert("Error publishing post");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">My Posts</h1>
            {posts.map((post) => (
                <div
                    key={post.id}
                    className="border p-3 mb-3 rounded-md flex justify-between items-center"
                >
                    <div>
                        <h2 className="font-semibold">{post.title}</h2>
                        <p className="text-sm">{post.content}</p>
                        <p className="text-xs text-gray-500">
                            {post.published ? "Published ✅" : "Draft 📝"}
                        </p>
                    </div>
                    {!post.published && (
                        <Button
                            text={loading ? "Publishing..." : "Publish"}
                            isPrimary
                            onClick={() => onPublish(post.id)}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
