// Top bar for the Animation Builder — kept dark to match the uniform SiteHeader
// on every other page, sitting above the light workspace. Brand mark + title,
// a placeholder menu, and a back-to-index link.

export default function TopBar() {
  return (
    <header className="col-span-2 flex h-[52px] items-center gap-4 border-b border-white/10 bg-deep-navy px-4">
      <a href="/" className="flex items-center gap-2.5" aria-label="Agentic Engineering — home">
        <span className="block h-2.5 w-2.5 bg-electric-blue" />
        <span className="font-mono text-[13px] font-semibold tracking-tight text-soft-white">Animation Builder</span>
      </a>

      {/* placeholder for a future menu */}
      <span className="mx-1 h-5 w-px bg-white/10" />
      <button
        type="button"
        aria-label="Menu"
        title="Menu (coming soon)"
        className="flex h-7 w-7 items-center justify-center rounded-md text-soft-white/45 transition-colors hover:bg-white/5 hover:text-soft-white"
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4"><path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
      </button>

      <a
        href="/"
        className="ml-auto font-mono text-[11px] text-soft-white/45 transition-colors hover:text-periwinkle"
      >
        ← index
      </a>
    </header>
  );
}
