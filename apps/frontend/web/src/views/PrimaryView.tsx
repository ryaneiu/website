import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { MainArea } from "../MainArea";
import { Navbar } from "../navbar/Navbar";
import { SideNavigation } from "../navbar/sideNavigation";

export function PrimaryView() {

    const navigate = useNavigate();

    
    return (
        <div>
            <div className="w-[100vw] h-[100vh] fixed flex flex-col">
                <div>
                    <Navbar></Navbar>
                </div>

                <div className="flex-grow-1 flex">
                    <SideNavigation></SideNavigation>
                    <MainArea></MainArea>
                </div>
            </div>

            <div className="fixed bottom-4 right-4">
                <Button
                    isPrimary={true}
                    text="Post"
                    icon={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="#fff"
                        >
                            <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                        </svg>
                    }
                    onClick={() => {
                        navigate("/create");
                    }}
                    additionalClasses="shadow-lg/20"
                ></Button>
            </div>
        </div>
    );
}
