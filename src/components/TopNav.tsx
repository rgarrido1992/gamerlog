import Link from "next/link";

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-bg/70 border-b border-white/5">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center shadow-glow">
            <span className="font-display font-bold text-bg text-lg">M</span>
          </div>
          <span className="font-display font-bold text-xl tracking-tight">
            MemoryCard
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink href="/">Biblioteca</NavLink>
          <NavLink href="/lists">Listas</NavLink>
          <Link
            href="/add"
            className="btn btn-primary ml-3"
          >
            + Añadir juego
          </Link>
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-4 py-2 rounded-lg text-text-muted hover:text-text hover:bg-bg-hover transition-colors font-medium text-sm"
    >
      {children}
    </Link>
  );
}
