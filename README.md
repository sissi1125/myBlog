# Sissi 的博客

这是一个由 Next.js 生成的静态个人博客。公开文章在 Obsidian 中编写，提交到 GitHub 后由 Vercel 自动部署。

## 每天发布

1. 打开 Obsidian Vault 中的 `博客发布`。
2. 在 `学习记录`、`就业思考` 或 `读书记录` 下新建文章，可以复制 `_模板/博客文章模板.md`。
3. 在项目目录运行预览：

   ```bash
   pnpm blog:check
   ```

4. 确认无误后一键发布：

   ```bash
   pnpm blog:publish
   ```

发布命令会同步内容、检查文章和图片、执行生产构建、展示变化，并在确认后提交和推送到 `main`。Vercel 收到推送后自动更新线上博客。

## 内容规则

- 内容源固定为 `~/Documents/Obsidian Vault/博客发布`，也可临时用 `BLOG_SOURCE_DIR` 指向其他目录。
- 每篇文章必须位于一个公开分类目录下，并提供 `title` 和 `date`；`date` 使用 `YYYY-MM-DD`。
- `tags` 必须是文本数组，`excerpt` 必须是文本。
- 以下划线或点开头的文件、模板和草稿目录不会发布。
- 支持普通 Markdown 图片和 Obsidian `![[图片.png]]`。发布时只复制文章实际引用的图片；缺失或重名图片会中止发布。
- `博客发布` 是公开边界。不要将私人笔记放入这个目录。

## 本地开发

```bash
pnpm install --frozen-lockfile
pnpm dev
```

开发地址为 `http://localhost:3002`。发布前可运行：

```bash
pnpm test
pnpm typecheck
pnpm build
```

## 部署

生产站点托管在 Vercel，项目连接 GitHub 仓库 `sissi1125/myBlog`，生产分支为 `main`。仓库中的 Dockerfile 仅作为备用自托管方案。
