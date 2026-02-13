import {FadeUp} from "../../components/AnimatedPresenceDiv";
import { PostList } from "./PostList";

export function Home() {
    return <FadeUp>
        <PostList></PostList>
    </FadeUp>
}