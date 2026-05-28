import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble.jsx";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setError(null);
    const userMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          conversationId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      if (data.conversationId) setConversationId(data.conversationId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply ?? "(no reply)" },
      ]);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="chat" aria-label="Chat">
      <div className="chat-messages" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="chat-empty">
            Say hi to start the conversation.
            <br />
            <small>
              The bot will use a placeholder system prompt until one is added in{" "}
              <code>netlify/functions/_shared/prompts.js</code>.
            </small>
          </div>
        ) : (
          messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} />
          ))
        )}
      </div>

      <form className="chat-form" onSubmit={sendMessage}>
        <textarea
          className="chat-input"
          placeholder="Type a message and press Enter…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(e);
            }
          }}
          rows={1}
          disabled={sending}
        />
        <button
          className="chat-send"
          type="submit"
          disabled={sending || !input.trim()}
        >
          {sending ? "…" : "Send"}
        </button>
      </form>

      {error && <div className="chat-error">Error: {error}</div>}
    </section>
  );
}
