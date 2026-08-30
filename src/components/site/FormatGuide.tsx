const ROWS: { you: string; get: string }[] = [
  { you: "*bold text*", get: "bold text" },
  { you: "_italic text_", get: "italic text" },
  { you: "~crossed out~", get: "crossed out" },
  { you: "==highlighted==", get: "highlighted in gold" },
  { you: "# Big heading", get: "Section heading" },
  { you: "## Small heading", get: "Sub-heading" },
  { you: "- Point one", get: "Bullet list" },
  { you: "1. Step one", get: "Numbered list" },
  { you: "> Quoted line", get: "Pull quote box" },
  { you: "!! Quick tip", get: "Green tip box" },
  { you: "---", get: "Divider line" },
  { you: "https://site.com", get: "Clickable link" },
  { you: "Paste an image URL on its own line", get: "Full-width image" },
];

/** Plain-language cheatsheet for the WhatsApp-style article formatting. */
export function FormatGuide() {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4">
      <p className="text-sm font-semibold">Formatting cheatsheet — just like WhatsApp</p>
      <ul className="mt-3 grid gap-1.5 text-xs sm:grid-cols-2">
        {ROWS.map((row) => (
          <li key={row.you} className="flex items-center gap-2">
            <code className="rounded bg-background px-1.5 py-0.5 font-mono">{row.you}</code>
            <span className="text-muted-foreground">→ {row.get}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        Leave a blank line between paragraphs. Nothing else to learn.
      </p>
    </div>
  );
}
