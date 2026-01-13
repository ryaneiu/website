import { Button } from "../components/Button";
import { NavbarTab } from "./NavbarTab";



export function Navbar() {
    return <div className="gap-4 sticky top-0 left-0 w-[100vw] h-16 bg-white shadow-md border-b border-b-black/15 flex items-center px-2 py-2">
        <h1 className="font-bold text-2xl">Definitly Not Reddit Clone</h1>

        <NavbarTab text="Home"></NavbarTab>
        <NavbarTab text="Topics"></NavbarTab>
        <NavbarTab text="memes"></NavbarTab>
        <NavbarTab text="Videos"></NavbarTab>
        <NavbarTab text="AI slop"></NavbarTab>

        <div className="flex-grow-1"></div>

        <Button text="Login"></Button>
        <Button text="Sign up" isPrimary={true}></Button>
    </div>
}