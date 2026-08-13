import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000/api";
const CURRENCY = "GH₵";

export default function Reports() {
    const [period, setPeriod] = useState("today");

    const [summary, setSummary] = useState({
        revenue: 0,
        transactions: 0,
        items_sold: 0,
        average_sale: 0,
        start_date: "",
        end_date: "",
    });

    const [sales, setSales] = useState([]);
    const [topProducts, setTopProducts] = useState([]);

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    useEffect(() => {
        loadReports();
    }, [period]);

    async function loadReports() {
        setLoading(true);
        setMessage("");

        try {
            const [summaryRes, salesRes, productsRes] =
                await Promise.all([
                    fetch(
                        `${API_BASE}/reports/summary?period=${period}`,
                        {
                            credentials: "include",
                        }
                    ),

                    fetch(
                        `${API_BASE}/reports/sales?period=${period}`,
                        {
                            credentials: "include",
                        }
                    ),

                    fetch(
                        `${API_BASE}/reports/top-products?period=${period}`,
                        {
                            credentials: "include",
                        }
                    ),
                ]);

            /*
             * We handle each response separately.
             * This makes the page much easier to debug if
             * one report endpoint has a problem.
             */

            let summaryData = {};
            let salesData = {};
            let productsData = {};

            if (summaryRes.ok) {
                summaryData = await summaryRes.json();
            }

            if (salesRes.ok) {
                salesData = await salesRes.json();
            }

            if (productsRes.ok) {
                productsData = await productsRes.json();
            }

            /*
             * If the top-products endpoint is temporarily
             * unavailable, don't destroy the entire Reports page.
             */
            if (!summaryRes.ok && !salesRes.ok) {
                throw new Error("Reports could not be loaded.");
            }

            setSummary({
                revenue: Number(summaryData?.revenue ?? 0),
                transactions: Number(
                    summaryData?.transactions ?? 0
                ),
                items_sold: Number(
                    summaryData?.items_sold ?? 0
                ),
                average_sale: Number(
                    summaryData?.average_sale ?? 0
                ),
                start_date:
                    summaryData?.start_date ?? "",
                end_date:
                    summaryData?.end_date ?? "",
            });

            /*
             * Make absolutely sure these are arrays.
             */
            setSales(
                Array.isArray(salesData?.sales)
                    ? salesData.sales
                    : []
            );

            setTopProducts(
                Array.isArray(productsData?.products)
                    ? productsData.products
                    : []
            );

            /*
             * If top-products is unavailable, show a small
             * message instead of breaking the entire page.
             */
            if (!productsRes.ok) {
                setMessage(
                    "Sales reports loaded, but top products are currently unavailable."
                );
            }
        } catch (error) {
            console.error("Reports error:", error);

            setMessage(
                "Could not load reports."
            );

            setSummary({
                revenue: 0,
                transactions: 0,
                items_sold: 0,
                average_sale: 0,
                start_date: "",
                end_date: "",
            });

            setSales([]);
            setTopProducts([]);
        } finally {
            setLoading(false);
        }
    }

    function formatMoney(value) {
        const number = Number(value);

        if (!Number.isFinite(number)) {
            return `${CURRENCY}0.00`;
        }

        return `${CURRENCY}${number.toFixed(2)}`;
    }

    function formatDate(value) {
        if (!value) {
            return "—";
        }

        /*
         * If backend already sends a formatted date,
         * don't try to parse it again.
         */
        if (
            typeof value === "string" &&
            value.includes("/")
        ) {
            return value;
        }

        if (
            typeof value === "string" &&
            value.includes("-")
        ) {
            const date = new Date(value);

            if (!Number.isNaN(date.getTime())) {
                return date.toLocaleDateString();
            }
        }

        return String(value);
    }

    function formatTime(value) {
        if (!value) {
            return "—";
        }

        return String(value);
    }

    function getSaleId(sale) {
        return (
            sale?.id ??
            sale?.sale_id ??
            "—"
        );
    }

    function getSaleDate(sale) {
        /*
         * Supports multiple possible backend names.
         */
        return (
            sale?.date ??
            sale?.created_date ??
            sale?.created_at ??
            ""
        );
    }

    function getSaleTime(sale) {
        return (
            sale?.time ??
            sale?.created_time ??
            ""
        );
    }

    function getSaleItems(sale) {
        return Number(
            sale?.items ??
            sale?.items_sold ??
            sale?.quantity ??
            0
        );
    }

    function getSaleTotal(sale) {
        return Number(
            sale?.total ??
            sale?.revenue ??
            0
        );
    }

    function getProductId(product) {
        return (
            product?.product_id ??
            product?.id ??
            product?.sku ??
            Math.random()
        );
    }

    function getProductName(product) {
        return (
            product?.name ??
            product?.product_name ??
            "Unknown product"
        );
    }

    function getProductSku(product) {
        return (
            product?.sku ??
            "—"
        );
    }

    function getProductQuantity(product) {
        return Number(
            product?.quantity ??
            product?.qty ??
            0
        );
    }

    function getProductRevenue(product) {
        return Number(
            product?.revenue ??
            product?.total ??
            0
        );
    }

    function periodLabel() {
        if (period === "today") {
            return "Today";
        }

        if (period === "7days") {
            return "Last 7 days";
        }

        if (period === "30days") {
            return "Last 30 days";
        }

        return "";
    }

    return (
        <div style={styles.page}>

            {/* =========================
                HEADER
            ========================= */}

            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>
                        Reports
                    </h2>

                    <p style={styles.subtitle}>
                        Sales and business performance overview.
                    </p>
                </div>

                <div style={styles.headerActions}>

                    <select
                        value={period}
                        onChange={(e) =>
                            setPeriod(e.target.value)
                        }
                        style={styles.periodSelect}
                    >
                        <option value="today">
                            Today
                        </option>

                        <option value="7days">
                            Last 7 days
                        </option>

                        <option value="30days">
                            Last 30 days
                        </option>
                    </select>

                    <button
                        style={styles.refreshButton}
                        onClick={loadReports}
                        disabled={loading}
                    >
                        {loading
                            ? "Loading..."
                            : "Refresh"}
                    </button>

                </div>
            </div>

            {/* =========================
                MESSAGE
            ========================= */}

            {message && (
                <div style={styles.message}>
                    {message}
                </div>
            )}

            {/* =========================
                DATE RANGE
            ========================= */}

            {!loading &&
                (summary.start_date ||
                    summary.end_date) && (
                    <div style={styles.dateRange}>
                        Showing{" "}
                        <strong>
                            {periodLabel()}
                        </strong>

                        {summary.start_date && (
                            <>
                                {" "}
                                ({formatDate(
                                summary.start_date
                            )}

                                {summary.end_date &&
                                    ` — ${formatDate(
                                        summary.end_date
                                    )}`}

                                )
                            </>
                        )}
                    </div>
                )}

            {/* =========================
                MAIN SUMMARY
            ========================= */}

            <div style={styles.statsGrid}>

                <div style={styles.statCard}>
                    <div style={styles.statLabel}>
                        Revenue
                    </div>

                    <div style={styles.statValue}>
                        {formatMoney(
                            summary.revenue
                        )}
                    </div>
                </div>

                <div style={styles.statCard}>
                    <div style={styles.statLabel}>
                        Transactions
                    </div>

                    <div style={styles.statValue}>
                        {summary.transactions}
                    </div>
                </div>

                <div style={styles.statCard}>
                    <div style={styles.statLabel}>
                        Items Sold
                    </div>

                    <div style={styles.statValue}>
                        {summary.items_sold}
                    </div>
                </div>

                <div style={styles.statCard}>
                    <div style={styles.statLabel}>
                        Average Sale
                    </div>

                    <div style={styles.statValue}>
                        {formatMoney(
                            summary.average_sale
                        )}
                    </div>
                </div>

            </div>

            {/* =========================
                SALES / REVENUE SUMMARY
                NO DISCOUNT
            ========================= */}

            <div style={styles.secondaryGrid}>

                <div style={styles.secondaryCard}>
                    <span>
                        Total Revenue
                    </span>

                    <strong style={styles.secondaryValue}>
                        {formatMoney(
                            summary.revenue
                        )}
                    </strong>
                </div>

                <div style={styles.secondaryCard}>
                    <span>
                        Transactions
                    </span>

                    <strong style={styles.secondaryValue}>
                        {summary.transactions}
                    </strong>
                </div>

                <div style={styles.secondaryCard}>
                    <span>
                        Items Sold
                    </span>

                    <strong style={styles.secondaryValue}>
                        {summary.items_sold}
                    </strong>
                </div>

            </div>

            {/* =========================
                MAIN CONTENT
            ========================= */}

            <div style={styles.columns}>

                {/* =========================
                    SALES HISTORY
                ========================= */}

                <div style={styles.card}>

                    <div style={styles.cardHeader}>
                        <div>
                            <h3 style={styles.cardTitle}>
                                Sales History
                            </h3>

                            <p style={styles.cardSubtitle}>
                                Transactions for{" "}
                                {periodLabel().toLowerCase()}.
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <p style={styles.empty}>
                            Loading sales...
                        </p>
                    ) : sales.length === 0 ? (
                        <p style={styles.empty}>
                            No sales found for this period.
                        </p>
                    ) : (
                        <div style={styles.tableWrapper}>
                            <table style={styles.table}>

                                <thead>
                                <tr>

                                    <th style={styles.th}>
                                        Sale
                                    </th>

                                    <th style={styles.th}>
                                        Date
                                    </th>

                                    <th style={styles.th}>
                                        Items
                                    </th>

                                    <th style={styles.th}>
                                        Total
                                    </th>

                                </tr>
                                </thead>

                                <tbody>

                                {sales.map(
                                    (sale, index) => {

                                        const saleId =
                                            getSaleId(
                                                sale
                                            );

                                        const saleDate =
                                            getSaleDate(
                                                sale
                                            );

                                        const saleTime =
                                            getSaleTime(
                                                sale
                                            );

                                        const saleItems =
                                            getSaleItems(
                                                sale
                                            );

                                        const saleTotal =
                                            getSaleTotal(
                                                sale
                                            );

                                        return (
                                            <tr
                                                key={`${saleId}-${index}`}
                                            >

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    <strong>
                                                        #
                                                        {
                                                            saleId
                                                        }
                                                    </strong>
                                                </td>

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    <div>
                                                        {formatDate(
                                                            saleDate
                                                        )}
                                                    </div>

                                                    {saleTime && (
                                                        <span
                                                            style={
                                                                styles.time
                                                            }
                                                        >
                                                            {formatTime(
                                                                saleTime
                                                            )}
                                                        </span>
                                                    )}
                                                </td>

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    {saleItems}
                                                </td>

                                                <td
                                                    style={{
                                                        ...styles.td,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {formatMoney(
                                                        saleTotal
                                                    )}
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

                {/* =========================
                    TOP PRODUCTS
                ========================= */}

                <div
                    style={{
                        ...styles.card,
                        width: 360,
                        flex: "0 0 360px",
                    }}
                >

                    <div style={styles.cardHeader}>

                        <div>
                            <h3 style={styles.cardTitle}>
                                Top Products
                            </h3>

                            <p style={styles.cardSubtitle}>
                                Best-selling products.
                            </p>
                        </div>

                    </div>

                    {loading ? (
                        <p style={styles.empty}>
                            Loading products...
                        </p>
                    ) : topProducts.length === 0 ? (
                        <p style={styles.empty}>
                            No product sales found.
                        </p>
                    ) : (
                        <div>

                            {topProducts
                                .slice(0, 8)
                                .map(
                                    (
                                        product,
                                        index
                                    ) => {

                                        const id =
                                            getProductId(
                                                product
                                            );

                                        const name =
                                            getProductName(
                                                product
                                            );

                                        const sku =
                                            getProductSku(
                                                product
                                            );

                                        const quantity =
                                            getProductQuantity(
                                                product
                                            );

                                        const revenue =
                                            getProductRevenue(
                                                product
                                            );

                                        return (
                                            <div
                                                key={`${id}-${index}`}
                                                style={
                                                    styles.productRow
                                                }
                                            >

                                                <div
                                                    style={
                                                        styles.rank
                                                    }
                                                >
                                                    {index +
                                                        1}
                                                </div>

                                                <div
                                                    style={
                                                        styles.productInfo
                                                    }
                                                >

                                                    <div
                                                        style={
                                                            styles.productName
                                                        }
                                                    >
                                                        {name}
                                                    </div>

                                                    <div
                                                        style={
                                                            styles.productSku
                                                        }
                                                    >
                                                        {sku}
                                                    </div>

                                                </div>

                                                <div
                                                    style={
                                                        styles.productStats
                                                    }
                                                >

                                                    <strong>
                                                        {
                                                            quantity
                                                        }{" "}
                                                        sold
                                                    </strong>

                                                    <span>
                                                        {formatMoney(
                                                            revenue
                                                        )}
                                                    </span>

                                                </div>

                                            </div>
                                        );
                                    }
                                )}

                        </div>
                    )}

                </div>

            </div>

        </div>
    );
}

const styles = {
    page: {
        padding: 24,
        fontFamily: "system-ui, sans-serif",
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 18,
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

    headerActions: {
        display: "flex",
        gap: 10,
        alignItems: "center",
    },

    periodSelect: {
        padding: "9px 12px",
        border: "1px solid #E5E7EB",
        borderRadius: 8,
        background: "#FFFFFF",
        fontSize: 13,
        color: "#374151",
        outline: "none",
        cursor: "pointer",
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
    },

    dateRange: {
        fontSize: 12,
        color: "#6B7280",
        marginBottom: 14,
    },

    statsGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
        gap: 14,
        marginBottom: 14,
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

    secondaryGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
        gap: 14,
        marginBottom: 20,
    },

    secondaryCard: {
        background: "#F9FAFB",
        border: "1px solid #E5E7EB",
        borderRadius: 10,
        padding: "13px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 13,
        color: "#6B7280",
    },

    secondaryValue: {
        color: "#111827",
        fontSize: 14,
    },

    columns: {
        display: "flex",
        gap: 20,
        alignItems: "flex-start",
    },

    card: {
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        padding: 20,
        flex: 1,
        minWidth: 0,
    },

    cardHeader: {
        marginBottom: 16,
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
        whiteSpace: "nowrap",
    },

    td: {
        padding: "11px 8px",
        fontSize: 13,
        color: "#111827",
        borderBottom: "1px solid #F3F4F6",
        verticalAlign: "middle",
    },

    time: {
        display: "block",
        fontSize: 11,
        color: "#9CA3AF",
        marginTop: 3,
    },

    empty: {
        fontSize: 13,
        color: "#9CA3AF",
        padding: "20px 0",
        margin: 0,
    },

    productRow: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
        borderBottom: "1px solid #F3F4F6",
    },

    rank: {
        width: 26,
        height: 26,
        borderRadius: 7,
        background: "#F3F4F6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 700,
        color: "#374151",
        flexShrink: 0,
    },

    productInfo: {
        flex: 1,
        minWidth: 0,
    },

    productName: {
        fontSize: 13,
        fontWeight: 600,
        color: "#111827",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },

    productSku: {
        fontSize: 11,
        color: "#9CA3AF",
        marginTop: 3,
    },

    productStats: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 3,
        fontSize: 12,
        flexShrink: 0,
    },

    productStatsSpan: {
        color: "#6B7280",
    },
};