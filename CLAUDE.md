# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

个人博客项目，使用 Next.js 14 + Tailwind CSS，支持从本地 Markdown 文件生成静态页面。计划扩展为 AI 应用。

## 常用命令

```bash
pnpm dev          # 本地开发，端口 3002
pnpm build        # 构建生产产物（standalone 模式）
pnpm start        # 运行生产构建
pnpm blog:check   # 预览 Obsidian 公开目录的待发布变化
pnpm blog:publish # 校验、构建、提交并推送文章
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
- **分类来源**：`posts/` 下真实存在的一级目录，随 Obsidian `博客发布` 目录动态生成
- **内容处理**：`lib/posts.ts` 负责读取 Markdown、解析 frontmatter、转换 Obsidian 语法、生成 HTML

### Obsidian 语法支持

`lib/posts.ts` 的 `transformObsidianSyntax` 函数处理：
- `==高亮==` → `<mark>高亮</mark>`
- `[[Wiki链接|别名]]` → 别名（纯文本）
- `[[Wiki链接]]` → 链接文字

### 内容发布

- **内容源**：`~/Documents/Obsidian Vault/博客发布`
- **同步目标**：仓库中的 `posts/` 和 `public/images/posts/`
- **一键发布**：`pnpm blog:publish` 只会提交文章和引用图片，推送后由 Vercel 自动部署
- **备用部署**：`Dockerfile` 使用多阶段构建，最终运行 standalone 模式的 Next.js

### 分类规则

分类不在代码中维护固定列表。发布脚本同步 Obsidian `博客发布` 下的一级目录，`lib/posts.ts` 再根据已同步文章生成导航与分类静态页面。

## 技术细节

- **Next.js 配置**：`output: 'standalone'` 用于 Docker 部署；webpack fallback 禁用了 `fs` 和 `path` 的客户端 polyfill
- **样式**：Tailwind CSS + `@tailwindcss/typography` 插件，`.post-content` 类用于文章排版
- **路径别名**：`@/*` 映射到项目根目录

## 后续规划

计划接入 Claude API 实现 AI 功能，可能需要：
- 添加 API Routes 处理后端逻辑
- 接入数据库（PostgreSQL）存储对话历史
