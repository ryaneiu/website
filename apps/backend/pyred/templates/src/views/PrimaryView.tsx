import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { MainArea } from "../MainArea";
import { Navbar } from "../navbar/Navbar";
import { SideNavigation } from "../navbar/sideNavigation";
import { getAppLanguageFromPath } from "../i18n";

export default function PrimaryView() {

    const navigate = useNavigate();
    const location = useLocation();
    const language = getAppLanguageFromPath(location.pathname);

    
    return (
        <div className="text-black dark:text-white transition-colors duration-300">
            <div className="w-[100vw] h-[100vh] fixed flex flex-col">
                <div>
                    <Navbar></Navbar>
                </div>

                <div className="flex-grow-1 flex h-full">
                    <SideNavigation></SideNavigation>
                    <MainArea></MainArea>
                </div>
            </div>

            <div className="fixed bottom-4 right-4">
                <Button
                    isPrimary={true}
                    text={language === "fr" ? "Publier" : "Post"}
                    icon={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                            className="text-white dark:text-black transition-colors duration-300"
                        >
                            <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                        </svg>
                    }
                    onClick={() => {
                        const language = location.pathname.startsWith("/fr") ? "fr" : "en";
                        navigate(`/create?lang=${language}`);
                    }}
                    additionalClasses="shadow-lg/20"
                ></Button>
            </div>
        </div>
    );
}
