import { Navbar } from "./navbar/Navbar"
import { NavbarTab } from "./navbar/NavbarTab"
import { SideNavigation } from "./navbar/sideNavigation"


function App() {

  return <div className="w-[100vw] h-[100vh] fixed flex flex-col">
    <div>
        <Navbar>

        </Navbar>
    </div>

    <div className="flex-grow-1">
        <SideNavigation></SideNavigation>
    </div>
    
  </div>
}

export default App
