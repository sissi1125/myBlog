import Link from 'next/link'
import Layout from '../../components/Layout'
import { getAllPostsMeta, getPostBySlug, Post } from '../../lib/posts'
import type { GetStaticProps, GetStaticPaths } from 'next'

export default function PostPage({ post }: { post: Post }) {
  return (
    <Layout>
      <article>
        <header className="mb-10">
          <h1
            className="text-xl mb-4"
            style={{ fontFamily: "'Noto Serif SC', serif", color: 'var(--color-text)' }}
          >
            {post.title}
          </h1>
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            <time>{post.date}</time>
            <span>·</span>
            <Link
              href={`/category/${encodeURIComponent(post.category)}`}
              className="link"
            >
              {post.category}
            </Link>
            {post.tags && post.tags.length > 0 && (
              <>
                <span>·</span>
                {post.tags.map(tag => (
                  <span key={tag}>#{tag}</span>
                ))}
              </>
            )}
          </div>
        </header>
        <div className="post-content" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
      </article>
      <Link href="/" className="inline-block mt-12 text-sm link">
        ← 返回
      </Link>
    </Layout>
  )
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getAllPostsMeta().map(p => ({ params: { slug: p.slug.split('/') } })),
  fallback: false,
})

export const getStaticProps: GetStaticProps = async ({ params }) => ({
  props: { post: await getPostBySlug((params!.slug as string[]).join('/')) },
})
