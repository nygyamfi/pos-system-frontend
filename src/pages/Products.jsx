import { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000/api";

const emptyForm = {
    sku: "",
    name: "",
    price: "",
    stock_qty: "",
};

export default function Products() {
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState("");

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

    function startEdit(product) {
        setEditingId(product.id);

        setForm({
            sku: product.sku || "",
            name: product.name || "",
            price: product.price || "",
            stock_qty: product.stock_qty ?? "",
        });
    }

    function resetForm() {
        setEditingId(null);
        setForm(emptyForm);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setMessage("");

        if (!form.name.trim() || !form.price) {
            setMessage("Name and price are required.");
            return;
        }

        try {
            if (editingId) {
                // Update existing product
                const res = await fetch(`${API_BASE}/products/${editingId}`, {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: form.name.trim(),
                        price: form.price,
                    }),
                });

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(
                        data.detail || "Failed to update product."
                    );
                }

                setMessage("Product updated successfully.");
            } else {
                // Add new product
                if (!form.sku.trim()) {
                    setMessage("SKU is required for a new product.");
                    return;
                }

                const res = await fetch(`${API_BASE}/products`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        sku: form.sku.trim(),
                        name: form.name.trim(),
                        price: form.price,
                        stock_qty: Number(form.stock_qty) || 0,
                    }),
                });

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));

                    throw new Error(
                        data.detail || "Failed to create product."
                    );
                }

                setMessage("Product added successfully.");
            }

            resetForm();
            fetchProducts();
        } catch (err) {
            setMessage(err.message || "Something went wrong.");
        }
    }

    async function handleDelete(id) {
        if (!window.confirm("Delete this product?")) return;

        try {
            const res = await fetch(`${API_BASE}/products/${id}`, {
                method: "DELETE",
                credentials: "include",
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(
                    data.detail || "Failed to delete product."
                );
            }

            setMessage("Product deleted successfully.");
            fetchProducts();
        } catch (err) {
            setMessage(err.message || "Something went wrong.");
        }
    }

    return (
        <div style={styles.page}>
            <div style={styles.columns}>

                {/* PRODUCTS TABLE */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Products</h3>

                    {message && (
                        <p style={styles.message}>
                            {message}
                        </p>
                    )}

                    <table style={styles.table}>
                        <thead>
                        <tr>
                            <th style={styles.th}>Name</th>
                            <th style={styles.th}>SKU</th>
                            <th style={styles.th}>Price</th>
                            <th style={styles.th}>Stock</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                        </thead>

                        <tbody>
                        {products.map((p) => (
                            <tr key={p.id}>

                                <td style={styles.td}>
                                    {p.name}
                                </td>

                                <td style={styles.td}>
                                    {p.sku}
                                </td>

                                <td style={styles.td}>
                                    ₵{Number(p.price).toFixed(2)}
                                </td>

                                <td style={styles.td}>
                                    {p.stock_qty}
                                </td>

                                <td style={styles.td}>
                                    <button
                                        style={styles.linkBtn}
                                        onClick={() =>
                                            startEdit(p)
                                        }
                                    >
                                        Edit
                                    </button>

                                    <button
                                        style={styles.deleteBtn}
                                        onClick={() =>
                                            handleDelete(p.id)
                                        }
                                    >
                                        Delete
                                    </button>
                                </td>

                            </tr>
                        ))}
                        </tbody>
                    </table>

                    {products.length === 0 && (
                        <p style={styles.empty}>
                            No products yet.
                        </p>
                    )}
                </div>

                {/* ADD / EDIT PRODUCT */}
                <div
                    style={{
                        ...styles.card,
                        width: 320,
                    }}
                >
                    <h3 style={styles.cardTitle}>
                        {editingId
                            ? "Edit product"
                            : "Add product"}
                    </h3>

                    <form onSubmit={handleSubmit}>

                        {/* SKU */}
                        <label style={styles.label}>
                            SKU
                        </label>

                        <input
                            style={styles.input}
                            value={form.sku}
                            disabled={!!editingId}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    sku: e.target.value,
                                })
                            }
                            placeholder="123456789"
                        />

                        {/* NAME */}
                        <label style={styles.label}>
                            Name
                        </label>

                        <input
                            style={styles.input}
                            value={form.name}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    name: e.target.value,
                                })
                            }
                            placeholder="Coca Cola 330ml"
                        />

                        {/* PRICE */}
                        <label style={styles.label}>
                            Price
                        </label>

                        <input
                            style={styles.input}
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.price}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    price: e.target.value,
                                })
                            }
                            placeholder="1.50"
                        />

                        {/* STOCK */}
                        {!editingId && (
                            <>
                                <label style={styles.label}>
                                    Initial stock
                                </label>

                                <input
                                    style={styles.input}
                                    type="number"
                                    min="0"
                                    value={form.stock_qty}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            stock_qty:
                                            e.target.value,
                                        })
                                    }
                                    placeholder="0"
                                />
                            </>
                        )}

                        {/* SUBMIT */}
                        <button
                            type="submit"
                            style={styles.submitBtn}
                        >
                            {editingId
                                ? "Save changes"
                                : "Add product"}
                        </button>

                        {/* CANCEL */}
                        {editingId && (
                            <button
                                type="button"
                                style={styles.cancelBtn}
                                onClick={resetForm}
                            >
                                Cancel
                            </button>
                        )}

                    </form>
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

    message: {
        fontSize: 13,
        color: "#374151",
        marginBottom: 12,
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

    linkBtn: {
        border: "none",
        background: "transparent",
        color: "#2563EB",
        cursor: "pointer",
        fontSize: 13,
        marginRight: 10,
    },

    deleteBtn: {
        border: "none",
        background: "transparent",
        color: "#DC2626",
        cursor: "pointer",
        fontSize: 13,
    },

    label: {
        display: "block",
        fontSize: 13,
        fontWeight: 600,
        color: "#374151",
        margin: "0 0 6px",
    },

    input: {
        width: "100%",
        boxSizing: "border-box",
        padding: "10px 12px",
        marginBottom: 14,
        background: "#F9FAFB",
        border: "1px solid #E5E7EB",
        borderRadius: 8,
        fontSize: 13,
        outline: "none",
    },

    submitBtn: {
        width: "100%",
        padding: "11px",
        background: "#2563EB",
        color: "#FFFFFF",
        border: "none",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        marginBottom: 8,
    },

    cancelBtn: {
        width: "100%",
        padding: "10px",
        background: "#FFFFFF",
        color: "#374151",
        border: "1px solid #E5E7EB",
        borderRadius: 8,
        fontSize: 13,
        cursor: "pointer",
    },
};