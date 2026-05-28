export default function MessageBubble({ role, content }) {
  return (
    <div className={`bubble ${role}`}>
      <span className="role">{role}</span>
      {content}
    </div>
  );
}
