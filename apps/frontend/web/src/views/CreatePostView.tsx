import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { TransparentIconButton } from "../components/TransparentIconButton";

export function CreatePostView() {

    const navigate = useNavigate();

    const onCloseView = () => {
        navigate("/");
    }

    return (
        <div className="w-full h-[100vh] flex justify-center items-center">
            <div className="flex flex-col gap-3 border border-black/15 px-4 py-2 items-center relative rounded-md">
                <div className="absolute top-0 right-0 m-1">
                    <TransparentIconButton onClick={onCloseView} icon={<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>}></TransparentIconButton>
                </div>
                <h1 className="text-3xl font-bold text-black">Create Post</h1>

                <textarea
                    className="px-2 py-2 w-[90vw] sm:w-[80vw] md:w-[60vw] lg:w-[40vw] h-[60vh] rounded-md border border-black/15 focus:outline-none focus:border border-black/35"
                    placeholder="Your random thoughts..."
                    
                ></textarea>

                <div>
                    <Button
                        text="Publish Post"
                        isPrimary={true}
                        icon={
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="24px"
                                viewBox="0 -960 960 960"
                                width="24px"
                                fill="#fff"
                            >
                                <path d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z" />
                            </svg>
                        }
                        iconAtRight={true}
                        onClick={() => {
                            alert("Publish Post not implemented")
                        }}
                    ></Button>
                </div>
            </div>
        </div>
    );
}
