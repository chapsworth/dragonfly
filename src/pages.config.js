import Home from './pages/Home';
import Shop from './pages/Shop';
import Contact from './pages/Contact';
import Orders from './pages/Orders';
import Rewards from './pages/Rewards';
import ProductDetail from './pages/ProductDetail';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';
import AdminUsers from './pages/AdminUsers';
import AdminCarousel from './pages/AdminCarousel';
import AdminCategories from './pages/AdminCategories';
import ComponentLibrary from './pages/ComponentLibrary';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Shop": Shop,
    "Contact": Contact,
    "Orders": Orders,
    "Rewards": Rewards,
    "ProductDetail": ProductDetail,
    "AdminDashboard": AdminDashboard,
    "AdminProducts": AdminProducts,
    "AdminOrders": AdminOrders,
    "AdminUsers": AdminUsers,
    "AdminCarousel": AdminCarousel,
    "AdminCategories": AdminCategories,
    "ComponentLibrary": ComponentLibrary,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};