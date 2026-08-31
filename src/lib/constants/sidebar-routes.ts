import { LayoutDashboard, ShoppingCart, Store, LineChart, Scale, Users } from "lucide-react";

export const routes = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Ventas",
        url: "/sales",
        icon: Store,
    },
    {
        title: "Compras",
        url: "/purchases",
        icon: ShoppingCart,
    },
    {
        title: "Analíticas",
        url: "/analytics",
        icon: LineChart,
    },
    {
        title: "Conciliaciones",
        url: "/conciliations",
        icon: Scale,
    },
    {
        title: "Clientes/Proveedores",
        url: "/clients",
        icon: Users,
    },
];