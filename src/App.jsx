import { useState, useEffect } from "react";

import Login from "./pages/Login.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar.jsx";

import Sales from "./pages/Sales.jsx";
import Products from "./pages/Products.jsx";
import Inventory from "./pages/Inventory.jsx";
import Reports from "./pages/Reports.jsx";

const API_BASE = "http://127.0.0.1:8000/api";

export default function App() {
    const [user, setUser] = useState(null);
    const [checkingSession, setCheckingSession] = useState(true);
    const [activePage, setActivePage] = useState("Sales");

    useEffect(() => {
        fetch(`${API_BASE}/auth/me`, {
            credentials: "include",
        })
            .then((res) => (res.ok ? res.json() : null))
            .then(setUser)
            .catch(() => setUser(null))
            .finally(() => setCheckingSession(false));
    }, []);

    async function handleLogout() {
        try {
            await fetch(`${API_BASE}/auth/logout`, {
                method: "POST",
                credentials: "include",
            });
        } finally {
            setUser(null);
        }
    }

    if (checkingSession) {
        return null;
    }

    if (!user) {
        return <Login onLoginSuccess={setUser} />;
    }

    function renderPage() {
        switch (activePage) {
            case "Sales":
                return <Sales />;

            case "Products":
                return <Products />;

            case "Inventory":
                return <Inventory />;

            case "Reports":
                return <Reports />;

            default:
                return <Sales />;
        }
    }

    return (
        <div
            style={{
                display: "flex",
                height: "100vh",
                overflow: "hidden",
            }}
        >
            <Sidebar
                activePage={activePage}
                onNavigate={setActivePage}
                onLogout={handleLogout}
            />

            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                }}
            >
                <Topbar user={user} />

                <main
                    style={{
                        flex: 1,
                        overflow: "auto",
                        background: "#F7F8FA",
                    }}
                >
                    {renderPage()}
                </main>
            </div>
        </div>
    );
}