import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { FadeUp } from "../../components/AnimatedPresenceDiv";
import { ElementWithLabel } from "../../components/ElementWithLabel";
import { InputWithLabel } from "../../components/GenericInputWithLabel";
import { SectionSeparator } from "../../components/SectionSeparator";
import { Label } from "../../components/Label";
import { Button } from "../../components/Button";
import { API_ENDPOINT } from "../../Config";
import { getStoredAccessToken } from "../../auth/Authentication";
import {
    notifyErrorDefault,
    notifySuccessDefault,
} from "../../stores/NotificationsStore";
import { useAuthenticationStore } from "../../stores/AuthenticationStore";
import { getAppLanguageFromPath } from "../../i18n";
import {
    getStoredContentFilterPreferences,
    persistContentFilterPreferences,
    type ContentFilterPreferences,
} from "../../contentFilter";
import { FilterToggle } from "../../components/FilterToggle";
import { GoogleIcon } from "../../views/signUp/OAuth2ProviderIcons";
import { LoadableButton } from "../../components/LoadableButton";
import { dataToAvif, terminateWorker } from "../../ImageProcessing";
import { Spinner } from "../../components/SimpleSpinner";

const CAS_OBJECT_URL_PATTERN = /^\/objects\/([a-f0-9]{64})\.bin$/;

function resolveProfileImageInput(value: string): string | null {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
        return null;
    }

    // CAS object URL: /objects/{hash}.bin
    if (CAS_OBJECT_URL_PATTERN.test(trimmed)) {
        return `${API_ENDPOINT}${trimmed}`;
    }

    // Already a full URL starting with the API endpoint + /objects/
    if (trimmed.startsWith(API_ENDPOINT + "/objects/")) {
        return trimmed;
    }

    return null;
}

function dataUrlToBlob(dataUrl: string): Blob {
    const [header, base64Data] = dataUrl.split(",");
    const mimeMatch = header.match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/avif";
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type: mimeType });
}

