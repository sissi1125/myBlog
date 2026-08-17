import type { AppProps } from 'next/app'
import Head from 'next/head'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Sissi 的博客</title>
        <meta
          name="description"
          content="记录技术学习、软件工程实践、读书笔记，以及工作与个人成长中的思考。"
        />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
