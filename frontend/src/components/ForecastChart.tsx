import { useEffect, useState } from "react";
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const API = import.meta.env.VITE_API_URL;

interface ForecastPoint { date: string; predicted_units: number; lower_bound: number; upper_bound: number; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-light)", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
      <p style={{ color: "var(--text-muted)", marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color, margin: "2px 0" }}>
          {p.name}: <strong>{typeof p.value === "number" ? p.value.toFixed(1) : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function ForecastChart({ storeId, productId }: { storeId: string; productId: string }) {
  const [data, setData] = useState<ForecastPoint[]>([]);
  const [summary, setSummary] = useState("");
  const [seasonality, setSeasonality] = useState("");
  const [loading, setLoading] = useState(false);
  const [horizon, setHorizon] = useState(14);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/forecast/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store_id: storeId, product_id: productId, horizon_days: horizon }),
      signal: AbortSignal.timeout(120000),
    })
      .then((r) => r.json())
      .then((res) => {
        setData(res.forecast?.map((p: ForecastPoint) => ({ ...p, date: p.date.slice(5) })) ?? []);
        setSummary(res.trend_summary ?? "");
        setSeasonality(res.seasonality_notes ?? "");
      })
      .finally(() => setLoading(false));
  }, [storeId, productId, horizon]);

  const avg = data.length ? (data.reduce((s, p) => s + p.predicted_units, 0) / data.length).toFixed(1) : "—";
  const peak = data.length ? Math.max(...data.map((p) => p.predicted_units)).toFixed(0) : "—";
  const trend = data.length > 1 ? (data[data.length - 1].predicted_units > data[0].predicted_units ? "Upward" : "Downward") : "Stable";

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Demand Forecast</h3>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{storeId} / {productId}</p>
        </div>
        <select className="selector-select" value={horizon} onChange={(e) => setHorizon(Number(e.target.value))}
          style={{ minWidth: "auto", padding: "5px 10px", fontSize: 12 }}>
          {[7, 14, 30, 60].map((d) => <option key={d} value={d}>{d}d</option>)}
        </select>
      </div>

      <div className="mini-stats">
        {[
          { label: "Avg/Day", value: avg, color: "var(--accent-blue)" },
          { label: "Peak", value: peak, color: "var(--accent-purple)" },
          { label: "Trend", value: trend, color: "var(--accent-green)" },
        ].map((s) => (
          <div key={s.label} className="mini-stat">
            <div className="mini-stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="mini-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 }}>
          Loading forecast...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
            <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="upper_bound" fill="url(#blueGrad)" stroke="none" name="Upper" />
            <Area type="monotone" dataKey="lower_bound" fill="var(--bg-primary)" stroke="none" name="Lower" />
            <Line type="monotone" dataKey="predicted_units" stroke="var(--accent-blue)" strokeWidth={2.5} dot={false} name="Forecast" />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {summary && (
        <div className="ai-insight">
          <p><strong style={{ color: "var(--accent-blue)" }}>AI Insight:</strong> {summary}</p>
          {seasonality && <p style={{ marginTop: 4, fontSize: 11, color: "var(--text-muted)" }}>Seasonality: {seasonality}</p>}
        </div>
      )}
    </div>
  );
}
