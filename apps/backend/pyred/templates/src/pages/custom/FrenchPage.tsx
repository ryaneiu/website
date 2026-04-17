import { FadeUp } from "../../components/AnimatedPresenceDiv";
import { Panel } from "../../components/Panel";
import { PostList } from "../home/PostList";

export default function FrenchPage() {
    return (
        <FadeUp className="w-full">
            <Panel className="flex flex-col gap-3 mb-4">
                <h1 className="text-3xl font-semibold">Page française personnalisée</h1>
                <p className="text-black/70 dark:text-white/70 transition-colors duration-300">
                    Bienvenue sur la version française personnalisée.
                </p>
                <p className="text-black/70 dark:text-white/70 transition-colors duration-300">
                    Les publications en français restent ici, séparées des publications en anglais.
                </p>
            </Panel>
            <PostList language="fr" />
        </FadeUp>
    );
}