export default function Profile() {
    const [isProfilePicHovered, sethovered] = useState(false);
    const [username, setUsername] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [bio, setBio] = useState("");
    const [profileImageInput, setProfileImageInput] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUnlinking, setIsUnlinking] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [linkedProviders, setLinkedProviders] = useState<string[]>([]);
    const language = getAppLanguageFromPath(window.location.pathname);
    const resolvedProfileImage = resolveProfileImageInput(profileImageInput);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [preferences, setPreferences] = useState<ContentFilterPreferences>(
        () => getStoredContentFilterPreferences(),
    );

    const includeNsfw = preferences.includeNsfw;
    const includeSwears = preferences.includeSwears;

    const appLanguage = getAppLanguageFromPath(window.location.pathname);

    const updatePreferences = (next: ContentFilterPreferences) => {
        setPreferences(next);
        persistContentFilterPreferences(next);
    };

    const onFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
        const target = event.target as HTMLInputElement;
        if (!target.files || target.files.length === 0) return;
        const file = target.files[0];

        try {
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(file);
            });
            await uploadImageDataUrl(base64);
        } catch (e) {
            console.error("Failed to process profile image:", e);
            notifyErrorDefault("Failed to process image. Please try another.");
        } finally {
            // Reset file input so the same file can be selected again
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const uploadImageDataUrl = async (dataUrl: string) => {
        if (isUploadingImage) return;
        setIsUploadingImage(true);
        try {
            // Encode to AVIF
            const avifDataUrl = await dataToAvif(dataUrl, false);
            const blob = dataUrlToBlob(avifDataUrl);

            // Upload to CAS
            const token = await getStoredAccessToken();
            if (!token) {
                notifyErrorDefault("You need to login first.");
                return;
            }

            const formData = new FormData();
            formData.append("file", blob, "profile.avif");

            const response = await fetch(
                `${API_ENDPOINT}/api/profile/upload-image/`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                    credentials: "omit",
                },
            );

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(
                    errorPayload.detail ?? "Failed to upload image.",
                );
            }

            const payload = await response.json();
            // Store the CAS object URL as the profile image
            setProfileImageInput(payload.profile_image);
            notifySuccessDefault(
                language === "fr"
                    ? "Image de profil telechargee."
                    : "Profile image uploaded.",
            );
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            notifyErrorDefault(message);
        } finally {
            setIsUploadingImage(false);
        }
    };

    // Cleanup AVIF worker on unmount
    useEffect(() => {
        return () => {
            terminateWorker();
        };
    }, []);

    useEffect(() => {
        const loadProfile = async () => {
            const token = await getStoredAccessToken();
            if (!token) {
                notifyErrorDefault("You need to login first.");
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(
                    `${API_ENDPOINT}/api/profile/me/`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        credentials: "omit"
                    },
                );

                if (!response.ok) {
                    throw new Error("Failed to load profile");
                }

                const payload = await response.json();
                setUsername(payload.username ?? "");
                setDisplayName(payload.display_name ?? "");
                setEmail(payload.email ?? "");
                setBio(payload.bio ?? "");
                setProfileImageInput(payload.profile_image ?? "");
                setLinkedProviders(
                    Array.isArray(payload.linked_providers)
                        ? payload.linked_providers
                        : [],
                );
            } catch {
                notifyErrorDefault(
                    language === "fr"
                        ? "Impossible de charger le profil."
                        : "Failed to load profile.",
                );
            } finally {
                setIsLoading(false);
            }
        };

        loadProfile();
    }, [language]);

    // Check for ?link=success|error after returning from Google OAuth connect
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const linkStatus = params.get("link");
        if (linkStatus === "success") {
            notifySuccessDefault(
                language === "fr"
                    ? "Compte Google lie avec succes."
                    : "Google account linked successfully.",
            );
            const url = new URL(window.location.href);
            url.searchParams.delete("link");
            window.history.replaceState(null, "", url.toString());
            setLinkedProviders(["google"]);
        } else if (linkStatus === "error") {
            notifyErrorDefault(
                language === "fr"
                    ? "Echec de la liaison du compte Google."
                    : "Failed to link Google account.",
            );
            const url = new URL(window.location.href);
            url.searchParams.delete("link");
            window.history.replaceState(null, "", url.toString());
        }
    }, []);

    const handleLinkGoogle = () => {
        window.location.href = `${API_ENDPOINT}/api/profile/link-google/`;
    };

    const handleUnlinkGoogle = async () => {
        if (isUnlinking) return;
        setIsUnlinking(true);
        try {
            const token = await getStoredAccessToken();
            if (!token) {
                notifyErrorDefault("You need to login first.");
                setIsUnlinking(false);
                return;
            }
            const response = await fetch(
                `${API_ENDPOINT}/api/profile/unlink-google/`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                    credentials: "omit",
                },
            );
            if (response.ok) {
                setLinkedProviders((prev) =>
                    prev.filter((p) => p !== "google"),
                );
                notifySuccessDefault(
                    language === "fr"
                        ? "Compte Google dissocie."
                        : "Google account unlinked.",
                );
            } else {
                const payload = await response.json().catch(() => ({}));
                notifyErrorDefault(
                    payload.detail ?? "Failed to unlink Google account.",
                );
            }
        } catch {
            notifyErrorDefault("Failed to unlink Google account.");
        } finally {
            setIsUnlinking(false);
        }
    };

    const onSaveClicked = async () => {
        if (isSaving) return;

        const emailValue = email.trim().toLowerCase();
        if (
            !emailValue.includes("@") ||
            !emailValue.split("@")[1]?.includes(".")
        ) {
            notifyErrorDefault(
                language === "fr"
                    ? "Veuillez entrer un e-mail avec un vrai domaine."
                    : "Please enter an email with a real domain.",
            );
            return;
        }

        // No validation needed — profile image can only come from upload now

        const token = await getStoredAccessToken();
        if (!token) {
            notifyErrorDefault("You need to login first.");
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch(`${API_ENDPOINT}/api/profile/me/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    username,
                    display_name: displayName,
                    email: emailValue,
                    bio,
                    profile_image: profileImageInput,
                }),
                credentials: "omit"
            });

            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                notifyErrorDefault(
                    payload.detail ?? "Failed to update profile",
                );
                return;
            }

            setUsername(payload.username ?? username);
            setDisplayName(payload.display_name ?? displayName);
            setEmail(payload.email ?? emailValue);
            setBio(payload.bio ?? bio);
            setProfileImageInput(payload.profile_image ?? profileImageInput);
            useAuthenticationStore.setState({
                username: payload.username ?? username,
                displayName: payload.display_name ?? displayName,
                bio: payload.bio ?? bio,
                profileImage: payload.profile_image ?? profileImageInput,
            });
            notifySuccessDefault(
                language === "fr"
                    ? "Profil mis à jour."
                    : "Profile updated successfully.",
            );
        } catch {
            notifyErrorDefault(
                language === "fr"
                    ? "Échec de la mise à jour du profil."
                    : "Failed to update profile.",
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <FadeUp className="flex flex-col gap-4 items-center px-4 py-4 w-full">
            <h1 className="text-3xl font-bold ">
                {language === "fr" ? "Modifier le profil" : "Edit Profile"}
            </h1>

            {/* Hidden file input for profile image upload */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileSelected}
                disabled={isUploadingImage}
            />

            <div className="flex gap-4 items-center w-full lg:flex-row flex-col">
                <div
                    className="relative w-[128px] h-[128px] md:w-[256px] md:h-[256px] cursor-pointer rounded-full"
                    onMouseEnter={() => sethovered(true)}
                    onMouseLeave={() => sethovered(false)}
                    onClick={() => fileInputRef.current?.click()}
                >
                    {isUploadingImage ? (
                        <span className="absolute top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2">
                            <Spinner />
                        </span>
                    ) : resolvedProfileImage != null ? (
                        <img
                            src={resolvedProfileImage}
                            alt={
                                language === "fr"
                                    ? "Image de profil"
                                    : "Profile image"
                            }
                            className="w-[128px] h-[128px] min-w-[128px] min-h-[128px] md:w-[256px] md:min-w-[256px] md:h-[256px] md:min-h-[256px] rounded-full object-cover border border-black/15 dark:border-white/15"
                        />
                    ) : (
                        <span className="absolute md:top-0 md:left-0 top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:translate-y-0">
                            <svg
                                className="md:h-[256px] md:w-[256px] h-[128px] w-[128px]"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 -960 960 960"
                                fill="currentColor"
                            >
                                <path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm146.5-204.5Q340-521 340-580t40.5-99.5Q421-720 480-720t99.5 40.5Q620-639 620-580t-40.5 99.5Q539-440 480-440t-99.5-40.5ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm100-95.5q47-15.5 86-44.5-39-29-86-44.5T480-280q-53 0-100 15.5T294-220q39 29 86 44.5T480-160q53 0 100-15.5ZM523-537q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Zm-43-43Zm0 360Z" />
                            </svg>
                        </span>
                    )}
                    {isProfilePicHovered && !isUploadingImage && (
                        <span className="absolute top-0 left-0 z-9 bg-black/50 flex items-center justify-center w-full h-full rounded-full">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="64px"
                                viewBox="0 -960 960 960"
                                width="64px"
                                fill="currentColor"
                                className="text-white dark:text-black transition-colors duration-300"
                            >
                                <path d="M440-440ZM120-120q-33 0-56.5-23.5T40-200v-480q0-33 23.5-56.5T120-760h126l74-80h240v80H355l-73 80H120v480h640v-360h80v360q0 33-23.5 56.5T760-120H120Zm640-560v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80ZM440-260q75 0 127.5-52.5T620-440q0-75-52.5-127.5T440-620q-75 0-127.5 52.5T260-440q0 75 52.5 127.5T440-260Zm0-80q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29Z" />
                            </svg>
                        </span>
                    )}
                </div>

                <div className="flex flex-col gap-2 flex-grow-1">
                    <InputWithLabel
                        label={
                            language === "fr" ? "Nom d'utilisateur" : "Username"
                        }
                        placeholder={
                            language === "fr"
                                ? "Votre nom d'utilisateur..."
                                : "Your username..."
                        }
                        className="w-full"
                        value={username}
                        onChange={(event) => {
                            setUsername(event.currentTarget.value);
                        }}
                    ></InputWithLabel>
                    <InputWithLabel
                        label={
                            language === "fr" ? "Nom affiche" : "Display name"
                        }
                        placeholder={
                            language === "fr"
                                ? "Votre nom affiche..."
                                : "Your display name..."
                        }
                        className="w-full"
                        maxLength={32}
                        value={displayName}
                        onChange={(event) => {
                            setDisplayName(event.currentTarget.value);
                        }}
                    ></InputWithLabel>
                    <ElementWithLabel
                        label={language === "fr" ? "Bio" : "Bio"}
                        element={
                            <textarea
                                className="w-full px-2 py-2 rounded-md border border-black/15 dark:border-white/15 focus:outline-none focus:border-black/35 dark:focus:border-white/35 resize-none transition-colors duration-300"
                                rows={2}
                                placeholder={
                                    language === "fr"
                                        ? "Parlez un peu de vous"
                                        : "Tell others a bit about yourself"
                                }
                                draggable={false}
                                value={bio}
                                onChange={(event) => {
                                    setBio(event.currentTarget.value);
                                }}
                            ></textarea>
                        }
                    ></ElementWithLabel>
                    <div className="flex gap-2">
                        <Button
                            text={
                                isUploadingImage
                                    ? language === "fr"
                                        ? "Telechargement..."
                                        : "Uploading..."
                                    : language === "fr"
                                      ? "Telecharger une image"
                                      : "Upload Image"
                            }
                            icon={
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="24px"
                                    viewBox="0 -960 960 960"
                                    width="24px"
                                    fill="currentColor"
                                >
                                    <path d="M440-440ZM120-120q-33 0-56.5-23.5T40-200v-480q0-33 23.5-56.5T120-760h126l74-80h240v80H355l-73 80H120v480h640v-360h80v360q0 33-23.5 56.5T760-120H120Zm640-560v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80ZM440-260q75 0 127.5-52.5T620-440q0-75-52.5-127.5T440-620q-75 0-127.5 52.5T260-440q0 75 52.5 127.5T440-260Zm0-80q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29Z" />
                                </svg>
                            }
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingImage}
                            additionalClasses="text-sm"
                        ></Button>
                        {profileImageInput.trim().length > 0 && (
                            <Button
                                text={
                                    language === "fr" ? "Effacer" : "Clear"
                                }
                                onClick={() => setProfileImageInput("")}
                                disabled={isUploadingImage}
                                additionalClasses="text-sm"
                            ></Button>
                        )}
                    </div>
                    <p className="text-sm text-black/65 dark:text-white/65">
                        {language === "fr"
                            ? "Cliquez sur la photo de profil ou le bouton pour telecharger une image."
                            : "Click the profile picture or button to upload an image."}
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <SectionSeparator sectionName="Filtering and preferences"></SectionSeparator>
                <section className="flex gap-3">
                    <FilterToggle
                        label={appLanguage === "fr" ? "NSFW" : "NSFW"}
                        checked={includeNsfw}
                        onChange={(checked) =>
                            updatePreferences({
                                includeNsfw: checked,
                                includeSwears,
                            })
                        }
                    />
                    <FilterToggle
                        label={
                            appLanguage === "fr" ? "Mots vulgaires" : "Swears"
                        }
                        checked={includeSwears}
                        onChange={(checked) =>
                            updatePreferences({
                                includeNsfw,
                                includeSwears: checked,
                            })
                        }
                    />
                </section>
                <SectionSeparator sectionName="Security"></SectionSeparator>
                <section>
                    <Label
                        text={language === "fr" ? "Mot de passe" : "Password"}
                    ></Label>
                    <p className="">
                        {language === "fr"
                            ? "Pour votre sécurité, votre mot de passe n'est pas affiché ici."
                            : "For your own safety, your password is not shown here."}{" "}
                        <a className="underline cursor-pointer">
                            {language === "fr"
                                ? "Changer le mot de passe"
                                : "Change Password"}
                        </a>
                    </p>
                </section>
                <section>
                    <InputWithLabel
                        label="Email"
                        placeholder="you@example.com"
                        className="w-full"
                        value={email}
                        type="email"
                        onChange={(event) => {
                            setEmail(event.currentTarget.value);
                        }}
                    ></InputWithLabel>
                </section>
                <SectionSeparator sectionName={language === "fr" ? "Comptes lies" : "Linked Accounts"}></SectionSeparator>
                <section className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        {GoogleIcon}
                        <span className="text-sm font-medium text-black dark:text-white transition-colors duration-300">
                            Google
                        </span>
                        {linkedProviders.includes("google") ? (
                            <>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 transition-colors duration-300">
                                    {language === "fr" ? "Lie" : "Connected"}
                                </span>
                                <div className="flex-grow"></div>
                                <LoadableButton
                                    text={language === "fr" ? "Dissocier" : "Unlink"}
                                    isLoading={isUnlinking}
                                    onClick={handleUnlinkGoogle}
                                    additionalClasses="!py-1 !px-3 text-sm"
                                ></LoadableButton>
                            </>
                        ) : (
                            <>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors duration-300">
                                    {language === "fr" ? "Non lie" : "Not connected"}
                                </span>
                                <div className="flex-grow"></div>
                                <Button
                                    text={language === "fr" ? "Lier" : "Link"}
                                    onClick={handleLinkGoogle}
                                    additionalClasses="!py-1 !px-3 text-sm"
                                ></Button>
                            </>
                        )}
                    </div>
                </section>
            </div>
            <div className="w-full mt-10 py-2 border-b border-b-black/35">
                <span className="float-right">
                    <Button
                        icon={
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="24px"
                                viewBox="0 -960 960 960"
                                width="24px"
                                fill="currentColor"
                                className="text-white dark:text-black transition-colors duration-300"
                            >
                                <path d="M840-680v480q0 33-23.5 56.5T760-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h480l160 160Zm-80 34L646-760H200v560h560v-446ZM565-275q35-35 35-85t-35-85q-35-35-85-35t-85 35q-35 35-35 85t35 85q35 35 85 35t85-35ZM240-560h360v-160H240v160Zm-40-86v446-560 114Z" />
                            </svg>
                        }
                        text={
                            isLoading
                                ? language === "fr"
                                    ? "Chargement..."
                                    : "Loading..."
                                : isSaving
                                  ? language === "fr"
                                      ? "Enregistrement..."
                                      : "Saving..."
                                  : language === "fr"
                                    ? "Enregistrer"
                                    : "Save"
                        }
                        isPrimary={true}
                        onClick={onSaveClicked}
                        disabled={isLoading || isSaving}
                    ></Button>
                </span>
            </div>
        </FadeUp>
    );
}
