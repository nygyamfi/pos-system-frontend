import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://127.0.0.1:8000/api";
const CURRENCY = "GH₵";

export default function Inventory() {
    const [products, setProducts] = useState([]);
    const [inventoryStats, setInventoryStats] = useState(null);

    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState("all");

    const [adjustModal, setAdjustModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [adjustment, setAdjustment] = useState("");

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // ============================================================
    // LOAD INVENTORY
    // ============================================================

    useEffect(() => {
        fetchInventory();

        // Keep inventory reasonably real-time.
        // Refresh every 5 seconds so sales made elsewhere
        // are reflected automatically.
        const interval = setInterval(() => {
            fetchInventory(true);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    async function fetchInventory(silent = false) {
        if (!silent) {
            setLoading(true);
        } else {
            setRefreshing(true);
        }

        try {
            const [productsRes, statsRes] = await Promise.all([
                fetch(`${API_BASE}/products`, {
                    credentials: "include",
                }),

                fetch(`${API_BASE}/reports/inventory`, {
                    credentials: "include",
                }),
            ]);

            if (!productsRes.ok) {
                throw new Error("Could not load products.");
            }

            if (!statsRes.ok) {
                throw new Error("Could not load inventory statistics.");
            }

            const productsData = await productsRes.json();
            const statsData = await statsRes.json();

            /*
             * /products returns:
             *
             * [
             *   {
             *      id,
             *      sku,
             *      name,
             *      price,
             *      stock_qty
             *   }
             * ]
             */
            setProducts(Array.isArray(productsData) ? productsData : []);

            /*
             * /reports/inventory returns:
             *
             * {
             *   total_products,
             *   total_units,
             *   inventory_value,
             *   low_stock_count,
             *   items
             * }
             */
            setInventoryStats(statsData || {});
        } catch (err) {
            console.error("Inventory error:", err);

            if (!silent) {
                setMessage(
                    err.message || "Could not load inventory."
                );
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    // ============================================================
    // STOCK STATUS
    // ============================================================

    function getStockStatus(stock) {
        const quantity = Number(stock || 0);

        if (quantity === 0) {
            return {
                label: "Out of stock",
                type: "out",
            };
        }

        if (quantity <= 5) {
            return {
                label: "Low stock",
                type: "low",
            };
        }

        return {
            label: "In stock",
            type: "good",
        };
    }

    // ============================================================
    // FILTER PRODUCTS
    // ============================================================

    const filteredProducts = useMemo(() => {
        const q = query.toLowerCase().trim();

        return products.filter((product) => {
            const name = String(product.name || "").toLowerCase();
            const sku = String(product.sku || "").toLowerCase();

            const matchesSearch =
                !q ||
                name.includes(q) ||
                sku.includes(q);

            const status = getStockStatus(
                Number(product.stock_qty || 0)
            );

            const matchesFilter =
                filter === "all" ||
                (filter === "in" && status.type === "good") ||
                (filter === "low" && status.type === "low") ||
                (filter === "out" && status.type === "out");

            return matchesSearch && matchesFilter;
        });
    }, [products, query, filter]);

    // ============================================================
    // STOCK ADJUSTMENT MODAL
    // ============================================================

    function openAdjustModal(product) {
        setSelectedProduct(product);
        setAdjustment("");
        setAdjustModal(true);
        setMessage("");
    }

    function closeAdjustModal() {
        setAdjustModal(false);
        setSelectedProduct(null);
        setAdjustment("");
    }

    // ============================================================
    // ADJUST STOCK
    // ============================================================

    async function adjustStock() {
        if (!selectedProduct) {
            return;
        }

        const delta = Number(adjustment);

        if (!Number.isInteger(delta) || delta === 0) {
            setMessage("Enter a valid stock adjustment.");
            return;
        }

        try {
            const res = await fetch(
                `${API_BASE}/products/${selectedProduct.id}/stock`,
                {
                    method: "PATCH",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        delta,
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(
                    data.detail ||
                    data.message ||
                    "Could not adjust stock."
                );
            }

            closeAdjustModal();

            setMessage(
                `${selectedProduct.name} stock updated successfully.`
            );

            // Immediately reload the latest stock values.
            await fetchInventory();
        } catch (err) {
            console.error("Stock adjustment error:", err);

            setMessage(
                err.message ||
                "Could not adjust stock."
            );
        }
    }

    // ============================================================
    // DERIVED INVENTORY VALUES
    // ============================================================

    /*
     * These fallbacks make the UI resilient even if an older
     * backend response is still being returned.
     */

    const totalProducts =
        Number(
            inventoryStats?.total_products ??
            products.length ??
            0
        );

    const totalUnits =
        Number(
            inventoryStats?.total_units ??
            products.reduce(
                (sum, product) =>
                    sum + Number(product.stock_qty || 0),
                0
            )
        );

    const lowStockCount =
        Number(
            inventoryStats?.low_stock_count ??
            products.filter(
                (product) =>
                    Number(product.stock_qty || 0) > 0 &&
                    Number(product.stock_qty || 0) <= 5
            ).length
        );

    const outOfStockCount =
        Number(
            inventoryStats?.out_of_stock_count ??
            products.filter(
                (product) =>
                    Number(product.stock_qty || 0) === 0
            ).length
        );

    const stockValue =
        Number(
            inventoryStats?.inventory_value ??
            products.reduce(
                (sum, product) =>
                    sum +
                    Number(product.price || 0) *
                    Number(product.stock_qty || 0),
                0
            )
        );

    // ============================================================
    // UI
    // ============================================================

    return (
        <div style={styles.page}>

            {/* HEADER */}
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>
                        Inventory
                    </h2>

                    <p style={styles.subtitle}>
                        Monitor and manage your product stock.
                    </p>
                </div>

                <button
                    style={{
                        ...styles.refreshButton,
                        opacity: refreshing ? 0.6 : 1,
                    }}
                    onClick={() => fetchInventory()}
                    disabled={refreshing}
                >
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {/* MESSAGE */}
            {message && (
                <div style={styles.message}>
                    <span>{message}</span>

                    <button
                        style={styles.dismissMessage}
                        onClick={() => setMessage("")}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* STATS */}
            <div style={styles.statsGrid}>

                {/* TOTAL PRODUCTS */}
                <div style={styles.statCard}>
                    <div style={styles.statLabel}>
                        Total Products
                    </div>

                    <div style={styles.statValue}>
                        {totalProducts}
                    </div>
                </div>

                {/* TOTAL UNITS */}
                <div style={styles.statCard}>
                    <div style={styles.statLabel}>
                        Total Units
                    </div>

                    <div style={styles.statValue}>
                        {totalUnits}
                    </div>
                </div>

                {/* LOW STOCK */}
                <div style={styles.statCard}>
                    <div style={styles.statLabel}>
                        Low Stock
                    </div>

                    <div
                        style={{
                            ...styles.statValue,
                            color: "#D97706",
                        }}
                    >
                        {lowStockCount}
                    </div>
                </div>

                {/* OUT OF STOCK */}
                <div style={styles.statCard}>
                    <div style={styles.statLabel}>
                        Out of Stock
                    </div>

                    <div
                        style={{
                            ...styles.statValue,
                            color: "#DC2626",
                        }}
                    >
                        {outOfStockCount}
                    </div>
                </div>

                {/* STOCK VALUE */}
                <div style={styles.statCard}>
                    <div style={styles.statLabel}>
                        Stock Value
                    </div>

                    <div style={styles.statValue}>
                        {CURRENCY}
                        {stockValue.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* INVENTORY TABLE */}
            <div style={styles.card}>

                <div style={styles.tableHeader}>

                    <div>
                        <h3 style={styles.cardTitle}>
                            Stock Overview
                        </h3>

                        <p style={styles.cardSubtitle}>
                            {filteredProducts.length} products
                        </p>
                    </div>

                    <div style={styles.controls}>

                        <input
                            style={styles.searchInput}
                            placeholder="Search name or SKU..."
                            value={query}
                            onChange={(e) =>
                                setQuery(e.target.value)
                            }
                        />

                        <select
                            style={styles.select}
                            value={filter}
                            onChange={(e) =>
                                setFilter(e.target.value)
                            }
                        >
                            <option value="all">
                                All stock
                            </option>

                            <option value="in">
                                In stock
                            </option>

                            <option value="low">
                                Low stock
                            </option>

                            <option value="out">
                                Out of stock
                            </option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <p style={styles.empty}>
                        Loading inventory...
                    </p>
                ) : filteredProducts.length === 0 ? (
                    <p style={styles.empty}>
                        No products found.
                    </p>
                ) : (
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>

                            <thead>
                            <tr>
                                <th style={styles.th}>
                                    Product
                                </th>

                                <th style={styles.th}>
                                    SKU
                                </th>

                                <th style={styles.th}>
                                    Price
                                </th>

                                <th style={styles.th}>
                                    Stock
                                </th>

                                <th style={styles.th}>
                                    Status
                                </th>

                                <th style={styles.th}>
                                    Action
                                </th>
                            </tr>
                            </thead>

                            <tbody>

                            {filteredProducts.map(
                                (product) => {

                                    const stock =
                                        Number(
                                            product.stock_qty || 0
                                        );

                                    const status =
                                        getStockStatus(stock);

                                    return (
                                        <tr
                                            key={product.id}
                                        >
                                            {/* PRODUCT */}
                                            <td style={styles.td}>
                                                <strong>
                                                    {product.name}
                                                </strong>
                                            </td>

                                            {/* SKU */}
                                            <td style={styles.td}>
                                                {product.sku}
                                            </td>

                                            {/* PRICE */}
                                            <td style={styles.td}>
                                                {CURRENCY}
                                                {Number(
                                                    product.price || 0
                                                ).toFixed(2)}
                                            </td>

                                            {/* STOCK */}
                                            <td style={styles.td}>
                                                <strong>
                                                    {stock}
                                                </strong>
                                            </td>

                                            {/* STATUS */}
                                            <td style={styles.td}>
                                                <span
                                                    style={{
                                                        ...styles.badge,

                                                        ...(status.type ===
                                                        "good"
                                                            ? styles.goodBadge
                                                            : status.type ===
                                                            "low"
                                                                ? styles.lowBadge
                                                                : styles.outBadge),
                                                    }}
                                                >
                                                    {status.label}
                                                </span>
                                            </td>

                                            {/* ACTION */}
                                            <td style={styles.td}>
                                                <button
                                                    style={
                                                        styles.adjustButton
                                                    }
                                                    onClick={() =>
                                                        openAdjustModal(
                                                            product
                                                        )
                                                    }
                                                >
                                                    Adjust stock
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                }
                            )}

                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* STOCK ADJUSTMENT MODAL */}
            {adjustModal &&
                selectedProduct && (
                    <div
                        style={styles.modalOverlay}
                        onClick={(e) => {
                            if (
                                e.target ===
                                e.currentTarget
                            ) {
                                closeAdjustModal();
                            }
                        }}
                    >
                        <div style={styles.modal}>

                            {/* MODAL HEADER */}
                            <div
                                style={
                                    styles.modalHeader
                                }
                            >
                                <div>
                                    <h3
                                        style={
                                            styles.modalTitle
                                        }
                                    >
                                        Adjust Stock
                                    </h3>

                                    <p
                                        style={
                                            styles.modalSubtitle
                                        }
                                    >
                                        {
                                            selectedProduct.name
                                        }
                                    </p>
                                </div>

                                <button
                                    style={
                                        styles.closeButton
                                    }
                                    onClick={
                                        closeAdjustModal
                                    }
                                >
                                    ✕
                                </button>
                            </div>

                            {/* CURRENT STOCK */}
                            <div
                                style={
                                    styles.currentStock
                                }
                            >
                                <span>
                                    Current stock
                                </span>

                                <strong>
                                    {Number(
                                        selectedProduct.stock_qty ||
                                        0
                                    )}
                                </strong>
                            </div>

                            {/* INPUT */}
                            <label
                                style={styles.label}
                            >
                                Adjustment
                            </label>

                            <input
                                type="number"
                                step="1"
                                style={
                                    styles.adjustInput
                                }
                                value={adjustment}
                                onChange={(e) =>
                                    setAdjustment(
                                        e.target.value
                                    )
                                }
                                placeholder="e.g. 20 or -5"
                                autoFocus
                            />

                            <p style={styles.hint}>
                                Use a positive number to
                                add stock and a negative
                                number to remove stock.
                            </p>

                            {/* ACTIONS */}
                            <div
                                style={
                                    styles.modalActions
                                }
                            >
                                <button
                                    style={
                                        styles.cancelButton
                                    }
                                    onClick={
                                        closeAdjustModal
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    style={
                                        styles.confirmButton
                                    }
                                    onClick={
                                        adjustStock
                                    }
                                >
                                    Update Stock
                                </button>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
}

// ============================================================
// STYLES
// ============================================================

const styles = {
    page: {
        padding: 24,
        fontFamily: "system-ui, sans-serif",
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },

    title: {
        margin: 0,
        fontSize: 22,
        fontWeight: 700,
        color: "#111827",
    },

    subtitle: {
        margin: "5px 0 0",
        fontSize: 13,
        color: "#6B7280",
    },

    refreshButton: {
        padding: "9px 14px",
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 8,
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
        color: "#374151",
    },

    message: {
        padding: "10px 12px",
        background: "#F3F4F6",
        borderRadius: 8,
        color: "#374151",
        fontSize: 13,
        marginBottom: 16,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },

    dismissMessage: {
        border: "none",
        background: "transparent",
        color: "#6B7280",
        cursor: "pointer",
        fontSize: 18,
        lineHeight: 1,
    },

    statsGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(5, minmax(0, 1fr))",
        gap: 14,
        marginBottom: 20,
    },

    statCard: {
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        padding: 18,
    },

    statLabel: {
        fontSize: 12,
        color: "#6B7280",
        marginBottom: 8,
    },

    statValue: {
        fontSize: 22,
        fontWeight: 700,
        color: "#111827",
    },

    card: {
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        padding: 20,
    },

    tableHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 18,
        gap: 20,
    },

    cardTitle: {
        margin: 0,
        fontSize: 15,
        fontWeight: 600,
        color: "#111827",
    },

    cardSubtitle: {
        margin: "4px 0 0",
        fontSize: 12,
        color: "#9CA3AF",
    },

    controls: {
        display: "flex",
        gap: 10,
    },

    searchInput: {
        width: 220,
        padding: "9px 12px",
        border: "1px solid #E5E7EB",
        borderRadius: 8,
        background: "#F9FAFB",
        fontSize: 13,
        outline: "none",
    },

    select: {
        padding: "9px 12px",
        border: "1px solid #E5E7EB",
        borderRadius: 8,
        background: "#FFFFFF",
        fontSize: 13,
        color: "#374151",
        outline: "none",
    },

    tableWrapper: {
        width: "100%",
        overflowX: "auto",
    },

    table: {
        width: "100%",
        borderCollapse: "collapse",
    },

    th: {
        textAlign: "left",
        fontSize: 12,
        color: "#6B7280",
        fontWeight: 600,
        padding: "0 8px 10px",
        borderBottom: "1px solid #E5E7EB",
    },

    td: {
        padding: "12px 8px",
        fontSize: 13,
        color: "#111827",
        borderBottom: "1px solid #F3F4F6",
    },

    badge: {
        display: "inline-block",
        padding: "4px 8px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
    },

    goodBadge: {
        background: "#ECFDF5",
        color: "#059669",
    },

    lowBadge: {
        background: "#FFFBEB",
        color: "#D97706",
    },

    outBadge: {
        background: "#FEF2F2",
        color: "#DC2626",
    },

    adjustButton: {
        border: "none",
        background: "transparent",
        color: "#2563EB",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
    },

    empty: {
        color: "#9CA3AF",
        fontSize: 13,
        padding: "20px 0",
    },

    modalOverlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
    },

    modal: {
        width: 420,
        maxWidth: "100%",
        background: "#FFFFFF",
        borderRadius: 14,
        padding: 24,
        boxShadow:
            "0 20px 50px rgba(0,0,0,0.2)",
        boxSizing: "border-box",
    },

    modalHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 20,
    },

    modalTitle: {
        margin: 0,
        fontSize: 18,
        fontWeight: 700,
        color: "#111827",
    },

    modalSubtitle: {
        margin: "5px 0 0",
        fontSize: 13,
        color: "#6B7280",
    },

    closeButton: {
        border: "none",
        background: "transparent",
        color: "#6B7280",
        cursor: "pointer",
        fontSize: 16,
    },

    currentStock: {
        display: "flex",
        justifyContent: "space-between",
        padding: 14,
        background: "#F9FAFB",
        borderRadius: 8,
        marginBottom: 18,
        fontSize: 13,
        color: "#374151",
    },

    label: {
        display: "block",
        fontSize: 13,
        fontWeight: 600,
        color: "#374151",
        marginBottom: 7,
    },

    adjustInput: {
        width: "100%",
        boxSizing: "border-box",
        padding: "12px",
        border: "1px solid #D1D5DB",
        borderRadius: 8,
        fontSize: 15,
        outline: "none",
    },

    hint: {
        fontSize: 11,
        color: "#9CA3AF",
        margin: "6px 0 20px",
        lineHeight: 1.5,
    },

    modalActions: {
        display: "flex",
        gap: 10,
    },

    cancelButton: {
        flex: 1,
        padding: "11px",
        background: "#FFFFFF",
        color: "#374151",
        border: "1px solid #D1D5DB",
        borderRadius: 8,
        fontWeight: 600,
        cursor: "pointer",
    },

    confirmButton: {
        flex: 1.5,
        padding: "11px",
        background: "#2563EB",
        color: "#FFFFFF",
        border: "none",
        borderRadius: 8,
        fontWeight: 600,
        cursor: "pointer",
    },
};