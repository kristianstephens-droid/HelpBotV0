import Markdown from "./Markdown.jsx";

export default function MessageBubble({ role, content }) {
  return (
    <div className={`bubble ${role}`}>
      <span className="role">{role}</span>
      <Markdown className="bubble-body">{content}</Markdown>
    </div>
  );
}
