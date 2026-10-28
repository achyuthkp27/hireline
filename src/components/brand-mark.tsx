import { cn } from "@/lib/cn";

/** Hireline's "H" mark, its crossbar rising like a trend line, as in src/app/icon.svg, in the primary colours, so it turns light in the dark scheme. Decorative: put the name next to it. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn("size-8 shrink-0", className)}>
      <rect width="64" height="64" rx="14.08" className="fill-primary" />
      <path className="fill-on-primary" d="M17 16h8v32h-8zM39 16h8v32h-8zM25 31l14-4v7l-14 4z" />
    </svg>
  );
}
