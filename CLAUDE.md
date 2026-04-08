# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

个人博客项目，使用 Next.js 14 + Tailwind CSS，支持从本地 Markdown 文件生成静态页面。计划扩展为 AI 应用。

## 常用命令

```bash
pnpm dev          # 本地开发，端口 3002
pnpm build        # 构建生产产物（standalone 模式）
pnpm start        # 运行生产构建
```

## 核心架构

### 路由结构

```
/                        → 首页，最近 10 篇文章
/posts/[...slug]        → 文章详情页，支持嵌套路径如 /posts/学习记录/react-hooks
/category/[category]    → 分类页面，按一级目录筛选
```

### 内容管理

- **文章来源**：`posts/` 目录下的 `.md` 文件，按一级目录分类
- **现有分类**：学习记录、就业思考、读书记录
- **内容处理**：`lib/posts.ts` 负责读取 Markdown、解析 frontmatter、转换 Obsidian 语法、生成 HTML

### Obsidian 语法支持

`lib/posts.ts` 的 `transformObsidianSyntax` 函数处理：
- `==高亮==` → `<mark>高亮</mark>`
- `[[Wiki链接|别名]]` → 别名（纯文本）
- `[[Wiki链接]]` → 链接文字

### 部署方式

- **Docker**：`Dockerfile` 使用多阶段构建，最终运行 standalone 模式的 Next.js
- **CI/CD**：`.github/workflows/deploy.yml` 推送到 main 时自动构建并 rsync 到 ECS
- **Nginx**：`nginx.conf` 配置静态文件服务，适合 SSG 部署

### 分类配置

分类定义在 `lib/posts.ts` 的 `CATEGORIES` 常量：

```ts
export const CATEGORIES = [
  { id: '学习记录', label: '学习记录', subcategories: ['前端', '后端', '运维', '计算机基础'] },
  { id: '就业思考', label: '就业 / 个人发展', subcategories: [] },
  { id: '读书记录', label: '读书记录', subcategories: [] },
]
```

## 技术细节

- **Next.js 配置**：`output: 'standalone'` 用于 Docker 部署；webpack fallback 禁用了 `fs` 和 `path` 的客户端 polyfill
- **样式**：Tailwind CSS + `@tailwindcss/typography` 插件，`.post-content` 类用于文章排版
- **路径别名**：`@/*` 映射到项目根目录

## 后续规划

计划接入 Claude API 实现 AI 功能，可能需要：
- 添加 API Routes 处理后端逻辑
- 接入数据库（PostgreSQL）存储对话历史
