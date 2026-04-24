import { useEffect, useState } from "react";
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

const API = import.meta.env.VITE_API_URL;

interface ForecastPoint {
  date: string;
  predicted_units: number;
  lower_bound: number;
  upper_bound: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", padding: "12px", fontSize: "13px" }}>
        <p style={{ color: "#94a3b8", margin: "0 0 8px" }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color, margin: "2px 0" }}>
            {p.name}: <strong>{typeof p.value === "number" ? p.value.toFixed(1) : p.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ForecastChart({ storeId, productId }: { storeId: string; productId: string }) {
  const [data, setData] = useState<ForecastPoint[]>([]);
  const [summary, setSummary] = useState("");
  const [seasonality, setSeasonality] = useState("");
  const [loading, setLoading] = useState(false);
  const [horizon, setHorizon] = useState(14);

  const fetchForecast = () => {
    setLoading(true);
    fetch(`${API}/forecast/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store_id: storeId, product_id: productId, horizon_days: horizon }),
    })
      .then((r) => r.json())
      .then((res) => {
        setData(res.forecast?.map((p: ForecastPoint) => ({
          ...p,
          date: p.date.slice(5), // show MM-DD only
        })) ?? []);
        setSummary(res.trend_summary ?? "");
        setSeasonality(res.seasonality_notes ?? "");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchForecast(); }, [storeId, productId, horizon]);

  const avg = data.length ? (data.reduce((s, p) => s + p.predicted_units, 0) / data.length).toFixed(1) : "0";
  const peak = data.length ? Math.max(...data.map((p) => p.predicted_units)).toFixed(0) : "0";
  const trend = data.length > 1
    ? data[data.length - 1].predicted_units > data[0].predicted_units ? "📈 Upward" : "📉 Downward"
    : "➡️ Stable";

  return (
    <div style={{ background: "#1e293b", borderRadius: "12px", padding: "20px", border: "1px solid #334155" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#f1f5f9" }}>📈 Demand Forecast</h3>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>{storeId} / {productId}</p>
        </div>
        <select value={horizon} onChange={(e) => setHorizon(Number(e.target.value))}
          style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #475569", background: "#0f172a", color: "#f1f5f9", fontSize: "12px" }}>
          {[7, 14, 30, 60].map((d) => <option key={d} value={d}>{d} days</option>)}
        </select>
      </div>

      {/* Mini Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "16px" }}>
        {[
          { label: "Avg/Day", value: avg, color: "#3b82f6" },
          { label: "Peak", value: peak, color: "#8b5cf6" },
          { label: "Trend", value: trend, color: "#10b981" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#0f172a", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
            <div style={{ fontSize: "16px", fontWeight: "700", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {loading ? (
        <div style={{ height: "220px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
          ⏳ Training model & generating forecast...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} />
            <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
            <Area type="monotone" dataKey="upper_bound" fill="#3b82f620" stroke="none" name="Upper Band" />
            <Area type="monotone" dataKey="lower_bound" fill="#0f172a" stroke="none" name="Lower Band" />
            <Line type="monotone" dataKey="predicted_units" stroke="#3b82f6" strokeWidth={2} dot={false} name="Forecast" />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {/* AI Summary */}
      {summary && (
        <div style={{ marginTop: "12px", padding: "10px", background: "#0f172a", borderRadius: "8px", borderLeft: "3px solid #3b82f6" }}>
          <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8", lineHeight: "1.5" }}>
            🤖 <strong style={{ color: "#3b82f6" }}>AI Insight:</strong> {summary}
          </p>
          {seasonality && (
            <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748b" }}>
              🌿 Seasonality: {seasonality}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
