import Link from 'next/link'
import Layout from '../../components/Layout'
import { getAllPostsMeta, getPostBySlug, Post } from '../../lib/posts'
import type { GetStaticProps, GetStaticPaths } from 'next'

export default function PostPage({ post }: { post: Post }) {
  return (
    <Layout>
      <article>
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 mb-3">{post.title}</h1>
          <div className="flex items-center gap-3 text-sm text-zinc-400">
            <time>{post.date}</time>
            <Link href={`/category/${encodeURIComponent(post.category)}`} className="text-indigo-400 hover:text-indigo-600 transition-colors">
              {post.category}
            </Link>
            {post.tags?.map(tag => (
              <span key={tag} className="bg-indigo-50 text-indigo-500 text-xs px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        </header>
        <div className="post-content" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
      </article>
      <Link href="/" className="inline-block mt-10 text-sm text-zinc-400 hover:text-indigo-500 transition-colors">
        ← 返回首页
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
