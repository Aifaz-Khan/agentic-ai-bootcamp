import { useState, useEffect } from "react";
import ForecastChart from "../components/ForecastChart";
import ReorderTable from "../components/ReorderTable";
import AgentChat from "../components/AgentChat";
import DataUpload from "../components/DataUpload";

const API = import.meta.env.VITE_API_URL;

export default function Dashboard() {
  const [stores, setStores] = useState<string[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [storeId, setStoreId] = useState("S001");
  const [productId, setProductId] = useState("P0001");
  const [applied, setApplied] = useState({ storeId: "S001", productId: "P0001" });
  const [dataInfo, setDataInfo] = useState({ rows: 0, source: "default" });
  const [activeTab, setActiveTab] = useState<"forecast" | "chat" | "upload">("forecast");

  useEffect(() => {
    fetch(`${API}/forecast/stores`)
      .then((r) => r.json())
      .then((d) => setStores(d.stores || []))
      .catch(() => setStores(["S001", "S002", "S003", "S004", "S005"]));

    fetch(`${API}/data/info`)
      .then((r) => r.json())
      .then((d) => setDataInfo({ rows: d.rows, source: d.source }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${API}/forecast/products?store_id=${storeId}`)
      .then((r) => r.json())
      .then((d) => {
        const prods = d.products || [];
        setProducts(prods);
        setProductId(prods[0] || "P0001");
      })
      .catch(() => setProducts(["P0001"]));
  }, [storeId]);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#0f172a", minHeight: "100vh", color: "#f1f5f9" }}>

      {/* Top Navigation Bar */}
      <div style={{ background: "#1e293b", borderBottom: "1px solid #334155", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "22px" }}>📦</span>
          <div>
            <div style={{ fontWeight: "700", fontSize: "16px", color: "#f1f5f9" }}>Inventory Demand Forecasting</div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>Powered by XGBoost + Gemma AI</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {(["forecast", "chat", "upload"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                padding: "6px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "500",
                background: activeTab === tab ? "#3b82f6" : "transparent",
                color: activeTab === tab ? "#fff" : "#94a3b8",
              }}>
              {tab === "forecast" ? "📈 Forecast" : tab === "chat" ? "🤖 AI Chat" : "📂 Upload Data"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>

        {/* Stats Bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "Total Stores", value: stores.length || 5, icon: "🏪", color: "#3b82f6" },
            { label: "Total Products", value: products.length || 50, icon: "📦", color: "#8b5cf6" },
            { label: "Data Rows", value: dataInfo.rows.toLocaleString() || "73,100", icon: "📊", color: "#10b981" },
            { label: "Data Source", value: dataInfo.source === "default" ? "Default CSV" : dataInfo.source, icon: "💾", color: "#f59e0b" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "#1e293b", borderRadius: "12px", padding: "16px", border: "1px solid #334155" }}>
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>{stat.icon}</div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Store + Product Selector */}
        <div style={{ background: "#1e293b", borderRadius: "12px", padding: "20px", marginBottom: "24px", border: "1px solid #334155", display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Store</label>
            <select value={storeId} onChange={(e) => setStoreId(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#f1f5f9", fontSize: "14px", minWidth: "140px" }}>
              {stores.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Product</label>
            <select value={productId} onChange={(e) => setProductId(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#f1f5f9", fontSize: "14px", minWidth: "140px" }}>
              {products.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button onClick={() => setApplied({ storeId, productId })}
            style={{ padding: "8px 24px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px", height: "38px" }}>
            🔍 Analyze
          </button>
          <div style={{ fontSize: "13px", color: "#64748b", alignSelf: "center" }}>
            Analyzing: <span style={{ color: "#3b82f6", fontWeight: "600" }}>{applied.storeId}</span> / <span style={{ color: "#8b5cf6", fontWeight: "600" }}>{applied.productId}</span>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "forecast" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <ForecastChart storeId={applied.storeId} productId={applied.productId} />
            <ReorderTable storeId={applied.storeId} productId={applied.productId} />
          </div>
        )}

        {activeTab === "chat" && (
          <AgentChat storeId={applied.storeId} productId={applied.productId} />
        )}

        {activeTab === "upload" && (
          <DataUpload onUploadSuccess={(newStores) => {
            setStores(newStores);
            setStoreId(newStores[0] || "S001");
          }} />
        )}
      </div>
    </div>
  );
}
