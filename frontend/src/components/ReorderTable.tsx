import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL;

interface Recommendation {
  reorder_now: boolean;
  recommended_quantity: number;
  reorder_point: number;
  safety_stock: number;
  reasoning: string;
}

export default function ReorderTable({ storeId, productId }: { storeId: string; productId: string }) {
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [inventory, setInventory] = useState(100);
  const [loading, setLoading] = useState(false);

  const fetchReorder = () => {
    setLoading(true);
    fetch(`${API}/reorder/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store_id: storeId, product_id: productId, current_inventory: inventory }),
    })
      .then((r) => r.json())
      .then(setRec)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReorder(); }, [storeId, productId]);

  const stockPct = rec ? Math.min(100, Math.round((inventory / (rec.reorder_point * 1.5)) * 100)) : 0;
  const stockColor = rec?.reorder_now ? "#ef4444" : stockPct < 60 ? "#f59e0b" : "#10b981";

  return (
    <div style={{ background: "#1e293b", borderRadius: "12px", padding: "20px", border: "1px solid #334155" }}>

      {/* Header */}
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#f1f5f9" }}>🔄 Reorder Recommendation</h3>
        <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>{storeId} / {productId}</p>
      </div>

      {/* Inventory Input */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: "11px", color: "#64748b", display: "block", marginBottom: "4px", textTransform: "uppercase" }}>Current Inventory</label>
          <input type="number" value={inventory} onChange={(e) => setInventory(Number(e.target.value))}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#f1f5f9", fontSize: "14px", boxSizing: "border-box" }} />
        </div>
        <button onClick={fetchReorder} disabled={loading}
          style={{ padding: "8px 16px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", marginTop: "18px" }}>
          Check
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>⏳ Calculating...</div>
      ) : rec && (
        <>
          {/* Status Badge */}
          <div style={{
            padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", textAlign: "center",
            background: rec.reorder_now ? "#ef444420" : "#10b98120",
            border: `1px solid ${rec.reorder_now ? "#ef4444" : "#10b981"}`,
          }}>
            <div style={{ fontSize: "20px", fontWeight: "800", color: rec.reorder_now ? "#ef4444" : "#10b981" }}>
              {rec.reorder_now ? "⚠️ REORDER NOW" : "✅ STOCK SUFFICIENT"}
            </div>
          </div>

          {/* Stock Level Bar */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>
              <span>Stock Level</span>
              <span>{stockPct}%</span>
            </div>
            <div style={{ background: "#0f172a", borderRadius: "4px", height: "8px", overflow: "hidden" }}>
              <div style={{ width: `${stockPct}%`, height: "100%", background: stockColor, borderRadius: "4px", transition: "width 0.5s" }} />
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
            {[
              { label: "Order Quantity", value: `${rec.recommended_quantity} units`, color: "#3b82f6" },
              { label: "Reorder Point", value: `${rec.reorder_point} units`, color: "#8b5cf6" },
              { label: "Safety Stock", value: `${rec.safety_stock} units`, color: "#f59e0b" },
              { label: "Current Stock", value: `${inventory} units`, color: stockColor },
            ].map((s) => (
              <div key={s.label} style={{ background: "#0f172a", borderRadius: "8px", padding: "10px" }}>
                <div style={{ fontSize: "15px", fontWeight: "700", color: s.color }}>{s.value}</div>
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* AI Reasoning */}
          {rec.reasoning && (
            <div style={{ padding: "10px", background: "#0f172a", borderRadius: "8px", borderLeft: "3px solid #8b5cf6" }}>
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8", lineHeight: "1.5" }}>
                🤖 <strong style={{ color: "#8b5cf6" }}>AI Reasoning:</strong> {rec.reasoning}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
