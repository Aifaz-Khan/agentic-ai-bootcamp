import { useState, useRef, useEffect } from "react";

const API = import.meta.env.VITE_API_URL;

interface Message { role: "user" | "agent"; text: string; time: string }

const QUICK_QUESTIONS = [
  "What is the demand trend?",
  "Should I reorder now?",
  "What drives demand most?",
  "What is the peak demand period?",
  "How much safety stock do I need?",
];

export default function AgentChat({ storeId, productId }: { storeId: string; productId: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "agent", text: `Hi! I'm your AI inventory assistant powered by Gemma 3. I have access to real forecast data for ${productId} at ${storeId}. Ask me anything!`, time: now() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  function now() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset chat when store/product changes
  useEffect(() => {
    setMessages([{ role: "agent", text: `Switched to ${productId} at ${storeId}. I now have access to the latest forecast data for this product. What would you like to know?`, time: now() }]);
  }, [storeId, productId]);

  const send = async (text?: string) => {
    const message = text || input;
    if (!message.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", text: message, time: now() }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, store_id: storeId, product_id: productId }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "agent", text: data.response || "No response.", time: now() }]);
    } catch {
      setMessages((m) => [...m, { role: "agent", text: "Connection error. Please try again.", time: now() }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ background: "#1e293b", borderRadius: "12px", border: "1px solid #334155", overflow: "hidden" }}>

      {/* Chat Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #334155", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#3b82f620", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🤖</div>
        <div>
          <div style={{ fontWeight: "700", fontSize: "14px", color: "#f1f5f9" }}>Inventory AI Assistant</div>
          <div style={{ fontSize: "11px", color: "#10b981" }}>● Gemma 3 • Real data from {storeId}/{productId}</div>
        </div>
      </div>

      {/* Quick Questions */}
      <div style={{ padding: "12px 20px", borderBottom: "1px solid #334155", display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {QUICK_QUESTIONS.map((q) => (
          <button key={q} onClick={() => send(q)} disabled={loading}
            style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "20px", border: "1px solid #334155", background: "#0f172a", color: "#94a3b8", cursor: "pointer", whiteSpace: "nowrap" }}>
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ height: "320px", overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "80%", padding: "10px 14px", borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
              background: m.role === "user" ? "#3b82f6" : "#0f172a",
              border: m.role === "agent" ? "1px solid #334155" : "none",
              fontSize: "13px", color: "#f1f5f9", lineHeight: "1.5",
            }}>
              {m.text}
            </div>
            <div style={{ fontSize: "10px", color: "#475569", marginTop: "2px" }}>{m.time}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            <div style={{ padding: "10px 14px", borderRadius: "12px 12px 12px 2px", background: "#0f172a", border: "1px solid #334155", fontSize: "13px", color: "#64748b" }}>
              ⏳ Analyzing real inventory data...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 20px", borderTop: "1px solid #334155", display: "flex", gap: "8px" }}>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask about inventory, demand, or reorder decisions..."
          style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#f1f5f9", fontSize: "13px", outline: "none" }}
        />
        <button onClick={() => send()} disabled={loading}
          style={{ padding: "10px 18px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
          Send
        </button>
      </div>
    </div>
  );
}
