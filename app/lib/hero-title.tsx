import { type ReactNode } from "react";

// Hero başlığını render eder: <...> -> .gradient-text span, \n -> <br/>.
// page.tsx (statik fallback) ve hero-showcase.tsx ortak kullanır (drift olmasın).
export function renderHeroTitle(title?: string): ReactNode {
  if (!title) return null;
  return title.split(/(<[^>]+>)/g).map((part, index) => {
    if (part.startsWith("<") && part.endsWith(">")) {
      return <span key={index} className="gradient-text">{part.slice(1, -1)}</span>;
    }
    return (
      <span key={index}>
        {part.split("\n").map((line, i, arr) => (
          <span key={`line-${i}`}>{line}{i < arr.length - 1 && <br />}</span>
        ))}
      </span>
    );
  });
}
