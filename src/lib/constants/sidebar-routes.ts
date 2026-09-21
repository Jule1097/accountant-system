import { LayoutDashboard, ShoppingCart, Store, LineChart, Scale, Users } from "lucide-react";

export const routePaths = {
    dashboard: "/dashboard",
    sales: "/sales",
    purchases: "/purchases",
    analytics: "/analytics",
    reconciliations: "/conciliations",
    clients: "/clients",
} as const;

export const routes = [
    {
        title: "Dashboard",
        url: routePaths.dashboard,
        icon: LayoutDashboard,
    },
    {
        title: "Ventas",
        url: routePaths.sales,
        icon: Store,
    },
    {
        title: "Compras",
        url: routePaths.purchases,
        icon: ShoppingCart,
    },
    {
        title: "Analíticas",
        url: routePaths.analytics,
        icon: LineChart,
    },
    {
        title: "Conciliaciones",
        url: routePaths.reconciliations,
        icon: Scale,
    },
    {
        title: "Clientes/Proveedores",
        url: routePaths.clients,
        icon: Users,
    },
];
