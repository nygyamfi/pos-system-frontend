// src/components/Sidebar.jsx

import {
    ShoppingCart,
    Package,
    Archive,
    BarChart3,
    LogOut,
} from "lucide-react";

const LOGO_SRC = "/logo.PNG";

const navItems = [
    {
        label: "Sales",
        icon: ShoppingCart,
    },
    {
        label: "Products",
        icon: Package,
    },
    {
        label: "Inventory",
        icon: Archive,
    },
    {
        label: "Reports",
        icon: BarChart3,
    },
];

export default function Sidebar({ activePage, onNavigate, onLogout }) {
    return (
        <aside style={styles.sidebar}>

            {/* BRAND */}
            <div style={styles.brand}>
                <div style={styles.logo}>
                    <img
                        src={LOGO_SRC}
                        alt="Logo"
                        style={styles.logoImg}
                    />
                </div>

                <span style={styles.brandName}>
                    Computech-One
                </span>
            </div>

            {/* NAVIGATION */}
            <nav style={styles.nav}>
                {navItems.map((item) => {
                    const active = item.label === activePage;

                    const Icon = item.icon;

                    return (
                        <button
                            key={item.label}
                            onClick={() => onNavigate(item.label)}
                            style={{
                                ...styles.navItem,
                                ...(active
                                    ? styles.navItemActive
                                    : {}),
                            }}
                        >
                            <Icon
                                size={18}
                                strokeWidth={2}
                            />

                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* LOGOUT */}
            <div style={styles.bottom}>
                <button
                    style={styles.logoutButton}
                    onClick={onLogout}
                    title="Sign out"
                >
                    <LogOut
                        size={18}
                        strokeWidth={2}
                    />

                    <span>Sign out</span>
                </button>
            </div>
        </aside>
    );
}

const styles = {
    sidebar: {
        width: 220,
        height: "100vh",
        background: "#FFFFFF",
        borderRight: "1px solid #E5E7EB",
        display: "flex",
        flexDirection: "column",
        padding: "20px 16px",
        boxSizing: "border-box",
    },

    brand: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 28,
        paddingLeft: 4,
    },

    logo: {
        width: 32,
        height: 32,
        background: "#2563EB",
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
    },

    logoImg: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },

    brandName: {
        fontSize: 15,
        fontWeight: 600,
        color: "#111827",
    },

    nav: {
        display: "flex",
        flexDirection: "column",
        gap: 4,
    },

    navItem: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        textAlign: "left",
        padding: "10px 12px",
        background: "transparent",
        border: "none",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 500,
        color: "#374151",
        cursor: "pointer",
    },

    navItemActive: {
        background: "#2563EB",
        color: "#FFFFFF",
    },

    bottom: {
        marginTop: "auto",
    },

    logoutButton: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        background: "transparent",
        color: "#DC2626",
        border: "none",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
        textAlign: "left",
    },
};