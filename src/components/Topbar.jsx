// src/components/Topbar.jsx

export default function Topbar({ user, onLogout }) {
    const initials = user?.username?.slice(0, 2).toUpperCase() || "??";

    return (
        <header style={styles.topbar}>
            <div />
            <div style={styles.right}>


                <div style={styles.avatar}>{initials}</div>

                <div style={styles.userInfo}>
                    <span style={styles.userName}>{user?.username}</span>
                </div>

            </div>
        </header>
    );
}



const styles = {
    topbar: {
        height: 64,
        background: "#FFFFFF",
        borderBottom: "1px solid #E5E7EB",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        boxSizing: "border-box",
    },
    right: {
        display: "flex",
        alignItems: "center",
        gap: 16,
    },
    iconButton: {
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 6,
    },
    avatar: {
        width: 34,
        height: 34,
        borderRadius: "50%",
        background: "#2563EB",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 600,
    },
    userInfo: {
        display: "flex",
        flexDirection: "column",
        lineHeight: 1.2,
    },
    userName: {
        fontSize: 13,
        fontWeight: 600,
        color: "#111827",
    },
    userRole: {
        fontSize: 12,
        color: "#6B7280",
    },
    logoutButton: {
        fontSize: 13,
        color: "#374151",
        background: "#F3F4F6",
        border: "1px solid #E5E7EB",
        borderRadius: 6,
        padding: "6px 12px",
        cursor: "pointer",
    },
};
