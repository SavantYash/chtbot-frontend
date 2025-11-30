import AdminDashboard from "../admin/AdminDashboard";
import AdminLogin from "../admin/AdminLogin";

export const protectedRoutes = [
    { path: "/admin", component: <AdminLogin /> },
    { path: "/admin/dashboard", component: <AdminDashboard /> }
]