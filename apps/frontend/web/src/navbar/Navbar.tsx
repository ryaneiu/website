import { Button } from "../components/Button";



export function Navbar() {
    return <div className="gap-4 w-[100vw] h-16 bg-white border-b border-b-black/15 flex items-center px-2 py-2">
        <h1 className="font-bold text-2xl">Definitly Not Reddit Clone</h1>
        
        <input className="flex-grow-1 rounded-md border border-black/15 px-2 py-2" placeholder="Giant Search Bar... Search?"></input>

        <Button text="Login"></Button>
        <Button text="Sign up" isPrimary={true}></Button>
    </div>
}