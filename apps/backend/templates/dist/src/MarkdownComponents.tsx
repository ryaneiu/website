import ReactMarkdown from "react-markdown";

export const MarkdownComponents: React.ComponentProps<
    typeof ReactMarkdown
>["components"] = {
    h1: ({ children }) => (
        <span className="whitespace-pre-wrap break-all">{children}</span>
    ),
    h2: ({ children }) => (
        <span className="whitespace-pre-wrap break-all">{children}</span>
    ),
    h3: ({ children }) => (
        <span className="whitespace-pre-wrap break-all">{children}</span>
    ),
    p: ({ children }) => (
        <p className="text-base text-black my-2 whitespace-pre-wrap break-all">
            {children}
        </p>
    ),
    code: ({ children }) => (
        <code className="rounded-md bg-black/5 p-0.5 m-0.5 whitespace-pre-wrap break-all">
            {children}
        </code>
    ),
    a: ({ children }) => (
        <span className="whitespace-pre-wrap break-all">{children}</span>
    ),
    // You can add more elements like a, ul, li, img, etc.
};
