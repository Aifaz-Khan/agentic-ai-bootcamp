import { useState } from "react";

const API = import.meta.env.VITE_API_URL;

interface UploadResult {
  message: string;
  rows: number;
  stores: string[];
  products: string[];
  source: string;
  column_mapping: {
    mapped: Record<string, string>;
    missing: { column: string; action: string }[];
  };
}

export default function DataUpload({ onUploadSuccess }: {
  onUploadSuccess: (stores: string[], products: string[]) => void
}) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError(""); setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API}/data/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      setResult(data);
      onUploadSuccess(data.stores, data.products);
    } catch (err: any) { setError(err.message); }
    setUploading(false);
  };

  const handleReset = async () => {
    setUploading(true); setError(""); setResult(null);
    const res = await fetch(`${API}/data/reset`, { method: "POST" });
    const data = await res.json();
    setResult({ ...data, column_mapping: { mapped: {}, missing: [] } });
    onUploadSuccess(data.stores, []);
    setUploading(false);
  };

  return (
    <div className="card">
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>
        Upload Your Own Data
      </h3>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.6 }}>
        Upload any retail inventory CSV or JSON file — including datasets from Kaggle.<br />
        The system auto-detects column names and generates missing fields automatically.
      </p>

      {/* Supported datasets info */}
      <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.8 }}>
        <div style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Works with these Kaggle datasets:</div>
        <div>Rossmann Store Sales · Walmart Sales · Superstore Sales · M5 Forecasting</div>
        <div>Retail Store Inventory · Any dataset with date + sales quantity columns</div>
      </div>

      <label className="upload-zone">
        <div style={{ fontSize: 32, marginBottom: 10, color: "var(--text-muted)" }}>↑</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
          {uploading ? "Processing..." : "Click to upload CSV or JSON"}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Minimum required: date, store/product identifier, sales quantity
        </div>
        <input type="file" accept=".csv,.json" onChange={handleUpload}
          style={{ display: "none" }} disabled={uploading} />
      </label>

      <button className="btn btn-secondary" onClick={handleReset} disabled={uploading}
        style={{ marginBottom: 16 }}>
        Reset to Default Dataset
      </button>

      {/* Success result */}
      {result && result.rows > 0 && (
        <div>
          <div className="upload-result" style={{ marginBottom: 12 }}>
            {result.message} — {result.stores.length} stores, {result.products.length} products
          </div>

          {/* Column mapping preview */}
          {Object.keys(result.column_mapping?.mapped || {}).length > 0 && (
            <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                Column Mapping Detected
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
                {Object.entries(result.column_mapping.mapped).map(([original, mapped]) => (
                  <div key={original} style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    <span style={{ color: "var(--accent-orange)" }}>{original}</span>
                    {" → "}
                    <span style={{ color: "var(--accent-green)" }}>{mapped}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Auto-generated columns */}
          {result.column_mapping?.missing?.length > 0 && (
            <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                Auto-Generated Fields
              </div>
              {result.column_mapping.missing.map((m) => (
                <div key={m.column} style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>
                  <span style={{ color: "var(--accent-blue)" }}>{m.column}</span>: {m.action}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <div className="upload-error">{error}</div>}

      {/* Format guide */}
      <div style={{ marginTop: 16, padding: "12px 16px", background: "var(--bg-primary)", borderRadius: 8, border: "1px solid var(--border)" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
          Minimum required columns
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.8 }}>
          <strong style={{ color: "var(--text-secondary)" }}>date</strong> — any date format (2024-01-01, 01/01/2024, etc.)<br />
          <strong style={{ color: "var(--text-secondary)" }}>store_id</strong> — store or branch identifier (auto-generated if missing)<br />
          <strong style={{ color: "var(--text-secondary)" }}>product_id</strong> — product, SKU, or item identifier<br />
          <strong style={{ color: "var(--text-secondary)" }}>units_sold</strong> — sales quantity (also: Sales, Quantity, qty, demand)
        </div>
      </div>
    </div>
  );
}
