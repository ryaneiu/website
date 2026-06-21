import { useNavigate, useParams } from "react-router-dom";
import { API_ENDPOINT } from "../Config";
import { useState } from "react";
import { useAttachmentViewGoBackStore } from "../stores/AttachmentViewGoBackStore";
import { TransparentIconButton } from "../components/TransparentIconButton";

export function ImageView() {
    const { id } = useParams<{ id: string }>();

    const [failed, setFailed] = useState<boolean>(false);

    const goBackTo = useAttachmentViewGoBackStore((state) => state.goBackTo);
    const navigate = useNavigate();
    const dataUrl = useAttachmentViewGoBackStore(state=>state.dataUrl);

    let src = "";
    if (id == "data") {
        src = dataUrl;
    } else {
        src = `${API_ENDPOINT}/objects/${id}.bin`;
    }



    return (
        <div className="w-full h-full relative bg-white dark:bg-black flex justify-center items-center">
            <div className="absolute top-0 right-0 m-1">
                <TransparentIconButton
                    icon={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="#e3e3e3"
                        >
                            <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                        </svg>
                    }
                    onClick={() => {
                        navigate(goBackTo);
                    }}
                ></TransparentIconButton>
            </div>

            {!failed ? (
                <img
                    src={src}
                    alt="Image"
                    className="w-full h-auto max-h-full object-contain"
                    onError={() => setFailed(true)}
                />
            ) : (
                <p className="text-black dark:text-white">
                    Failed to load image
                </p>
            )}
        </div>
    );
}
