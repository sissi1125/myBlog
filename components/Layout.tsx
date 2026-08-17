import Link from 'next/link'
import type { Category } from '../lib/posts'

export default function Layout({ children, categories }: { children: React.ReactNode; categories: Category[] }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <header className="border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="max-w-[640px] mx-auto px-6 py-8 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-lg"
            style={{ fontFamily: "'Songti SC', 'STSong', Georgia, serif", color: 'var(--color-text)' }}
            aria-label="Sissi 首页"
          >
            <img src="/brand/logo.svg" alt="" width="32" height="32" aria-hidden="true" />
            <span>Sissi</span>
          </Link>
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {categories.map(cat => (
              <Link
                key={cat.id}
                href={`/category/${encodeURIComponent(cat.id)}`}
                className="text-sm link"
              >
                {cat.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-[640px] mx-auto px-6 py-12">
        {children}
      </main>
    </div>
  )
}
