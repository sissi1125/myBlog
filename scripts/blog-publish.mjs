import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { applyContentPlan, buildContentPlan, formatPlan } from './blog-content.mjs'

function git(args, options = {}) {
  const result = execFileSync('git', args, { encoding: 'utf8', stdio: options.stdio || 'pipe' })
  return typeof result === 'string' ? result.trim() : ''
}

function publishDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function assertGitState() {
  const branch = git(['branch', '--show-current'])
  if (branch !== 'main') throw new Error(`当前分支是 ${branch || '(detached)'}，请切换到 main 后再发布。`)

  const dirty = git(['-c', 'core.quotepath=false', 'status', '--porcelain'])
    .split('\n')
    .filter(Boolean)
    .filter(line => {
      const filePath = line.slice(3).replace(/^"|"$/g, '')
      return !filePath.startsWith('posts/') && !filePath.startsWith('public/images/posts/')
    })
  if (dirty.length) throw new Error(`存在与文章无关的未提交改动，请先处理：\n${dirty.join('\n')}`)
}

async function confirmPublish() {
  if (process.argv.includes('--yes')) return true
  if (!input.isTTY) throw new Error('非交互环境请明确传入 --yes。')
  const rl = createInterface({ input, output })
  const answer = await rl.question('确认提交并推送这些内容？[y/N] ')
  rl.close()
  return /^y(?:es)?$/i.test(answer.trim())
}

try {
  assertGitState()
  const plan = await buildContentPlan()
  console.log(formatPlan(plan))
  const pendingContent = git([
    '-c',
    'core.quotepath=false',
    'status',
    '--porcelain',
    '--',
    'posts',
    'public/images/posts',
  ])
  if (plan.changes.length === 0 && !pendingContent) process.exit(0)
  if (plan.changes.length > 0) await applyContentPlan(plan)
  else console.log('检测到已同步但尚未提交的内容，继续发布。')

  console.log('\n正在验证生产构建...')
  const build = spawnSync('pnpm', ['build'], { stdio: 'inherit' })
  if (build.status !== 0) throw new Error('生产构建失败，内容尚未提交或推送。')

  console.log('\n实际 Git 变化：')
  console.log(git(['diff', '--stat', '--', 'posts', 'public/images/posts']) || '无变化')
  if (!(await confirmPublish())) {
    console.log('已取消。同步后的文件保留在工作区，未提交或推送。')
    process.exit(0)
  }

  const stagePaths = ['posts', 'public/images/posts'].filter(
    filePath => existsSync(filePath) || git(['ls-files', '--', filePath]),
  )
  git(['add', '-A', '--', ...stagePaths])
  try {
    git(['diff', '--cached', '--quiet'])
    console.log('没有需要提交的变化。')
    process.exit(0)
  } catch {}

  git(['commit', '-m', `content: publish ${publishDate()}`], { stdio: 'inherit' })
  git(['push', 'origin', 'main'], { stdio: 'inherit' })
  console.log('发布完成，Vercel 将自动部署本次提交。')
} catch (error) {
  console.error(`发布失败：\n${error.message}`)
  process.exitCode = 1
}
