import Link from 'next/link'
import Layout from '../components/Layout'
import { getAllPostsMeta, PostMeta } from '../lib/posts'
import type { GetStaticProps } from 'next'

export default function Home({ recentPosts }: { recentPosts: PostMeta[] }) {
  return (
    <Layout>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-6">最新文章</h2>
      <ul className="divide-y divide-zinc-100">
        {recentPosts.map(post => (
          <li key={post.slug} className="py-4 flex items-baseline gap-4">
            <time className="text-sm text-zinc-400 shrink-0 tabular-nums">{post.date}</time>
            <Link href={`/posts/${post.slug}`} className="text-zinc-800 hover:text-indigo-500 transition-colors flex-1">
              {post.title}
            </Link>
            <span className="text-xs text-zinc-400 shrink-0">{post.category}</span>
          </li>
        ))}
      </ul>
    </Layout>
  )
}

export const getStaticProps: GetStaticProps = async () => ({
  props: { recentPosts: getAllPostsMeta().slice(0, 10) },
})
