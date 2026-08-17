import { buildContentPlan, formatPlan } from './blog-content.mjs'

try {
  const plan = await buildContentPlan()
  console.log(formatPlan(plan))
} catch (error) {
  console.error(`内容检查失败：\n${error.message}`)
  process.exitCode = 1
}
