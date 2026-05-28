import wordmark from "../assets/vt-helpbot-wordmark.png";

export default function BrandHeader() {
  return (
    <header className="w-full px-6 pt-5 pb-2">
      <img
        src={wordmark}
        alt="VT Help Bot"
        className="h-9 w-auto select-none"
        draggable={false}
      />
    </header>
  );
}
