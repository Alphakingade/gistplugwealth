import { Link } from "@tanstack/react-router";
import logo from "@/assets/gistplugwealth-logo.webp";

export function Logo({
  className = "",
  variant = "light",
  showTagline = false,
}: {
  className?: string;
  variant?: "light" | "dark";
  showTagline?: boolean;
}) {
  return (
    <Link to="/" className={`inline-flex flex-col gap-1 ${className}`} aria-label="GistPlugWealth home">
      <img
        src={logo}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        alt="GistPlugWealth — Inform. Inspire. Increase."
        width={480}
        height={150}
        className={`h-9 w-auto sm:h-11 ${variant === "dark" ? "brightness-0 invert" : ""}`}
      />
      {showTagline ? (
        <span className="eyebrow text-muted-foreground">Inform. Inspire. Increase.</span>
      ) : null}
    </Link>
  );
}
