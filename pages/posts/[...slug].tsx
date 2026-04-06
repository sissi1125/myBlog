import Link from 'next/link'
import { getAllPostsMeta, getPostBySlug, CATEGORIES, Post } from '../../lib/posts'
import type { GetStaticProps, GetStaticPaths } from 'next'

export default function PostPage({ post }: { post: Post }) {
  return (
    <div className="container">
      <header className="site-header">
        <h1 className="site-title"><Link href="/">我的博客</Link></h1>
        <nav>
          {CATEGORIES.map(cat => (
            <Link key={cat.id} href={`/category/${encodeURIComponent(cat.id)}`}>{cat.label}</Link>
          ))}
        </nav>
      </header>
      <main>
        <article className="post">
          <h1>{post.title}</h1>
          <div className="post-meta">
            <span>{post.date}</span>
            <Link href={`/category/${encodeURIComponent(post.category)}`}>{post.category}</Link>
            {post.tags?.map(tag => <span key={tag} className="tag">{tag}</span>)}
          </div>
          <div
            className="post-content"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />
        </article>
        <Link href="/" className="back-link">← 返回首页</Link>
      </main>
    </div>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getAllPostsMeta()
  return {
    paths: posts.map(p => ({ params: { slug: p.slug.split('/') } })),
    fallback: false,
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = (params!.slug as string[]).join('/')
  const post = await getPostBySlug(slug)
  return { props: { post } }
}
