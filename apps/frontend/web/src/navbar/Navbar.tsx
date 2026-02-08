import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { TransparentIconButton } from "../components/TransparentIconButton";
import { useScreenSizeState } from "../stores/ScreenSizeState";
import { useSideNavigationVisibility } from "../stores/SideNavigationVisibilityStore";

export function Navbar() {
    const navigate = useNavigate();

    const screenSize = useScreenSizeState(state => state.width);

    const onMenuBarClick = () => {
        const currentVisibility = useSideNavigationVisibility.getState().visible;
        
        useSideNavigationVisibility.setState({
            visible: !currentVisibility
        });
    }

    return (
        <div className="gap-4 w-[100vw] h-16 bg-white border-b border-b-black/15 flex items-center px-2 py-2">
            {screenSize < 640 && (
                <TransparentIconButton
                    icon={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="#1f1f1f"
                        >
                            <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z" />
                        </svg>
                    }
                    square={true}
                    onClick={onMenuBarClick}
                    larger={true}
                ></TransparentIconButton>
            )}
            <h1 className="font-bold text-2xl md:block hidden">
                React-2-Pytailred
            </h1>

            <input
                className="flex-grow-1 rounded-md border border-black/15 px-2 py-2"
                placeholder="Giant Search Bar... Search?"
            ></input>

            <Button
                text="Login"
                onClick={() => {
                    navigate("/auth?action=login");
                }}
            ></Button>
            <span className="md:block hidden">
                <Button
                    text="Sign up"
                    isPrimary={true}
                    onClick={() => {
                        navigate("/auth?action=signup");
                    }}
                ></Button>
            </span>
        </div>
    );
}
