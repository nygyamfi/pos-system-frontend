import { useState, useEffect, useMemo } from "react";

const API_BASE = "http://127.0.0.1:8000/api";
const CURRENCY = "GH₵";

export default function Sales() {
    const [products, setProducts] = useState([]);
    const [query, setQuery] = useState("");
    const [cart, setCart] = useState({});

    const [customerName, setCustomerName] = useState("");

    const [discount, setDiscount] = useState(0);
    const [discountInput, setDiscountInput] = useState("");
    const [discountModal, setDiscountModal] = useState(false);

    const [message, setMessage] = useState("");
    const [paying, setPaying] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    function fetchProducts() {
        fetch(`${API_BASE}/products`, {
            credentials: "include",
        })
            .then((r) => r.json())
            .then(setProducts)
            .catch(() => setMessage("Could not load products."));
    }

    const matches = useMemo(() => {
        if (!query.trim()) return [];

        const q = query.toLowerCase();

        return products
            .filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.sku.toLowerCase().includes(q)
            )
            .slice(0, 6);
    }, [query, products]);

    function addToCart(product) {
        const currentQty = cart[product.id] || 0;

        if (currentQty >= product.stock_qty) {
            setMessage(`Only ${product.stock_qty} ${product.name} available.`);
            return;
        }

        setCart((prev) => ({
            ...prev,
            [product.id]: (prev[product.id] || 0) + 1,
        }));

        setQuery("");
        setMessage("");
    }

    function changeQty(productId, delta) {
        setCart((prev) => {
            const next = { ...prev };

            const product = products.find((p) => p.id === productId);
            const newQty = (next[productId] || 0) + delta;

            if (newQty <= 0) {
                delete next[productId];
            } else if (product && newQty <= product.stock_qty) {
                next[productId] = newQty;
            }

            return next;
        });
    }

    function removeLine(productId) {
        setCart((prev) => {
            const next = { ...prev };
            delete next[productId];
            return next;
        });
    }

    function cancelTransaction() {
        setCart({});
        setDiscount(0);
        setDiscountInput("");
        setCustomerName("");
        setMessage("");
    }

    const lines = Object.entries(cart)
        .map(([productId, qty]) => {
            const product = products.find(
                (p) => p.id === Number(productId)
            );

            return product ? { product, qty } : null;
        })
        .filter(Boolean);

    const subtotal = lines.reduce(
        (sum, l) => sum + Number(l.product.price) * l.qty,
        0
    );

    const discountAmount = Math.min(
        Math.max(Number(discount) || 0, 0),
        subtotal
    );

    const total = Math.max(subtotal - discountAmount, 0);

    function requestDiscount() {
        setDiscountInput(discount > 0 ? discount.toString() : "");
        setDiscountModal(true);
    }

    function handleDiscountChange(e) {
        const value = e.target.value;

        if (value === "") {
            setDiscountInput("");
            return;
        }

        const numericValue = parseFloat(value);

        if (isNaN(numericValue)) {
            return;
        }

        if (numericValue > subtotal) {
            setDiscountInput(subtotal.toFixed(2));
        } else if (numericValue < 0) {
            setDiscountInput("0");
        } else {
            setDiscountInput(value);
        }
    }

    function applyDiscount() {
        const value = Math.min(
            Math.max(parseFloat(discountInput) || 0, 0),
            subtotal
        );

        setDiscount(value);
        setDiscountInput(value.toString());
        setDiscountModal(false);
    }

    function clearDiscount() {
        setDiscount(0);
        setDiscountInput("");
        setDiscountModal(false);
    }

    const previewDiscount = Math.min(
        Math.max(parseFloat(discountInput) || 0, 0),
        subtotal
    );

    const previewTotal = Math.max(subtotal - previewDiscount, 0);

    async function printReceipt() {
        if (lines.length === 0) return;

        setPaying(true);
        setMessage("Printing...");

        try {
            const res = await fetch(`${API_BASE}/sales`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    customer_name:
                        customerName.trim() || "Walk-in Customer",

                    lines: lines.map((l) => ({
                        product_id: l.product.id,
                        quantity: l.qty,
                    })),

                    print_receipt: true,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(`Error: ${data.detail || "Sale failed"}`);
                return;
            }

            setMessage(
                data.print_error
                    ? `Sale #${data.sale_id} saved. Printing failed: ${data.print_error}`
                    : `Sale #${data.sale_id} complete — receipt sent to printer.`
            );

            cancelTransaction();
            fetchProducts();
        } catch {
            setMessage("Printing failed — is the backend running?");
        } finally {
            setPaying(false);
        }
    }

    return (
        <div style={styles.page}>

            {/* SEARCH */}
            <div style={styles.searchWrap}>
                <input
                    style={styles.searchInput}
                    placeholder="Search products by name or SKU..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />

                {matches.length > 0 && (
                    <div style={styles.dropdown}>
                        {matches.map((p) => (
                            <div
                                key={p.id}
                                style={{
                                    ...styles.dropdownItem,
                                    opacity:
                                        p.stock_qty <= 0 ? 0.5 : 1,
                                    cursor:
                                        p.stock_qty <= 0
                                            ? "not-allowed"
                                            : "pointer",
                                }}
                                onClick={() => {
                                    if (p.stock_qty > 0) {
                                        addToCart(p);
                                    }
                                }}
                            >
                                <div style={styles.dropdownInfo}>
                                    <div style={styles.dropdownName}>
                                        {p.name}
                                    </div>

                                    <div style={styles.dropdownMeta}>
                                        {p.sku} · {CURRENCY}
                                        {Number(p.price).toFixed(2)} · stock{" "}
                                        {p.stock_qty}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MESSAGE */}
            {message && (
                <p style={styles.message}>
                    {message}
                </p>
            )}

            {/* MAIN */}
            <div style={styles.columns}>

                {/* ITEMS */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>
                        Scanned Items
                    </h3>

                    {lines.length === 0 ? (
                        <p style={styles.empty}>
                            No items yet — search above to add products.
                        </p>
                    ) : (
                        <table style={styles.table}>
                            <thead>
                            <tr>
                                <th style={styles.th}>Item</th>
                                <th style={styles.th}>Quantity</th>
                                <th style={styles.th}>Price</th>
                                <th style={styles.th}>Total</th>
                                <th style={styles.th}></th>
                            </tr>
                            </thead>

                            <tbody>
                            {lines.map((l) => (
                                <tr key={l.product.id}>
                                    <td style={styles.td}>
                                        <div>
                                            <div style={styles.itemName}>
                                                {l.product.name}
                                            </div>

                                            <div style={styles.itemSku}>
                                                {l.product.sku}
                                            </div>
                                        </div>
                                    </td>

                                    <td style={styles.td}>
                                        <div style={styles.qtyControls}>
                                            <button
                                                style={styles.qtyBtn}
                                                onClick={() =>
                                                    changeQty(
                                                        l.product.id,
                                                        -1
                                                    )
                                                }
                                            >
                                                −
                                            </button>

                                            <span>{l.qty}</span>

                                            <button
                                                style={styles.qtyBtn}
                                                onClick={() =>
                                                    changeQty(
                                                        l.product.id,
                                                        1
                                                    )
                                                }
                                            >
                                                +
                                            </button>
                                        </div>
                                    </td>

                                    <td style={styles.td}>
                                        {CURRENCY}
                                        {Number(
                                            l.product.price
                                        ).toFixed(2)}
                                    </td>

                                    <td style={styles.td}>
                                        {CURRENCY}
                                        {(
                                            Number(
                                                l.product.price
                                            ) * l.qty
                                        ).toFixed(2)}
                                    </td>

                                    <td style={styles.td}>
                                        <button
                                            style={styles.deleteBtn}
                                            onClick={() =>
                                                removeLine(
                                                    l.product.id
                                                )
                                            }
                                        >
                                            ✕
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* SUMMARY */}
                <div
                    style={{
                        ...styles.card,
                        width: 300,
                    }}
                >
                    <h3 style={styles.cardTitle}>
                        Invoice Summary
                    </h3>

                    {/* CUSTOMER */}
                    <label style={styles.customerLabel}>
                        Customer Name
                    </label>

                    <input
                        style={styles.customerInput}
                        type="text"
                        placeholder="Walk-in Customer"
                        value={customerName}
                        onChange={(e) =>
                            setCustomerName(e.target.value)
                        }
                    />

                    <div style={styles.summaryRow}>
                        <span>Subtotal:</span>

                        <span>
                            {CURRENCY}
                            {subtotal.toFixed(2)}
                        </span>
                    </div>

                    <div
                        style={{
                            ...styles.summaryRow,
                            color: "#059669",
                        }}
                    >
                        <span>Discount:</span>

                        <span>
                            -{CURRENCY}
                            {discountAmount.toFixed(2)}
                        </span>
                    </div>

                    <hr style={styles.hr} />

                    <div style={styles.totalRow}>
                        <span>Total:</span>

                        <span>
                            {CURRENCY}
                            {total.toFixed(2)}
                        </span>
                    </div>

                    <button
                        style={styles.payButton}
                        onClick={printReceipt}
                        disabled={lines.length === 0 || paying}
                    >
                        {paying ? "Printing..." : "Print"}
                    </button>

                    <button
                        style={styles.secondaryButton}
                        onClick={requestDiscount}
                        disabled={lines.length === 0}
                    >
                        Add Discount
                    </button>

                    <button
                        style={styles.secondaryButton}
                        onClick={cancelTransaction}
                    >
                        Cancel Transaction
                    </button>
                </div>
            </div>

            {/* DISCOUNT MODAL */}
            {discountModal && (
                <div
                    style={styles.modalOverlay}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setDiscountModal(false);
                        }
                    }}
                >
                    <div style={styles.modal}>

                        <div style={styles.modalHeader}>
                            <div>
                                <h3 style={styles.modalTitle}>
                                    Add Discount
                                </h3>

                                <p style={styles.modalSubtitle}>
                                    Enter the discount amount below.
                                </p>
                            </div>

                            <button
                                style={styles.closeButton}
                                onClick={() =>
                                    setDiscountModal(false)
                                }
                            >
                                ✕
                            </button>
                        </div>

                        <div style={styles.modalInputGroup}>
                            <label style={styles.modalLabel}>
                                Discount Amount
                            </label>

                            <div style={styles.inputWrapper}>
                                <span style={styles.currency}>
                                    {CURRENCY}
                                </span>

                                <input
                                    type="number"
                                    min="0"
                                    max={subtotal}
                                    step="0.01"
                                    value={discountInput}
                                    onChange={handleDiscountChange}
                                    placeholder="0.00"
                                    style={styles.modalInput}
                                    autoFocus
                                />
                            </div>

                            <p style={styles.inputHint}>
                                Maximum discount: {CURRENCY}
                                {subtotal.toFixed(2)}
                            </p>
                        </div>

                        <div style={styles.discountPreview}>
                            <div style={styles.previewRow}>
                                <span>Subtotal</span>

                                <span>
                                    {CURRENCY}
                                    {subtotal.toFixed(2)}
                                </span>
                            </div>

                            <div
                                style={{
                                    ...styles.previewRow,
                                    color: "#059669",
                                }}
                            >
                                <span>Discount</span>

                                <span>
                                    -{CURRENCY}
                                    {previewDiscount.toFixed(2)}
                                </span>
                            </div>

                            <hr style={styles.hr} />

                            <div style={styles.previewTotal}>
                                <span>New Total</span>

                                <span>
                                    {CURRENCY}
                                    {previewTotal.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div style={styles.modalActions}>
                            <button
                                style={styles.modalCancel}
                                onClick={() =>
                                    setDiscountModal(false)
                                }
                            >
                                Cancel
                            </button>

                            {discount > 0 && (
                                <button
                                    style={styles.clearDiscount}
                                    onClick={clearDiscount}
                                >
                                    Clear
                                </button>
                            )}

                            <button
                                style={styles.modalApply}
                                onClick={applyDiscount}
                            >
                                Apply Discount
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    page: {
        padding: 24,
        fontFamily: "system-ui, sans-serif",
    },

    searchWrap: {
        position: "relative",
        marginBottom: 20,
    },

    searchInput: {
        width: "100%",
        boxSizing: "border-box",
        padding: "12px 16px",
        borderRadius: 10,
        border: "1px solid #E5E7EB",
        background: "#FFFFFF",
        fontSize: 14,
        outline: "none",
    },

    dropdown: {
        position: "absolute",
        top: "calc(100% + 6px)",
        left: 0,
        right: 0,
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 10,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        zIndex: 10,
        overflow: "hidden",
    },

    dropdownItem: {
        padding: "12px 14px",
        borderBottom: "1px solid #F3F4F6",
    },

    dropdownInfo: {
        display: "flex",
        flexDirection: "column",
        gap: 3,
    },

    dropdownName: {
        fontSize: 13,
        fontWeight: 600,
        color: "#111827",
    },

    dropdownMeta: {
        fontSize: 12,
        color: "#6B7280",
    },

    message: {
        fontSize: 13,
        color: "#374151",
        marginBottom: 12,
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
    },

    cardTitle: {
        fontSize: 15,
        fontWeight: 600,
        color: "#111827",
        margin: "0 0 16px",
    },

    empty: {
        fontSize: 13,
        color: "#9CA3AF",
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
        padding: "10px 8px",
        fontSize: 13,
        color: "#111827",
        borderBottom: "1px solid #F3F4F6",
    },

    itemName: {
        fontWeight: 600,
    },

    itemSku: {
        fontSize: 12,
        color: "#9CA3AF",
    },

    qtyControls: {
        display: "flex",
        alignItems: "center",
        gap: 8,
    },

    qtyBtn: {
        width: 24,
        height: 24,
        borderRadius: 6,
        border: "1px solid #E5E7EB",
        background: "#F9FAFB",
        cursor: "pointer",
    },

    deleteBtn: {
        border: "none",
        background: "transparent",
        color: "#DC2626",
        cursor: "pointer",
        fontSize: 14,
    },

    customerLabel: {
        display: "block",
        fontSize: 12,
        fontWeight: 600,
        color: "#374151",
        marginBottom: 6,
    },

    customerInput: {
        width: "100%",
        boxSizing: "border-box",
        padding: "10px 12px",
        border: "1px solid #E5E7EB",
        borderRadius: 8,
        background: "#F9FAFB",
        fontSize: 13,
        outline: "none",
        marginBottom: 18,
    },

    summaryRow: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: 13,
        color: "#374151",
        marginBottom: 10,
    },

    hr: {
        border: "none",
        borderTop: "1px solid #E5E7EB",
        margin: "12px 0",
    },

    totalRow: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: 16,
        fontWeight: 700,
        color: "#111827",
        marginBottom: 20,
    },

    payButton: {
        width: "100%",
        padding: "12px",
        background: "#2563EB",
        color: "#FFFFFF",
        border: "none",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        marginBottom: 10,
    },

    secondaryButton: {
        width: "100%",
        padding: "11px",
        background: "#FFFFFF",
        color: "#374151",
        border: "1px solid #E5E7EB",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
        marginBottom: 10,
    },

    modalOverlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.45)",
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
        boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
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
        margin: "6px 0 0",
        fontSize: 13,
        color: "#6B7280",
    },

    closeButton: {
        border: "none",
        background: "transparent",
        color: "#6B7280",
        cursor: "pointer",
        fontSize: 16,
        padding: 4,
    },

    modalInputGroup: {
        marginBottom: 20,
    },

    modalLabel: {
        display: "block",
        fontSize: 13,
        fontWeight: 600,
        color: "#374151",
        marginBottom: 7,
    },

    inputWrapper: {
        display: "flex",
        alignItems: "center",
        border: "1px solid #D1D5DB",
        borderRadius: 8,
        overflow: "hidden",
        background: "#FFFFFF",
    },

    currency: {
        paddingLeft: 12,
        fontSize: 15,
        color: "#6B7280",
        fontWeight: 600,
    },

    modalInput: {
        flex: 1,
        width: "100%",
        boxSizing: "border-box",
        padding: "12px 10px",
        border: "none",
        outline: "none",
        fontSize: 15,
    },

    inputHint: {
        margin: "6px 0 0",
        fontSize: 11,
        color: "#9CA3AF",
    },

    discountPreview: {
        background: "#F9FAFB",
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
    },

    previewRow: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: 13,
        color: "#374151",
        marginBottom: 10,
    },

    previewTotal: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: 16,
        fontWeight: 700,
        color: "#111827",
    },

    modalActions: {
        display: "flex",
        gap: 10,
    },

    modalCancel: {
        flex: 1,
        padding: "11px",
        background: "#FFFFFF",
        color: "#374151",
        border: "1px solid #D1D5DB",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
    },

    clearDiscount: {
        flex: 1,
        padding: "11px",
        background: "#FEF2F2",
        color: "#DC2626",
        border: "1px solid #FECACA",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
    },

    modalApply: {
        flex: 1.5,
        padding: "11px",
        background: "#2563EB",
        color: "#FFFFFF",
        border: "none",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
    },
};