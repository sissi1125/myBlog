import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'

// 文章存放目录：posts/学习记录/、posts/就业思考/、posts/读书记录/
const POSTS_DIR = path.join(process.cwd(), 'posts')

export interface PostMeta {
  slug: string        // URL 路径，如 "学习记录/react-hooks"
  title: string
  date: string
  category: string   // 一级分类
  tags?: string[]
  excerpt?: string
}

export interface Post extends PostMeta {
  contentHtml: string
}

// 将 Obsidian 特有语法转换为标准 Markdown / HTML
function transformObsidianSyntax(content: string): string {
  return content
    // ==高亮== → <mark>高亮</mark>
    .replace(/==(.+?)==/g, '<mark>$1</mark>')
    // [[Wiki链接|别名]] → 别名（纯文本，未来可扩展为内部链接）
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    // [[Wiki链接]] → 链接文字
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
}

// 递归读取 posts 目录下所有 .md 文件
function getAllMdFiles(dir: string, base: string = POSTS_DIR): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries.flatMap(entry => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return getAllMdFiles(fullPath, base)
    if (entry.name.endsWith('.md')) return [fullPath]
    return []
  })
}

export function getAllPostsMeta(): PostMeta[] {
  if (!fs.existsSync(POSTS_DIR)) return []

  return getAllMdFiles(POSTS_DIR)
    .map(filePath => {
      const relativePath = path.relative(POSTS_DIR, filePath)
      const slug = relativePath.replace(/\.md$/, '').replace(/\\/g, '/')
      const category = slug.split('/')[0]

      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const { data } = matter(fileContent)

      return {
        slug,
        category,
        title: data.title || path.basename(slug),
        date: data.date ? String(data.date).slice(0, 10) : '1970-01-01',
        tags: data.tags || [],
        excerpt: data.excerpt || '',
      }
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

export async function getPostBySlug(slug: string): Promise<Post> {
  const filePath = path.join(POSTS_DIR, `${slug}.md`)
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(fileContent)

  const transformed = transformObsidianSyntax(content)

  const processed = await remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false }) // sanitize:false 保留 <mark> 等自定义标签
    .process(transformed)

  const category = slug.split('/')[0]

  return {
    slug,
    category,
    title: data.title || path.basename(slug),
    date: data.date ? String(data.date).slice(0, 10) : '1970-01-01',
    tags: data.tags || [],
    excerpt: data.excerpt || '',
    contentHtml: processed.toString(),
  }
}

export const CATEGORIES = [
  { id: '学习记录', label: '学习记录', subcategories: ['前端', '后端', '运维', '计算机基础'] },
  { id: '就业思考', label: '就业 / 个人发展', subcategories: [] },
  { id: '读书记录', label: '读书记录', subcategories: [] },
]
