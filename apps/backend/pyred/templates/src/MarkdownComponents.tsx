import ReactMarkdown from "react-markdown";

export const MarkdownComponents: React.ComponentProps<
    typeof ReactMarkdown
>["components"] = {
    h1: ({ children }) => (
        <h1 className="text-3xl font-bold text-black my-3 whitespace-pre-wrap break-words">
            {children}
        </h1>
    ),
    h2: ({ children }) => (
        <h2 className="text-2xl font-bold text-black my-3 whitespace-pre-wrap break-words">
            {children}
        </h2>
    ),
    h3: ({ children }) => (
        <h3 className="text-xl font-semibold text-black my-2 whitespace-pre-wrap break-words">
            {children}
        </h3>
    ),
    h4: ({ children }) => (
        <h4 className="text-lg font-semibold text-black my-2 whitespace-pre-wrap break-words">
            {children}
        </h4>
    ),
    h5: ({ children }) => (
        <h5 className="text-base font-semibold text-black my-2 whitespace-pre-wrap break-words">
            {children}
        </h5>
    ),
    h6: ({ children }) => (
        <h6 className="text-sm font-semibold text-black/80 my-2 whitespace-pre-wrap break-words">
            {children}
        </h6>
    ),
    p: ({ children }) => (
        <p className="text-base text-black my-2 whitespace-pre-wrap break-words">
            {children}
        </p>
    ),
    a: ({ children, href }) => (
        <a
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className="text-blue-700 underline break-all"
        >
            {children}
        </a>
    ),
    ul: ({ children }) => (
        <ul className="list-disc list-inside my-2 pl-2 text-black space-y-1">
            {children}
        </ul>
    ),
    ol: ({ children }) => (
        <ol className="list-decimal list-inside my-2 pl-2 text-black space-y-1">
            {children}
        </ol>
    ),
    li: ({ children }) => (
        <li className="whitespace-pre-wrap break-words">{children}</li>
    ),
    blockquote: ({ children }) => (
        <blockquote className="my-3 border-l-4 border-black/20 pl-3 italic text-black/80 whitespace-pre-wrap break-words">
            {children}
        </blockquote>
    ),
    hr: () => <hr className="my-3 border-black/15" />,
    pre: ({ children }) => (
        <pre className="my-2 rounded-md bg-black text-white p-3 overflow-x-auto text-sm">
            {children}
        </pre>
    ),
    code: ({ children, className }) => {
        const isBlock = Boolean(className);
        if (isBlock) {
            return <code className={className}>{children}</code>;
        }

        return (
            <code className="rounded-md bg-black/5 px-1 py-0.5 whitespace-pre-wrap break-words text-sm">
                {children}
            </code>
        );
    },
    table: ({ children }) => (
        <div className="my-3 overflow-x-auto">
            <table className="min-w-full border border-black/20 text-sm">
                {children}
            </table>
        </div>
    ),
    thead: ({ children }) => <thead className="bg-black/5">{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr className="border-b border-black/10">{children}</tr>,
    th: ({ children }) => (
        <th className="px-2 py-1 text-left font-semibold text-black">{children}</th>
    ),
    td: ({ children }) => (
        <td className="px-2 py-1 text-black whitespace-pre-wrap break-words">{children}</td>
    ),
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    del: ({ children }) => <del className="line-through">{children}</del>,
    input: ({ type, checked }) => {
        if (type === "checkbox") {
            return (
                <input
                    type="checkbox"
                    checked={checked}
                    readOnly
                    disabled
                    className="mr-2 align-middle"
                />
            );
        }

        return <input type={type} readOnly disabled />;
    },
};
