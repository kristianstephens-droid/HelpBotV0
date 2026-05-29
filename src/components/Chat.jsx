import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble.jsx";

/**
 * Chat UI.
 *
 * Props (all optional — the chat still works standalone):
 *   - wizardContext: { team, tool, issueId, issueLabel, freeText }
 *       Sent to /api/chat with every request. The backend appends this as
 *       a small intake block on the system prompt so Claude knows the
 *       rep's team / tool / issue without re-asking.
 *   - initialUserMessage: string | { display: string, send: string }
 *       If present and the chat is empty, this message is auto-sent as
 *       the first user turn so Claude opens the conversation in context.
 *       When given as an object, `display` is what shows in the bubble
 *       and `send` is what gets POSTed to /api/chat. This lets the wizard
 *       attach a one-step-at-a-time directive for Claude without making
 *       the rep read their own bot-prompting language back at themselves.
 *       Plain string callers (and user-typed turns) keep working unchanged.
 *   - contextStripLabel: string
 *       A short, human-readable badge to display above the chat showing
 *       what the bot already knows (e.g. "New Sales \u00b7 Twilio Flex \u00b7 No Audio").
 */
export default function Chat({
  wizardContext = null,
  initialUserMessage = null,
  contextStripLabel = null,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const scrollRef = useRef(null);
  const autoSentRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function send(content, displayOverride) {
    const trimmed = content.trim();
    if (!trimmed || sending) return;
    const display = (displayOverride ?? content).trim();

    setError(null);
    const userMessage = { role: "user", content: trimmed };
    // Only attach displayContent when it actually differs from what we're
    // posting. Keeps user-typed turns as plain { role, content } objects.
    if (display && display !== trimmed) userMessage.displayContent = display;
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Strip any UI-only fields (e.g. displayContent) before sending.
          // The wire shape is strictly { role, content }.
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
          conversationId,
          context: wizardContext ?? undefined,
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

  // Auto-send the first user message exactly once when handed off from the wizard.
  useEffect(() => {
    if (autoSentRef.current) return;
    if (!initialUserMessage) return;
    if (messages.length > 0) return;
    autoSentRef.current = true;
    // Accept either a plain string (legacy / standalone callers) or
    // { display, send } from the wizard. When given an object, the bubble
    // renders `display` and the API receives `send`.
    const isObj =
      typeof initialUserMessage === "object" && initialUserMessage !== null;
    const sendStr = isObj ? initialUserMessage.send : initialUserMessage;
    const displayStr = isObj ? initialUserMessage.display : initialUserMessage;
    send(sendStr, displayStr);
    // We intentionally do not depend on `send`; it's stable for this purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUserMessage]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;
    const toSend = input;
    setInput("");
    send(toSend);
  }

  return (
    <section className="chat" aria-label="Chat">
      {contextStripLabel && (
        <div className="chat-context">
          <span className="chat-context-label">Context:</span>{" "}
          {contextStripLabel}
        </div>
      )}

      <div className="chat-messages" ref={scrollRef}>
        {messages.length === 0 && !sending ? (
          <div className="chat-empty">
            Say hi to start the conversation.
          </div>
        ) : (
          messages.map((m, i) => (
            <MessageBubble
              key={i}
              role={m.role}
              content={m.displayContent ?? m.content}
            />
          ))
        )}
        {sending && messages[messages.length - 1]?.role === "user" && (
          <div className="chat-typing">HelpBot is typing&hellip;</div>
        )}
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <textarea
          className="chat-input"
          placeholder="Type a message and press Enter…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
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
