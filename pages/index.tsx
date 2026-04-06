import Link from 'next/link'
import { getAllPostsMeta, CATEGORIES, PostMeta } from '../lib/posts'
import type { GetStaticProps } from 'next'

interface Props {
  recentPosts: PostMeta[]
}

export default function Home({ recentPosts }: Props) {
  return (
    <div className="container">
      <header className="site-header">
        <h1 className="site-title">
          <Link href="/">我的博客</Link>
        </h1>
        <nav>
          {CATEGORIES.map(cat => (
            <Link key={cat.id} href={`/category/${encodeURIComponent(cat.id)}`}>
              {cat.label}
            </Link>
          ))}
        </nav>
      </header>

      <main>
        <h2>最新文章</h2>
        <ul className="post-list">
          {recentPosts.map(post => (
            <li key={post.slug}>
              <span className="post-date">{post.date}</span>
              <Link href={`/posts/${post.slug}`}>{post.title}</Link>
              <span className="post-category">{post.category}</span>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const recentPosts = getAllPostsMeta().slice(0, 10)
  return { props: { recentPosts } }
}
