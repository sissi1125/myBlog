import Link from 'next/link'
import { CATEGORIES } from '../lib/posts'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-zinc-800">
      <header className="border-b border-zinc-100">
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center gap-8">
          <Link href="/" className="text-lg font-bold tracking-tight text-zinc-900 hover:text-indigo-500 transition-colors">
            我的博客
          </Link>
          <nav className="flex gap-5">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.id}
                href={`/category/${encodeURIComponent(cat.id)}`}
                className="text-sm text-zinc-500 hover:text-indigo-500 transition-colors"
              >
                {cat.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  )
}
