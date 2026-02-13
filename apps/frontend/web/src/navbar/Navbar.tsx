import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { TransparentIconButton } from "../components/TransparentIconButton";
import { useScreenSizeState } from "../stores/ScreenSizeState";
import { useSideNavigationVisibility } from "../stores/SideNavigationVisibilityStore";
import { Dropdown } from "../components/Dropdown";
import { useEffect, useRef, useState } from "react";
import {
    autoUpdate,
    flip,
    offset,
    shift,
    useFloating,
} from "@floating-ui/react-dom";
import { useAuthenticationStore } from "../stores/AuthenticationStore";

function SignedOutButtons() {
    const navigate = useNavigate();

    return (
        <>
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
        </>
    );
}

function SignedInProfile() {
    const [dropdownVisible, setDropdownVisible] = useState<boolean>(false);

    const referenceRef = useRef<HTMLButtonElement>(null);

    const { refs, x, y, strategy } = useFloating({
        middleware: [offset(6), flip(), shift({ padding: 8 })],
        whileElementsMounted: autoUpdate,
    });

    useEffect(() => {
        if (referenceRef.current) {
            refs.setReference(referenceRef.current);
        }
    }, [refs]);

    const onOptionClicked = () => {
        setDropdownVisible(false);
        alert("Not implemented");
    };

    return (
        <div>
            <TransparentIconButton
                icon={
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="36px"
                        viewBox="0 -960 960 960"
                        width="36px"
                        fill="#1f1f1f"
                    >
                        <path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm146.5-204.5Q340-521 340-580t40.5-99.5Q421-720 480-720t99.5 40.5Q620-639 620-580t-40.5 99.5Q539-440 480-440t-99.5-40.5ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm100-95.5q47-15.5 86-44.5-39-29-86-44.5T480-280q-53 0-100 15.5T294-220q39 29 86 44.5T480-160q53 0 100-15.5ZM523-537q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Zm-43-43Zm0 360Z" />
                    </svg>
                }
                ref={referenceRef}
                onClick={() => {
                    setDropdownVisible(!dropdownVisible);
                }}
            ></TransparentIconButton>
            <Dropdown
                options={[
                    {
                        icon: (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="24px"
                                viewBox="0 -960 960 960"
                                width="24px"
                                fill="#1f1f1f"
                            >
                                <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
                            </svg>
                        ),
                        text: "Edit Profile",
                        onClick: onOptionClicked,
                    },
                    {
                        icon: (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="24px"
                                viewBox="0 -960 960 960"
                                width="24px"
                                fill="#1f1f1f"
                            >
                                <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z" />
                            </svg>
                        ),
                        text: "Logout",
                        onClick: onOptionClicked,
                    },
                ]}
                floatingRef={refs.setFloating}
                x={x}
                y={y}
                strategy={strategy}
                visible={dropdownVisible}
            ></Dropdown>
        </div>
    );
}

export function Navbar() {
    const screenSize = useScreenSizeState((state) => state.width);

    const onMenuBarClick = () => {
        const currentVisibility =
            useSideNavigationVisibility.getState().visible;

        useSideNavigationVisibility.setState({
            visible: !currentVisibility,
        });
    };

    const isLoggedIn = useAuthenticationStore((state) => state.isLoggedIn);

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
            {isLoggedIn ? (
                <SignedInProfile></SignedInProfile>
            ) : (
                <SignedOutButtons></SignedOutButtons>
            )}
        </div>
    );
}
