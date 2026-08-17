import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import matter from 'gray-matter'

export const DEFAULT_SOURCE_DIR = path.join(os.homedir(), 'Documents', 'Obsidian Vault', '博客发布')

const IMAGE_EXTENSIONS = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp'])

function isIgnored(name) {
  return name.startsWith('.') || name.startsWith('_')
}

async function walk(root, options = {}) {
  const files = []
  async function visit(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (isIgnored(entry.name)) continue
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) await visit(fullPath)
      else if (!options.filter || options.filter(fullPath)) files.push(fullPath)
    }
  }
  await visit(root)
  return files
}

function toPosix(filePath) {
  return filePath.split(path.sep).join('/')
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value
}

function publicImageUrl(relativePath) {
  return `/images/posts/${toPosix(relativePath)
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/')}`
}

async function buildImageIndex(vaultDir) {
  const index = new Map()
  const images = await walk(vaultDir, {
    filter: filePath => IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase()),
  })
  for (const imagePath of images) {
    const basename = path.basename(imagePath)
    const matches = index.get(basename) || []
    matches.push(imagePath)
    index.set(basename, matches)
  }
  return index
}

function normalizeReference(reference) {
  return decodeURIComponent(reference.trim().split('#')[0])
}

async function resolveImage(reference, articlePath, sourceDir, imageIndex) {
  const normalized = normalizeReference(reference)
  if (!normalized) throw new Error(`图片路径为空：${articlePath}`)

  const directCandidates = [
    path.resolve(path.dirname(articlePath), normalized),
    path.resolve(sourceDir, normalized),
  ]
  for (const candidate of directCandidates) {
    try {
      const stat = await fs.stat(candidate)
      if (stat.isFile()) return candidate
    } catch {}
  }

  const matches = imageIndex.get(path.basename(normalized)) || []
  if (matches.length === 1) return matches[0]
  if (matches.length > 1) {
    throw new Error(`图片重名，无法确定使用哪一个：${reference}\n  ${matches.join('\n  ')}`)
  }
  throw new Error(`找不到图片：${reference}（文章：${articlePath}）`)
}

async function rewriteImages(content, context) {
  const assets = new Map()
  const usedNames = new Map()

  async function register(reference) {
    if (/^(?:https?:|data:|\/)/i.test(reference)) return reference
    const sourcePath = await resolveImage(
      reference,
      context.articlePath,
      context.sourceDir,
      context.imageIndex,
    )
    const basename = path.basename(sourcePath)
    const previous = usedNames.get(basename)
    if (previous && previous !== sourcePath) {
      throw new Error(`同一篇文章引用了两个同名图片：${basename}（文章：${context.articlePath}）`)
    }
    usedNames.set(basename, sourcePath)
    const assetRelative = path.join(context.articleSlug, basename)
    assets.set(assetRelative, await fs.readFile(sourcePath))
    return publicImageUrl(assetRelative)
  }

  const obsidianPattern = /!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g
  let rewritten = ''
  let cursor = 0
  for (const match of content.matchAll(obsidianPattern)) {
    rewritten += content.slice(cursor, match.index)
    const url = await register(match[1])
    const alt = match[2] || path.basename(match[1], path.extname(match[1]))
    rewritten += `![${alt}](${url})`
    cursor = match.index + match[0].length
  }
  rewritten += content.slice(cursor)

  const markdownPattern = /!\[([^\]]*)\]\(\s*(?:<([^>]+)>|([^\s)]+))(?:\s+["'][^"']*["'])?\s*\)/g
  let finalContent = ''
  cursor = 0
  for (const match of rewritten.matchAll(markdownPattern)) {
    finalContent += rewritten.slice(cursor, match.index)
    const reference = match[2] || match[3]
    const url = await register(reference)
    finalContent += `![${match[1]}](${url})`
    cursor = match.index + match[0].length
  }
  finalContent += rewritten.slice(cursor)

  return { content: finalContent, assets }
}

function validateFrontmatter(filePath, raw, data) {
  const errors = []
  if (typeof data.title !== 'string' || !data.title.trim()) errors.push('title 必须是非空文本')
  const dateMatch = raw.match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})["']?\s*$/m)
  if (!dateMatch || !isValidDate(dateMatch[1])) errors.push('date 必须是有效的 YYYY-MM-DD 日期')
  if (data.tags !== undefined && (!Array.isArray(data.tags) || data.tags.some(tag => typeof tag !== 'string'))) {
    errors.push('tags 必须是字符串数组')
  }
  if (data.excerpt !== undefined && typeof data.excerpt !== 'string') errors.push('excerpt 必须是文本')
  if (errors.length) throw new Error(`${filePath}\n  ${errors.join('\n  ')}`)
}

