import Link from 'next/link'
import Layout from '../components/Layout'
import { getAllPostsMeta, PostMeta } from '../lib/posts'
import type { GetStaticProps } from 'next'

export default function Home({ recentPosts }: { recentPosts: PostMeta[] }) {
  return (
    <Layout>
      {/* 个人介绍 */}
      <section className="mb-16">
        <h1
          className="text-2xl mb-4"
          style={{ fontFamily: "'Songti SC', 'STSong', Georgia, serif", color: 'var(--color-text)' }}
        >
          你好，我是 Sissi
        </h1>
        <p className="leading-loose" style={{ color: 'var(--color-text-secondary)' }}>
          我在这里记录技术学习、软件工程实践、读书笔记，以及工作与个人成长中的思考。
        </p>
      </section>

      {/* 最新文章 */}
      <section>
        <h2
          className="text-xs font-normal uppercase mb-8"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          最新文章
        </h2>
        <ul className="space-y-6">
          {recentPosts.map(post => (
            <li key={post.slug} className="group">
              <Link
                href={`/posts/${post.slug}`}
                className="block py-1 transition-opacity hover:opacity-70"
              >
                <div className="flex items-baseline gap-4 mb-1">
                  <h3
                    className="text-base"
                    style={{ fontFamily: "'Songti SC', 'STSong', Georgia, serif", color: 'var(--color-text)' }}
                  >
                    {post.title}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <time
                    className="text-xs tabular-nums"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    {post.date}
                  </time>
                  <span
                    className="text-xs"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    {post.category}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  )
}

export const getStaticProps: GetStaticProps = async () => ({
  props: { recentPosts: getAllPostsMeta().slice(0, 10) },
})
