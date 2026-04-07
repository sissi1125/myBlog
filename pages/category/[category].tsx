import Link from 'next/link'
import Layout from '../../components/Layout'
import { getAllPostsMeta, CATEGORIES, PostMeta } from '../../lib/posts'
import type { GetStaticProps, GetStaticPaths } from 'next'

interface Props { category: string; label: string; posts: PostMeta[] }

export default function CategoryPage({ label, posts }: Props) {
  return (
    <Layout>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-6">{label}</h2>
      <ul className="divide-y divide-zinc-100">
        {posts.map(post => (
          <li key={post.slug} className="py-4 flex items-baseline gap-4">
            <time className="text-sm text-zinc-400 shrink-0 tabular-nums">{post.date}</time>
            <Link href={`/posts/${post.slug}`} className="text-zinc-800 hover:text-indigo-500 transition-colors flex-1">
              {post.title}
            </Link>
            {post.tags?.map(tag => (
              <span key={tag} className="text-xs bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full shrink-0">{tag}</span>
            ))}
          </li>
        ))}
      </ul>
    </Layout>
  )
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: CATEGORIES.map(cat => ({ params: { category: cat.id } })),
  fallback: false,
})

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const category = params!.category as string
  return {
    props: {
      category,
      label: CATEGORIES.find(c => c.id === category)?.label || category,
      posts: getAllPostsMeta().filter(p => p.category === category),
    },
  }
}
