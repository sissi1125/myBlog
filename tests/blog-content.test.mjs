import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { applyContentPlan, buildContentPlan } from '../scripts/blog-content.mjs'

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'myblog-content-'))
  const vaultDir = path.join(root, 'Obsidian Vault')
  const sourceDir = path.join(vaultDir, '博客发布')
  const postsDir = path.join(root, 'repo', 'posts')
  const assetsDir = path.join(root, 'repo', 'public', 'images', 'posts')
  await fs.mkdir(sourceDir, { recursive: true })
  return { root, vaultDir, sourceDir, postsDir, assetsDir }
}

async function write(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, content)
}

function article(body = '正文') {
  return `---\ntitle: 测试文章\ndate: 2026-08-17\ntags: [测试]\nexcerpt: 测试摘要\n---\n\n${body}\n`
}

test('同步分类文章并只复制实际引用的图片', async t => {
  const paths = await fixture()
  t.after(() => fs.rm(paths.root, { recursive: true, force: true }))
  await write(path.join(paths.sourceDir, '学习记录', '文章.md'), article('![[配图.png|说明]]\n\n![网络图](https://example.com/a.png)'))
  await write(path.join(paths.vaultDir, '附件', '配图.png'), 'image-data')
  await write(path.join(paths.vaultDir, '附件', '未引用.png'), 'private-image')

  const plan = await buildContentPlan(paths)
  assert.deepEqual(plan.changes.map(change => change.type), ['add', 'add'])
  assert.equal(plan.desiredAssets.size, 1)
  const output = plan.desiredPosts.get('学习记录/文章.md').toString()
  assert.match(output, /\/images\/posts\/%E5%AD%A6%E4%B9%A0%E8%AE%B0%E5%BD%95\/%E6%96%87%E7%AB%A0\/%E9%85%8D%E5%9B%BE.png/)
  assert.match(output, /https:\/\/example.com\/a.png/)

  await applyContentPlan(plan)
  const secondPlan = await buildContentPlan(paths)
  assert.deepEqual(secondPlan.changes, [])
})

test('忽略以下划线开头的模板和草稿目录', async t => {
  const paths = await fixture()
  t.after(() => fs.rm(paths.root, { recursive: true, force: true }))
  await write(path.join(paths.sourceDir, '_模板', '模板.md'), '不完整模板')
  await write(path.join(paths.sourceDir, '学习记录', '_草稿', '草稿.md'), '不完整草稿')
  await write(path.join(paths.sourceDir, '读书记录', '公开.md'), article())

  const plan = await buildContentPlan(paths)
  assert.deepEqual([...plan.desiredPosts.keys()], ['读书记录/公开.md'])
})

test('阻止缺少 frontmatter 或未放入分类目录的文章', async t => {
  const paths = await fixture()
  t.after(() => fs.rm(paths.root, { recursive: true, force: true }))
  await write(path.join(paths.sourceDir, '学习记录', '无日期.md'), '---\ntitle: 无日期\n---\n正文')
  await assert.rejects(() => buildContentPlan(paths), /date 必须是有效的 YYYY-MM-DD 日期/)

  await fs.rm(path.join(paths.sourceDir, '学习记录'), { recursive: true })
  await write(path.join(paths.sourceDir, '文章.md'), article())
  await assert.rejects(() => buildContentPlan(paths), /文章必须放在一级分类目录下/)
})

test('任意一级子目录都会成为分类', async t => {
  const paths = await fixture()
  t.after(() => fs.rm(paths.root, { recursive: true, force: true }))
  await write(path.join(paths.sourceDir, '书影音', '文章.md'), article())

  const plan = await buildContentPlan(paths)
  assert.deepEqual([...plan.desiredPosts.keys()], ['书影音/文章.md'])
})

test('阻止缺失图片和重名图片', async t => {
  const paths = await fixture()
  t.after(() => fs.rm(paths.root, { recursive: true, force: true }))
  const postPath = path.join(paths.sourceDir, '学习记录', '文章.md')
  await write(postPath, article('![[缺失.png]]'))
  await assert.rejects(() => buildContentPlan(paths), /找不到图片：缺失.png/)

  await write(postPath, article('![[重名.png]]'))
  await write(path.join(paths.vaultDir, '附件A', '重名.png'), 'a')
  await write(path.join(paths.vaultDir, '附件B', '重名.png'), 'b')
  await assert.rejects(() => buildContentPlan(paths), /图片重名/)
})

test('源文章删除后生成删除预览', async t => {
  const paths = await fixture()
  t.after(() => fs.rm(paths.root, { recursive: true, force: true }))
  const postPath = path.join(paths.sourceDir, '就业思考', '文章.md')
  await write(postPath, article())
  await applyContentPlan(await buildContentPlan(paths))
  await fs.unlink(postPath)

  const plan = await buildContentPlan(paths)
  assert.deepEqual(plan.changes, [{ type: 'delete', path: 'posts/就业思考/文章.md' }])
})

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' })
}

async function gitFixture() {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'myblog-git-'))
  git(cwd, ['init', '-b', 'main'])
  git(cwd, ['config', 'user.name', 'Blog Test'])
  git(cwd, ['config', 'user.email', 'blog-test@example.com'])
  await write(path.join(cwd, 'README.md'), 'clean\n')
  git(cwd, ['add', 'README.md'])
  git(cwd, ['commit', '-m', 'init'])
  return cwd
}

test('发布命令阻止非 main 分支', async t => {
  const cwd = await gitFixture()
  t.after(() => fs.rm(cwd, { recursive: true, force: true }))
  git(cwd, ['switch', '-c', 'feature'])
  const result = spawnSync('node', [path.join(repoRoot, 'scripts', 'blog-publish.mjs'), '--yes'], {
    cwd,
    encoding: 'utf8',
  })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /当前分支是 feature/)
})

test('发布命令阻止无关的工作区改动', async t => {
  const cwd = await gitFixture()
  t.after(() => fs.rm(cwd, { recursive: true, force: true }))
  await fs.writeFile(path.join(cwd, 'README.md'), 'dirty\n')
  const result = spawnSync('node', [path.join(repoRoot, 'scripts', 'blog-publish.mjs'), '--yes'], {
    cwd,
    encoding: 'utf8',
  })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /存在与文章无关的未提交改动/)
})
