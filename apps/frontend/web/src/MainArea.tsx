import { Discover } from "./pages/discover/Discover";
import { ErrorPage } from "./pages/error/ErrorPage";
import { Home } from "./pages/home/Home";
import { Trending } from "./pages/trending/Trending";
import { DisplayedTab, displayedTabStore } from "./stores/DisplayedTabStore";

export function MainArea() {

    const selectedTabValue = displayedTabStore(state => state.displayedTab);

    let selectedTab = null;

    switch (selectedTabValue) {
        case DisplayedTab.Home:
            selectedTab = <Home></Home>
            break;
        case DisplayedTab.Discover:
            selectedTab = <Discover></Discover>
            break;
        case DisplayedTab.Trending:
            selectedTab = <Trending></Trending>
            break;
        default:
            console.error("Unknown page: ", selectedTabValue);
            selectedTab = <ErrorPage></ErrorPage>;
            break;
    }

    return <div className="flex-grow-1 h-full p-16">
        {selectedTab}
    </div>    
}