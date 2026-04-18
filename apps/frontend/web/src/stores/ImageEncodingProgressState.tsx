// enums

export const Progress = {
    NONE: 0,
    DOWNLOADING_ENCODER: 1,
    PREPROCESSING: 2,
    ENCODING: 3
} as const;

export type ProgressType = typeof Progress[keyof typeof Progress];