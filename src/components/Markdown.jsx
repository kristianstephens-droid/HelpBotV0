import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Markdown — single rendering surface for any user-facing prose in the app.
 *
 * Why centralize:
 *   - One place to control which markdown features we allow.
 *   - One place to harden links (target=_blank + rel=noreferrer).
 *   - One place to swap renderers if we later want syntax highlighting,
 *     copy-to-clipboard buttons on code blocks, etc.
 *
 * Safety notes:
 *   - react-markdown does NOT render raw HTML by default (no rehype-raw),
 *     so model output cannot inject <script>, <img onerror=…>, etc.
 *   - GitHub-flavored markdown adds tables / task lists / autolinks /
 *     strikethrough — useful for SOP-style replies from Claude.
 *
 * Usage: <Markdown>{content}</Markdown>
 *
 * `content` should be a string. Non-string children fall through unchanged
 * so callers don't have to special-case empty / loading states.
 */
export default function Markdown({ children, className }) {
  if (typeof children !== "string") {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={["markdown", className].filter(Boolean).join(" ")}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noreferrer" />
          ),
          img: ({ node, ...props }) => (
            <img
              {...props}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="markdown-img"
            />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
