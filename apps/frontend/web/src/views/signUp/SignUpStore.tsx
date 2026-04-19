import { create } from "zustand";

export type Errors = {
    loginUsername: string;
    loginPassword: string;
    signUpUsername: string;
    signUpEmail: string;
    signUpPassword: string;
    SignUpConfirmPassword: string;
};

type FieldValues = {
    loginUsername: string;
    loginPassword: string;
    signUpUsername: string;
    signUpEmail: string;
    signUpPassword: string;
    SignUpConfirmPassword: string;
};

type ErrorKey = keyof Errors;

interface SignUpStore {
    formErrors: Errors;
    values: FieldValues;
    updateValue: (partial: Partial<FieldValues>) => void;
    updateErrors: (update: Partial<Errors>) => void;
    forgiveError: (k: ErrorKey) => void;
    screenStage: number;
    setScreenStage: (stage: number) => void;

    isLogin: boolean;
}

export const useSignUpStore = create<SignUpStore>((set, get) => {
    return {
        formErrors: {
            loginPassword: "",
            loginUsername: "",
            signUpUsername: "",
            signUpEmail: "",
            signUpPassword: "",
            SignUpConfirmPassword: "",
        },
        updateErrors: (partial) => {
            set((prev) => ({
                ...prev,
                formErrors: {
                    ...prev.formErrors,
                    ...partial,
                },
            }));
        },
        forgiveError: (k) => {
            const current = get();
            current.updateErrors({ [k]: "" });
        },
        screenStage: 0,
        setScreenStage: (stage: number) => {
            set({ screenStage: stage });
        },
        values: {
            loginPassword: "",
            loginUsername: "",
            signUpUsername: "",
            signUpEmail: "",
            signUpPassword: "",
            SignUpConfirmPassword: "",
        },
        updateValue: (partial) => {
            set((prev) => ({
                ...prev,
                values: {
                    ...prev.values,
                    ...partial,
                },
            }));
        },

        isLogin: false
    };
});
