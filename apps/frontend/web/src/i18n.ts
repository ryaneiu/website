export type AppLanguage = "en" | "fr";

export function getAppLanguageFromPath(pathname: string): AppLanguage {
    return pathname === "/fr" || pathname.startsWith("/fr/") ? "fr" : "en";
}

export function stripLanguagePrefix(pathname: string): string {
    if (pathname === "/fr") {
        return "/";
    }

    if (pathname.startsWith("/fr/")) {
        return pathname.slice(3);
    }

    return pathname;
}

export function localizePath(pathname: string, language: AppLanguage): string {
    const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
    const basePath = stripLanguagePrefix(normalized);

    if (language === "fr") {
        return basePath === "/" ? "/fr" : `/fr${basePath}`;
    }

    return basePath;
}
