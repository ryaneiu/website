import clsx from "clsx";

interface Props {
  isWhite?: boolean;
  alwaysWhite?: boolean;
}

export function Spinner({ isWhite, alwaysWhite }: Props) {
  return (
    <div
      className={clsx(
        "w-6 h-6 rounded-full border-3 border-solid border-t-transparent animate-spin",
        (isWhite && !alwaysWhite)
          ? "border-white dark:border-black border-t-transparent dark:border-t-transparent"
          : "border-black dark:border-white border-t-transparent dark:border-t-transparent",
        alwaysWhite && "border-white border-t-transparent"
      )}
    />
  );
}