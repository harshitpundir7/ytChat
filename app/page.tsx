"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function LandingPage() {
  const router = useRouter();
  const { user, login, register } = useAuth();
  const [showAuth, setShowAuth] = useState<"login" | "register" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const openModal = (mode: "login" | "register") => {
    setShowAuth(mode);
    setError("");
    setEmail("");
    setPassword("");
    setName("");
  };

  const closeModal = () => {
    setShowAuth(null);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (showAuth === "login") {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      router.push("/chat");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-base)", overflow: "hidden", position: "relative" }}>

      {/* Ambient background blobs */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", top: "-20%", left: "-10%",
          width: "600px", height: "600px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
          animation: "blob 8s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", top: "30%", right: "-15%",
          width: "500px", height: "500px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)",
          animation: "blob 10s ease-in-out infinite 2s",
        }} />
        <div style={{
          position: "absolute", bottom: "-10%", left: "30%",
          width: "400px", height: "400px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
          animation: "blob 12s ease-in-out infinite 4s",
        }} />
        {/* Grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
        }} />
      </div>

      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        padding: "0 48px", height: "64px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(7,7,17,0.8)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "8px",
            background: "var(--gradient-primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px",
          }}>▶</div>
          <span style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-primary)" }}>YTChat</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {user ? (
            <button className="btn-primary" onClick={() => router.push("/chat")}
              style={{ padding: "8px 20px", fontSize: "13px" }}>
              Open App →
            </button>
          ) : (
            <>
              <button className="btn-ghost" onClick={() => openModal("login")}
                style={{ padding: "8px 18px", fontSize: "13px" }}>
                Sign in
              </button>
              <button className="btn-primary" onClick={() => openModal("register")}
                style={{ padding: "8px 20px", fontSize: "13px" }}>
                Get Started Free
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        position: "relative", zIndex: 1,
        paddingTop: "160px", paddingBottom: "100px",
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center", padding: "160px 24px 100px",
      }}>
        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "6px 16px", borderRadius: "99px",
          background: "rgba(99,102,241,0.1)",
          border: "1px solid rgba(99,102,241,0.25)",
          marginBottom: "32px",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "none" : "translateY(10px)",
          transition: "all 0.5s ease",
        }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />
          <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--accent-hover)", letterSpacing: "0.05em" }}>
            POWERED BY LANGGRAPH RAG
          </span>
        </div>

        <h1 style={{
          fontSize: "clamp(40px, 7vw, 80px)",
          fontWeight: 900,
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
          maxWidth: "900px",
          marginBottom: "24px",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "none" : "translateY(20px)",
          transition: "all 0.6s ease 0.1s",
        }}>
          Chat with any{" "}
          <span className="gradient-text">YouTube</span>
          <br />video instantly
        </h1>

        <p style={{
          fontSize: "clamp(16px, 2vw, 20px)",
          color: "var(--text-secondary)",
          maxWidth: "560px",
          lineHeight: 1.7,
          marginBottom: "48px",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "none" : "translateY(20px)",
          transition: "all 0.6s ease 0.2s",
        }}>
          Paste a YouTube URL and ask questions. Our AI understands the full video
          using semantic search — no more scrubbing through hours of content.
        </p>

        <div style={{
          display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "none" : "translateY(20px)",
          transition: "all 0.6s ease 0.3s",
        }}>
          {user ? (
            <button className="btn-primary" onClick={() => router.push("/chat")}
              style={{ fontSize: "15px", padding: "14px 32px", borderRadius: "12px" }}>
              Open Chat App →
            </button>
          ) : (
            <>
              <button className="btn-primary" onClick={() => openModal("register")}
                style={{ fontSize: "15px", padding: "14px 32px", borderRadius: "12px" }}>
                Start for free →
              </button>
              <button className="btn-ghost" onClick={() => openModal("login")}
                style={{ fontSize: "15px", padding: "14px 32px", borderRadius: "12px" }}>
                Sign in
              </button>
            </>
          )}
        </div>

        {/* Preview Card */}
        <div style={{
          marginTop: "80px",
          width: "100%", maxWidth: "860px",
          borderRadius: "20px",
          border: "1px solid var(--border)",
          background: "var(--bg-elevated)",
          overflow: "hidden",
          boxShadow: "0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "none" : "translateY(30px)",
          transition: "all 0.8s ease 0.4s",
        }}>
          {/* Window bar */}
          <div style={{
            height: "44px", background: "var(--bg-surface)",
            borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", padding: "0 16px", gap: "8px",
          }}>
            {["#ef4444","#f59e0b","#10b981"].map((c, i) => (
              <div key={i} style={{ width: "12px", height: "12px", borderRadius: "50%", background: c, opacity: 0.8 }} />
            ))}
            <div style={{
              marginLeft: "12px", flex: 1, height: "22px", borderRadius: "6px",
              background: "rgba(255,255,255,0.05)",
              display: "flex", alignItems: "center", padding: "0 10px",
              fontSize: "11px", color: "var(--text-muted)",
            }}>
              https://youtu.be/example
            </div>
          </div>
          {/* Mock chat */}
          <div style={{ display: "flex", minHeight: "260px" }}>
            <div style={{ width: "38%", borderRight: "1px solid var(--border)", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ height: "140px", borderRadius: "10px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px" }}>▶</div>
              <div style={{ height: "10px", borderRadius: "99px", background: "rgba(255,255,255,0.06)", width: "80%" }} />
              <div style={{ height: "10px", borderRadius: "99px", background: "rgba(255,255,255,0.04)", width: "55%" }} />
            </div>
            <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: "14px", justifyContent: "flex-end" }}>
              {[
                { role: "ai", text: "Video loaded! Ask me anything about the content." },
                { role: "user", text: "What are the main topics covered?" },
                { role: "ai", text: "The video covers 3 key areas: system design, scalability patterns, and database optimization techniques..." },
              ].map((m, i) => (
                <div key={i} style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                  padding: "10px 14px",
                  borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                  background: m.role === "user" ? "var(--gradient-primary)" : "rgba(255,255,255,0.05)",
                  border: m.role === "user" ? "none" : "1px solid var(--border)",
                  fontSize: "12px", lineHeight: 1.5, color: "var(--text-primary)",
                }}>{m.text}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{
        position: "relative", zIndex: 1,
        padding: "80px 24px",
        maxWidth: "1000px",
        margin: "0 auto",
      }}>
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.1em", color: "var(--accent)", textTransform: "uppercase", marginBottom: "12px" }}>
            How it works
          </p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-0.02em" }}>
            Intelligent video understanding
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          {[
            {
              icon: "🔗",
              title: "Paste any YouTube URL",
              desc: "Supports any public YouTube video. Our system automatically fetches and processes the transcript.",
            },
            {
              icon: "🧠",
              title: "LangGraph RAG pipeline",
              desc: "Smart routing between semantic retrieval and direct answer generation depending on your question type.",
            },
            {
              icon: "📌",
              title: "Pinecone vector search",
              desc: "Transcript chunks are embedded and stored in Pinecone for lightning-fast similarity search.",
            },
            {
              icon: "⚡",
              title: "Groq-powered answers",
              desc: "Ultra-fast inference powered by Groq, giving you near-instant answers to complex questions.",
            },
            {
              icon: "💾",
              title: "Session history",
              desc: "All your chat sessions and messages are saved to your account via PostgreSQL.",
            },
            {
              icon: "🔒",
              title: "Secure & private",
              desc: "JWT-based authentication with bcrypt password hashing. Your data stays yours.",
            },
          ].map((f) => (
            <div key={f.title} style={{
              padding: "28px",
              borderRadius: "16px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              transition: "all 0.25s ease",
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.3)";
                (e.currentTarget as HTMLElement).style.background = "var(--bg-card)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
                (e.currentTarget as HTMLElement).style.transform = "none";
              }}
            >
              <div style={{
                width: "48px", height: "48px", borderRadius: "12px",
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "22px", marginBottom: "16px",
              }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: "15px", marginBottom: "8px", color: "var(--text-primary)" }}>
                {f.title}
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section style={{
          position: "relative", zIndex: 1,
          padding: "60px 24px 120px",
          textAlign: "center",
        }}>
          <div style={{
            maxWidth: "560px", margin: "0 auto",
            padding: "56px 40px",
            borderRadius: "24px",
            background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)",
            border: "1px solid rgba(99,102,241,0.2)",
            boxShadow: "var(--shadow-glow)",
          }}>
            <h2 style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "12px" }}>
              Ready to get started?
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "32px", fontSize: "15px" }}>
              Free to use. No credit card required.
            </p>
            <button className="btn-primary" onClick={() => openModal("register")}
              style={{ fontSize: "15px", padding: "14px 40px", borderRadius: "12px" }}>
              Create free account →
            </button>
          </div>
        </section>
      )}

      {/* Auth Modal */}
      {showAuth && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px",
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(8px)",
          animation: "fadeIn 0.2s ease",
        }} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div style={{
            width: "100%", maxWidth: "420px",
            background: "var(--bg-elevated)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "20px",
            padding: "40px",
            boxShadow: "var(--shadow-lg)",
            animation: "fadeInUp 0.25s ease",
            position: "relative",
          }}>
            {/* Close */}
            <button onClick={closeModal} style={{
              position: "absolute", top: "16px", right: "16px",
              width: "32px", height: "32px", borderRadius: "8px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              cursor: "pointer", fontSize: "16px",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}
            >×</button>

            {/* Logo */}
            <div style={{ marginBottom: "28px" }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: "var(--gradient-primary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px", marginBottom: "16px",
              }}>▶</div>
              <h2 style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "4px" }}>
                {showAuth === "login" ? "Welcome back" : "Create your account"}
              </h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                {showAuth === "login"
                  ? "Sign in to continue to YTChat"
                  : "Start chatting with YouTube videos for free"}
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {showAuth === "register" && (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                    Your name <span style={{ color: "var(--text-muted)" }}>(optional)</span>
                  </label>
                  <input
                    className="input-field"
                    type="text"
                    placeholder="Harshit"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                  Email address
                </label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                  Password {showAuth === "register" && <span style={{ color: "var(--text-muted)" }}>(min. 8 chars)</span>}
                </label>
                <input
                  className="input-field"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  fontSize: "13px",
                  color: "#fca5a5",
                  display: "flex", alignItems: "flex-start", gap: "8px",
                }}>
                  <span style={{ flexShrink: 0, marginTop: "1px" }}>⚠</span>
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading}
                style={{ padding: "13px", borderRadius: "10px", marginTop: "4px", width: "100%", fontSize: "14px" }}>
                {loading ? (
                  <><div className="spinner" />{showAuth === "login" ? "Signing in..." : "Creating account..."}</>
                ) : (
                  showAuth === "login" ? "Sign in" : "Create account"
                )}
              </button>
            </form>

            <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "var(--text-secondary)" }}>
              {showAuth === "login" ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => openModal(showAuth === "login" ? "register" : "login")}
                style={{ color: "var(--accent-hover)", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
                {showAuth === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      )}
    </main>
  );
}