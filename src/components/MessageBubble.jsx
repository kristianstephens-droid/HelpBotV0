import { forwardRef } from "react";
import Markdown from "./Markdown.jsx";

const MessageBubble = forwardRef(function MessageBubble(
  { role, content },
  ref,
) {
  return (
    <div ref={ref} className={`bubble ${role}`}>
      <span className="role">{role}</span>
      <Markdown className="bubble-body">{content}</Markdown>
    </div>
  );
});

export default MessageBubble;
