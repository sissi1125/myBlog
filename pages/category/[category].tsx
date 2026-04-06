import Link from 'next/link'
import { getAllPostsMeta, CATEGORIES, PostMeta } from '../../lib/posts'
import type { GetStaticProps, GetStaticPaths } from 'next'

interface Props {
  category: string
  label: string
  posts: PostMeta[]
}

export default function CategoryPage({ label, posts }: Props) {
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
        <h2>{label}</h2>
        <ul className="post-list">
          {posts.map(post => (
            <li key={post.slug}>
              <span className="post-date">{post.date}</span>
              <Link href={`/posts/${post.slug}`}>{post.title}</Link>
              {post.tags?.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: CATEGORIES.map(cat => ({ params: { category: cat.id } })),
  fallback: false,
})

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const category = params!.category as string
  const cat = CATEGORIES.find(c => c.id === category)
  const posts = getAllPostsMeta().filter(p => p.category === category)
  return { props: { category, label: cat?.label || category, posts } }
}
