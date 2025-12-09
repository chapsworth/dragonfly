import Home from './pages/Home';
import Shop from './pages/Shop';
import Contact from './pages/Contact';
import Orders from './pages/Orders';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Shop": Shop,
    "Contact": Contact,
    "Orders": Orders,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};