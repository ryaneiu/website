export const isValidUsername = (value: string): boolean => {
    return /^[A-Za-z0-9_]+(\.[A-Za-z0-9_]+)*( [A-Za-z0-9_.]+)*$/.test(
        value,
    );
};

export const getUsernameError = (value: string): string => {
    if (!value) return "";

    if (/^\s|\s$/.test(value)) {
        return "No leading or trailing spaces.";
    }

    if (/\s{2,}/.test(value)) {
        return "Only single spaces allowed.";
    }

    if (/\.{2,}/.test(value)) {
        return "Periods cannot be repeated.";
    }

    if (/^\.|\.$/.test(value)) {
        return "Periods must be in the middle.";
    }

    if (!/^[A-Za-z0-9_. ]+$/.test(value)) {
        return "Only letters, numbers, _, ., and spaces allowed.";
    }

    return "";
};