async function readCurrentFiles(root) {
  try {
    const files = await walk(root)
    const result = new Map()
    for (const filePath of files) result.set(toPosix(path.relative(root, filePath)), await fs.readFile(filePath))
    return result
  } catch (error) {
    if (error.code === 'ENOENT') return new Map()
    throw error
  }
}

function diffMaps(current, desired, prefix) {
  const changes = []
  for (const [relativePath, value] of desired) {
    const oldValue = current.get(relativePath)
    changes.push({
      type: oldValue === undefined ? 'add' : Buffer.compare(oldValue, value) === 0 ? 'same' : 'update',
      path: toPosix(path.join(prefix, relativePath)),
    })
  }
  for (const relativePath of current.keys()) {
    if (!desired.has(relativePath)) changes.push({ type: 'delete', path: toPosix(path.join(prefix, relativePath)) })
  }
  return changes.filter(change => change.type !== 'same').sort((a, b) => a.path.localeCompare(b.path, 'zh-CN'))
}

export async function buildContentPlan(options = {}) {
  const cwd = options.cwd || process.cwd()
  const sourceDir = options.sourceDir || process.env.BLOG_SOURCE_DIR || DEFAULT_SOURCE_DIR
  const postsDir = options.postsDir || path.join(cwd, 'posts')
  const assetsDir = options.assetsDir || path.join(cwd, 'public', 'images', 'posts')
  const vaultDir = options.vaultDir || path.dirname(sourceDir)

  const sourceFiles = await walk(sourceDir, { filter: filePath => filePath.endsWith('.md') })
  const imageIndex = await buildImageIndex(vaultDir)
  const desiredPosts = new Map()
  const desiredAssets = new Map()

  for (const articlePath of sourceFiles) {
    const relativePath = path.relative(sourceDir, articlePath)
    const segments = relativePath.split(path.sep)
    if (segments.length < 2) {
      throw new Error(`文章必须放在一级分类目录下：${relativePath}`)
    }

    const raw = await fs.readFile(articlePath, 'utf8')
    const parsed = matter(raw)
    validateFrontmatter(relativePath, raw, parsed.data)
    const frontmatter = raw.match(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/)
    if (!frontmatter) throw new Error(`${relativePath}\n  缺少有效的 frontmatter`)
    const articleSlug = relativePath.replace(/\.md$/, '')
    const rewritten = await rewriteImages(parsed.content, {
      articlePath,
      articleSlug,
      sourceDir,
      imageIndex,
    })
    const combined = `${frontmatter[0]}${rewritten.content.trimStart()}`
    const output = combined.endsWith('\n') ? combined : `${combined}\n`
    desiredPosts.set(toPosix(relativePath), Buffer.from(output))
    for (const [assetPath, data] of rewritten.assets) {
      const key = toPosix(assetPath)
      const existing = desiredAssets.get(key)
      if (existing && Buffer.compare(existing, data) !== 0) throw new Error(`生成的图片路径冲突：${key}`)
      desiredAssets.set(key, data)
    }
  }

  const currentPosts = await readCurrentFiles(postsDir)
  const currentAssets = await readCurrentFiles(assetsDir)
  return {
    sourceDir,
    postsDir,
    assetsDir,
    desiredPosts,
    desiredAssets,
    changes: [
      ...diffMaps(currentPosts, desiredPosts, 'posts'),
      ...diffMaps(currentAssets, desiredAssets, 'public/images/posts'),
    ],
  }
}

async function removeEmptyDirectories(root) {
  try {
    const entries = await fs.readdir(root, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) await removeEmptyDirectories(path.join(root, entry.name))
    }
    if ((await fs.readdir(root)).length === 0) await fs.rmdir(root)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}

async function applyDesired(root, desired) {
  const current = await readCurrentFiles(root)
  for (const [relativePath, data] of desired) {
    const destination = path.join(root, relativePath)
    await fs.mkdir(path.dirname(destination), { recursive: true })
    await fs.writeFile(destination, data)
  }
  for (const relativePath of current.keys()) {
    if (!desired.has(relativePath)) await fs.unlink(path.join(root, relativePath))
  }
  await removeEmptyDirectories(root)
}

export async function applyContentPlan(plan) {
  await applyDesired(plan.postsDir, plan.desiredPosts)
  await applyDesired(plan.assetsDir, plan.desiredAssets)
}

export function formatPlan(plan) {
  const lines = [`内容源：${plan.sourceDir}`]
  if (plan.changes.length === 0) return [...lines, '没有待发布的变化。'].join('\n')
  const labels = { add: '新增', update: '更新', delete: '删除' }
  lines.push(`待发布变化：${plan.changes.length} 项`)
  for (const change of plan.changes) lines.push(`  ${labels[change.type]}  ${change.path}`)
  return lines.join('\n')
}
