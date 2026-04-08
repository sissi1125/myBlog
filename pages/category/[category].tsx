import Link from 'next/link'
import Layout from '../../components/Layout'
import { getAllPostsMeta, CATEGORIES, PostMeta } from '../../lib/posts'
import type { GetStaticProps, GetStaticPaths } from 'next'

interface Props { category: string; label: string; posts: PostMeta[] }

export default function CategoryPage({ label, posts }: Props) {
  return (
    <Layout>
      <h1
        className="text-xl mb-10"
        style={{ fontFamily: "'Noto Serif SC', serif", color: 'var(--color-text)' }}
      >
        {label}
      </h1>
      <ul className="space-y-6">
        {posts.map(post => (
          <li key={post.slug} className="group">
            <Link
              href={`/posts/${post.slug}`}
              className="block py-1 transition-opacity hover:opacity-70"
            >
              <div className="flex items-baseline gap-4 mb-1">
                <h2
                  className="text-base"
                  style={{ fontFamily: "'Noto Serif SC', serif", color: 'var(--color-text)' }}
                >
                  {post.title}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <time
                  className="text-xs tabular-nums"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {post.date}
                </time>
                {post.tags?.map(tag => (
                  <span
                    key={tag}
                    className="text-xs"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </Link>
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
