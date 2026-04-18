import { FadeUp } from "../../components/AnimatedPresenceDiv";
import { PostList } from "./PostList";
import { getAppLanguageFromPath } from "../../i18n";


export default function Home() {
    const language = getAppLanguageFromPath(window.location.pathname);

    return (
        <FadeUp>
            <main>
                <PostList language={language}></PostList>
            </main>
        </FadeUp>
    );
}
