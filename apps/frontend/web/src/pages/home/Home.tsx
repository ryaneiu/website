import {FadeUp} from "../../components/AnimatedPresenceDiv";
import { PostList } from "./PostList";

export default function Home() {

    return <FadeUp>
        <PostList></PostList>
    </FadeUp>
}