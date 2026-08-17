import Link from 'next/link'
import Head from 'next/head'
import Layout from '../../components/Layout'
import { getAllCategories, getAllPostsMeta, Category, PostMeta } from '../../lib/posts'
import type { GetStaticProps, GetStaticPaths } from 'next'

interface Props { category: string; label: string; posts: PostMeta[]; categories: Category[] }

export default function CategoryPage({ label, posts, categories }: Props) {
  return (
    <Layout categories={categories}>
      <Head>
        <title>{`${label} | Sissi 的博客`}</title>
      </Head>
      <h1
        className="text-xl mb-10"
        style={{ fontFamily: "'Songti SC', 'STSong', Georgia, serif", color: 'var(--color-text)' }}
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
                  style={{ fontFamily: "'Songti SC', 'STSong', Georgia, serif", color: 'var(--color-text)' }}
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
  paths: getAllCategories().map(cat => ({ params: { category: cat.id } })),
  fallback: false,
})

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const category = params!.category as string
  const categories = getAllCategories()
  return {
    props: {
      category,
      label: categories.find(c => c.id === category)?.label || category,
      posts: getAllPostsMeta().filter(p => p.category === category),
      categories,
    },
  }
}
