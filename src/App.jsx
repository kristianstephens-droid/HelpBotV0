import Chat from "./components/Chat.jsx";

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>HelpBot</h1>
        <p className="tagline">Skeleton build — wired to Claude via Netlify Functions.</p>
      </header>
      <main className="app-main">
        <Chat />
      </main>
      <footer className="app-footer">
        <small>
          Nothing on this page ships without owner approval. See{" "}
          <code>docs/SHIPPING.md</code>.
        </small>
      </footer>
    </div>
  );
}
