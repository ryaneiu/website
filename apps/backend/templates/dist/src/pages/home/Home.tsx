import { FadeUp } from "../../components/AnimatedPresenceDiv";
import { PostList } from "./PostList";
import { Button } from "../../components/Button";
import { useNavigate } from "react-router-dom";

export default function Home() {
    const navigate = useNavigate();

    return (
        <FadeUp>
            <main>
                <div className="mb-3">
                    <Button text="Browse Subforums" onClick={() => navigate("/subforums")} />
                </div>
                <PostList></PostList>
            </main>
        </FadeUp>
    );
}
