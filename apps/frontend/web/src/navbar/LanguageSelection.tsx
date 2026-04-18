import { useNavigate } from "react-router-dom";
import { getAppLanguageFromPath, localizePath, stripLanguagePrefix } from "../i18n";

export function LanguageSelection() {

    const navigate = useNavigate();
    const activeLanguage = getAppLanguageFromPath(location.pathname);

    return (
        <select
            className="h-9 rounded-full border border-black/15 dark:border-white/15 bg-white dark:bg-zinc-800 px-2 text-sm transition-colors duration-300"
            value={activeLanguage}
            onChange={(event) => {
                const basePath = stripLanguagePrefix(location.pathname);
                const nextPath = localizePath(
                    basePath,
                    event.target.value === "fr" ? "fr" : "en",
                );
                navigate({
                    pathname: nextPath,
                    search: location.search,
                });
            }}
            aria-label="Language"
        >
            <option value="en">English</option>
            <option value="fr">Français</option>
        </select>
    );
}
