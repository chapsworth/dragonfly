import AdminCarousel from './pages/AdminCarousel';
import AdminCategories from './pages/AdminCategories';
import AdminDashboard from './pages/AdminDashboard';
import AdminInventory from './pages/AdminInventory';
import AdminLauncher from './pages/AdminLauncher';
import AdminOrders from './pages/AdminOrders';
import AdminProducts from './pages/AdminProducts';
import AdminSettings from './pages/AdminSettings';
import AdminUsers from './pages/AdminUsers';
import CRM from './pages/CRM';
import CRMBookmarks from './pages/CRMBookmarks';
import CRMCalendar from './pages/CRMCalendar';
import CRMContacts from './pages/CRMContacts';
import CRMDeals from './pages/CRMDeals';
import CRMDocuments from './pages/CRMDocuments';
import CRMTasks from './pages/CRMTasks';
import CRMTextTemplates from './pages/CRMTextTemplates';
import CRMVendors from './pages/CRMVendors';
import ComponentLibrary from './pages/ComponentLibrary';
import Contact from './pages/Contact';
import DeliveryNavigation from './pages/DeliveryNavigation';
import GlassPortal from './pages/GlassPortal';
import Home from './pages/Home';
import OrderTracking from './pages/OrderTracking';
import Orders from './pages/Orders';
import ProductDetail from './pages/ProductDetail';
import ProductLibrary from './pages/ProductLibrary';
import Profile from './pages/Profile';
import Rewards from './pages/Rewards';
import Shop from './pages/Shop';
import StrainLibrary from './pages/StrainLibrary';
import Favorites from './pages/Favorites';
import Analytics from './pages/Analytics';
import Automations from './pages/Automations';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminCarousel": AdminCarousel,
    "AdminCategories": AdminCategories,
    "AdminDashboard": AdminDashboard,
    "AdminInventory": AdminInventory,
    "AdminLauncher": AdminLauncher,
    "AdminOrders": AdminOrders,
    "AdminProducts": AdminProducts,
    "AdminSettings": AdminSettings,
    "AdminUsers": AdminUsers,
    "CRM": CRM,
    "CRMBookmarks": CRMBookmarks,
    "CRMCalendar": CRMCalendar,
    "CRMContacts": CRMContacts,
    "CRMDeals": CRMDeals,
    "CRMDocuments": CRMDocuments,
    "CRMTasks": CRMTasks,
    "CRMTextTemplates": CRMTextTemplates,
    "CRMVendors": CRMVendors,
    "ComponentLibrary": ComponentLibrary,
    "Contact": Contact,
    "DeliveryNavigation": DeliveryNavigation,
    "GlassPortal": GlassPortal,
    "Home": Home,
    "OrderTracking": OrderTracking,
    "Orders": Orders,
    "ProductDetail": ProductDetail,
    "ProductLibrary": ProductLibrary,
    "Profile": Profile,
    "Rewards": Rewards,
    "Shop": Shop,
    "StrainLibrary": StrainLibrary,
    "Favorites": Favorites,
    "Analytics": Analytics,
    "Automations": Automations,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};