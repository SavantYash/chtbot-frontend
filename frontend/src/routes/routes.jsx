import AdminDashboard from "../components/admincomp/AdminDashboard";
import AdminLogin from "../components/admincomp/AdminLogin";
import ChatWidget from "../components/user/ChatWidget";


export const protectedRoutes = [
    { path: "/", component: <ChatWidget /> },
    { path: "/admin", component: <AdminLogin /> },
    { path: "/admin/dashboard", component: <AdminDashboard /> }
]