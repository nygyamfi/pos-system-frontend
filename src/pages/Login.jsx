import { useState } from "react";

const API_BASE = "http://127.0.0.1:8000/api";

export default function Login({ onLoginSuccess }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (!username.trim() || !password) {
            setError("Enter your username and password.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: "POST",
                credentials: "include", // send/receive the session cookie
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                setError("Invalid username or password.");
                return;
            }

            const user = await res.json();
            onLoginSuccess(user);
        } catch (err) {
            setError("Could not reach the server. Is the backend running?");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <div style={styles.logo}>
                    <CartIcon />
                </div>

                <h1 style={styles.title}>Sign in</h1>
                <p style={styles.subtitle}>Welcome back. Enter your credentials.</p>

                <form onSubmit={handleSubmit} noValidate>
                    <label style={styles.label} htmlFor="username">
                        Username
                    </label>
                    <input
                        id="username"
                        type="text"
                        autoComplete="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="admin"
                        style={styles.input}
                    />

                    <label style={styles.label} htmlFor="password">
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        style={styles.input}
                    />

                    <div style={styles.row}>
                        <label style={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            Remember me
                        </label>
                    </div>

                    {error && <p style={styles.error}>{error}</p>}

                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>
            </div>
        </div>
    );
}

function CartIcon() {
    return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F7F8FA",
        fontFamily: "system-ui, sans-serif",
    },
    card: {
        width: 380,
        textAlign: "center",
    },
    logo: {
        width: 56,
        height: 56,
        background: "#2563EB",
        borderRadius: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 20px",
    },
    title: {
        fontSize: 26,
        fontWeight: 600,
        margin: "0 0 6px",
        color: "#111827",
    },
    subtitle: {
        fontSize: 14,
        color: "#6B7280",
        margin: "0 0 28px",
    },
    label: {
        display: "block",
        textAlign: "left",
        fontSize: 13,
        fontWeight: 600,
        color: "#374151",
        margin: "0 0 6px",
    },
    input: {
        width: "100%",
        boxSizing: "border-box",
        padding: "11px 14px",
        marginBottom: 18,
        background: "#F3F4F6",
        border: "1px solid #E5E7EB",
        borderRadius: 8,
        fontSize: 14,
        outline: "none",
    },
    row: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    checkboxLabel: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
        color: "#374151",
    },
    error: {
        color: "#DC2626",
        fontSize: 13,
        margin: "0 0 14px",
        textAlign: "left",
    },
    button: {
        width: "100%",
        padding: "12px",
        background: "#2563EB",
        color: "white",
        border: "none",
        borderRadius: 8,
        fontSize: 15,
        fontWeight: 600,
        cursor: "pointer",
    },
};
