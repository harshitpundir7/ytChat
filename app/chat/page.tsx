"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Message } from "@/types";

export default function ChatPage() {
  const router = useRouter();
  const { user, token, logout, isLoading } = useAuth();

  const [videoUrl, setVideoUrl] = useState("");
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoAuthor, setVideoAuthor] = useState("");

  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [askingQuestion, setAskingQuestion] = useState(false);

  const chatBoxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !user) router.push("/");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleLoadVideo = async () => {
    if (!videoUrl.trim()) return;
    setLoadingVideo(true);
    setLoadError("");

    try {
      const response = await fetch("/api/video/load", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: videoUrl }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load video");

      setSessionId(data.sessionId);
      setVideoId(data.videoId);
      setVideoTitle(data.videoTitle);
      setVideoAuthor(data.videoAuthor);

      setMessages([
        {
          role: "assistant",
          content: `Video loaded successfully! I've processed "${data.videoTitle || "this video"}"${data.videoAuthor ? ` by ${data.videoAuthor}` : ""}. What would you like to know?`,
        },
      ]);

      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : "Failed to load video");
    } finally {
      setLoadingVideo(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim() || !sessionId || !videoId || askingQuestion) return;

    const userMessage: Message = { role: "user", content: question };
    setMessages(prev => [...prev, userMessage]);
    setQuestion("");
    setAskingQuestion(true);

    setMessages(prev => [...prev, { role: "assistant", content: "__thinking__" }]);

    try {
      const response = await fetch("/api/video/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: userMessage.content,
          sessionId, videoId, videoTitle, videoAuthor,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to get answer");

      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: "assistant", content: data.answer },
      ]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Something went wrong";
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: "assistant", content: `Error: ${errMsg}` },
      ]);
    } finally {
      setAskingQuestion(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh", background: "var(--bg-base)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: "16px",
      }}>
        <div className="spinner" style={{ width: "28px", height: "28px", borderTopColor: "var(--accent)" }} />
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{
      height: "100vh", background: "var(--bg-base)",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>

      {/* ── Header ── */}
      <header style={{
        height: "56px", flexShrink: 0,
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center",
        padding: "0 20px", gap: "12px",
        position: "relative", zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginRight: "8px" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "7px",
            background: "var(--gradient-primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "13px", flexShrink: 0,
          }}>▶</div>
          <span style={{ fontWeight: 700, fontSize: "14px" }}>YTChat</span>
        </div>

        {/* Video info pill */}
        {videoTitle && (
          <div style={{
            flex: 1,
            display: "flex", alignItems: "center", gap: "8px",
            padding: "5px 12px",
            borderRadius: "8px",
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.2)",
            overflow: "hidden",
          }}>
            <span style={{ fontSize: "11px", color: "var(--accent)", flexShrink: 0 }}>▶</span>
            <span style={{
              fontSize: "12px", fontWeight: 500,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              color: "var(--text-secondary)",
            }}>
              {videoTitle}{videoAuthor && <> · <span style={{ color: "var(--text-muted)" }}>{videoAuthor}</span></>}
            </span>
          </div>
        )}
        {!videoTitle && <div style={{ flex: 1 }} />}

        {/* User */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "50%",
            background: "var(--gradient-primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "12px", fontWeight: 700, flexShrink: 0,
          }}>
            {(user?.name || user?.email || "U")[0].toUpperCase()}
          </div>
          <span style={{ fontSize: "13px", color: "var(--text-secondary)", display: "none" }}
            // @ts-expect-error - inline style for responsive
            className="desktop-only">
            {user?.name || user?.email}
          </span>
          <button
            onClick={() => { logout(); router.push("/"); }}
            className="btn-ghost"
            style={{ padding: "6px 12px", fontSize: "12px" }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── Left Panel ── */}
        <div style={{
          width: "380px", minWidth: "320px",
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border)",
          display: "flex", flexDirection: "column",
          flexShrink: 0,
        }}>
          {/* URL loader */}
          <div style={{ padding: "20px", borderBottom: "1px solid var(--border)" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "12px" }}>
              Load Video
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
                  fontSize: "14px", pointerEvents: "none",
                }}>🔗</span>
                <input
                  className="input-field"
                  type="text"
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLoadVideo()}
                  placeholder="https://youtu.be/..."
                  style={{ paddingLeft: "36px" }}
                />
              </div>

              <button
                className="btn-primary"
                onClick={handleLoadVideo}
                disabled={loadingVideo || !videoUrl.trim()}
                style={{ width: "100%", padding: "11px" }}
              >
                {loadingVideo ? (
                  <><div className="spinner" />Processing video...</>
                ) : (
                  "Load & Analyze Video"
                )}
              </button>

              {loadError && (
                <div style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  fontSize: "12px", color: "#fca5a5",
                  display: "flex", gap: "8px", alignItems: "flex-start",
                }}>
                  <span style={{ flexShrink: 0 }}>⚠</span>
                  {loadError}
                </div>
              )}
            </div>
          </div>

          {/* YouTube embed */}
          <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {videoId ? (
              <>
                <div style={{
                  width: "100%", aspectRatio: "16/9",
                  borderRadius: "12px", overflow: "hidden",
                  border: "1px solid var(--border)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    style={{ width: "100%", height: "100%", display: "block", border: "none" }}
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
                <div style={{
                  padding: "14px",
                  borderRadius: "10px",
                  background: "rgba(16,185,129,0.06)",
                  border: "1px solid rgba(16,185,129,0.2)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ color: "var(--success)", fontSize: "12px" }}>●</span>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--success)" }}>Ready to chat</span>
                  </div>
                  {videoTitle && (
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {videoTitle}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div style={{
                flex: 1,
                width: "100%", aspectRatio: "16/9",
                borderRadius: "12px",
                border: "2px dashed rgba(255,255,255,0.08)",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: "12px",
                color: "var(--text-muted)",
              }}>
                <div style={{ fontSize: "40px", opacity: 0.4 }}>▶</div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>No video loaded</p>
                  <p style={{ fontSize: "11px", opacity: 0.7 }}>Paste a YouTube URL above to start</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel: Chat ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg-base)" }}>

          {/* Messages */}
          <div ref={chatBoxRef} style={{
            flex: 1, overflowY: "auto",
            padding: "24px",
            display: "flex", flexDirection: "column", gap: "16px",
          }}>
            {messages.length === 0 ? (
              <div style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: "16px", opacity: 0.5, textAlign: "center",
                paddingBottom: "80px",
              }}>
                <div style={{ fontSize: "48px" }}>💬</div>
                <div>
                  <p style={{ fontWeight: 600, marginBottom: "6px" }}>Start a conversation</p>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Load a YouTube video from the left panel, then ask anything about it.</p>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className="animate-message" style={{
                  display: "flex",
                  flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  gap: "10px", alignItems: "flex-end",
                  animationDelay: `${i * 0.02}s`,
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "50%",
                    background: msg.role === "user" ? "var(--gradient-primary)" : "rgba(99,102,241,0.15)",
                    border: msg.role === "user" ? "none" : "1px solid rgba(99,102,241,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "12px", flexShrink: 0, fontWeight: 700,
                    color: msg.role === "user" ? "white" : "var(--accent)",
                  }}>
                    {msg.role === "user" ? (user?.name || user?.email || "U")[0].toUpperCase() : "AI"}
                  </div>

                  {/* Bubble */}
                  <div style={{
                    maxWidth: "72%",
                    padding: "12px 16px",
                    borderRadius: msg.role === "user"
                      ? "16px 16px 4px 16px"
                      : "16px 16px 16px 4px",
                    background: msg.role === "user"
                      ? "var(--gradient-primary)"
                      : "var(--bg-elevated)",
                    border: msg.role === "user"
                      ? "none"
                      : "1px solid var(--border)",
                    fontSize: "14px",
                    lineHeight: 1.65,
                    color: "var(--text-primary)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    boxShadow: msg.role === "user"
                      ? "0 4px 16px rgba(99,102,241,0.3)"
                      : "var(--shadow-sm)",
                  }}>
                    {msg.content === "__thinking__" ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ display: "flex", gap: "4px" }}>
                          {[0, 1, 2].map(j => (
                            <div key={j} style={{
                              width: "6px", height: "6px", borderRadius: "50%",
                              background: "var(--accent)",
                              animation: `pulse-glow 1.2s ease-in-out infinite`,
                              animationDelay: `${j * 0.2}s`,
                            }} />
                          ))}
                        </div>
                        <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Thinking...</span>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input bar */}
          <div style={{
            padding: "16px 24px",
            background: "var(--bg-surface)",
            borderTop: "1px solid var(--border)",
          }}>
            {!sessionId && (
              <p style={{
                fontSize: "12px", color: "var(--text-muted)",
                textAlign: "center", marginBottom: "10px",
              }}>
                ← Load a video to start chatting
              </p>
            )}
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <input
                  ref={inputRef}
                  className="input-field"
                  type="text"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleAsk()}
                  placeholder={sessionId ? "Ask anything about the video..." : "Load a video first..."}
                  disabled={!sessionId || askingQuestion}
                  style={{ paddingRight: "16px" }}
                />
              </div>
              <button
                onClick={handleAsk}
                disabled={!sessionId || askingQuestion || !question.trim()}
                className="btn-primary"
                style={{ padding: "12px 20px", flexShrink: 0, borderRadius: "10px" }}
              >
                {askingQuestion ? (
                  <div className="spinner" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4 19-7z" />
                  </svg>
                )}
              </button>
            </div>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", marginTop: "10px" }}>
              Press Enter to send · Powered by Groq + LangGraph
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
