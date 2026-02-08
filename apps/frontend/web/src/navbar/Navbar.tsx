import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";



export function Navbar() {

    const navigate = useNavigate();

    return <div className="gap-4 w-[100vw] h-16 bg-white border-b border-b-black/15 flex items-center px-2 py-2">
        <h1 className="font-bold text-2xl md:block hidden">React-2-Pytailred</h1>
        
        <input className="flex-grow-1 rounded-md border border-black/15 px-2 py-2" placeholder="Giant Search Bar... Search?"></input>


    
        <Button text="Login" onClick={() => {
            navigate("/auth?action=login");
        }}></Button>
        <span className="md:block hidden">
        <Button text="Sign up" isPrimary={true} onClick={() => {
            navigate("/auth?action=signup")
        }}></Button>
        </span>

    </div>
}