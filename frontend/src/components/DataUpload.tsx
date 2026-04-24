import { useState } from "react";

const API = import.meta.env.VITE_API_URL;

interface UploadResult {
  message: string;
  rows: number;
  stores: string[];
  source: string;
}

export default function DataUpload({ onUploadSuccess }: { onUploadSuccess: (stores: string[]) => void }) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API}/data/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      setResult(data);
      onUploadSuccess(data.stores);
    } catch (err: any) {
      setError(err.message);
    }
    setUploading(false);
  };

  const handleReset = async () => {
    setUploading(true);
    setError("");
    const res = await fetch(`${API}/data/reset`, { method: "POST" });
    const data = await res.json();
    setResult(data);
    onUploadSuccess(data.stores);
    setUploading(false);
  };

  return (
    <div style={{ background: "#1e293b", borderRadius: "12px", padding: "20px", border: "1px solid #334155" }}>
      <h3 style={{ margin: "0 0 12px", color: "#f1f5f9" }}>📂 Upload Your Own Data</h3>
      <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 12px" }}>
        Upload a <strong>CSV</strong> or <strong>JSON</strong> file with your company's inventory data.
        Required columns: <code>date, store_id, product_id, units_sold</code>
      </p>

      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <label style={{
          padding: "8px 16px", background: "#2563eb", color: "#fff",
          borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "600"
        }}>
          {uploading ? "Uploading..." : "📁 Choose CSV / JSON"}
          <input type="file" accept=".csv,.json" onChange={handleUpload}
            style={{ display: "none" }} disabled={uploading} />
        </label>

        <button onClick={handleReset} disabled={uploading}
          style={{ padding: "8px 16px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}>
          🔄 Reset to Default Data
        </button>
      </div>

      {result && (
        <div style={{ marginTop: "12px", padding: "10px", background: "#f0fdf4", borderRadius: "6px", fontSize: "13px" }}>
          ✅ <strong>{result.message}</strong><br />
          Stores available: {result.stores.join(", ")}
        </div>
      )}

      {error && (
        <div style={{ marginTop: "12px", padding: "10px", background: "#fef2f2", borderRadius: "6px", fontSize: "13px", color: "#dc2626" }}>
          ❌ {error}
        </div>
      )}

      <div style={{ marginTop: "12px", fontSize: "12px", color: "#9ca3af" }}>
        <strong>CSV example:</strong> date,store_id,product_id,units_sold,price,discount,inventory_level<br />
        <strong>JSON example:</strong> [{`{"date":"2024-01-01","store_id":"S001","product_id":"P001","units_sold":120}`}]
      </div>
    </div>
  );
}
