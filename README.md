# Grok Imagine 每日提示词（私有）

成人向（NSFW）Grok 生图 / 生视频提示词日表，仅供 Soke 私人查阅。**请勿公开、勿开启 GitHub Pages。**

> GitHub Pages 即便仓库是 private，站点本身也是公开的。本仓库含成人内容，**禁止启用 Pages**。

## 今天怎么看

推荐（离线、无需鉴权）：

1. 打开仓库里的 `docs/embedded/2026-10-09.html`（或对应日期）
2. 点 **Download / Raw → 另存**，用本机浏览器直接打开该 HTML  
   - 数据已内联为 `window.DAY_DATA`，不依赖 GitHub raw
3. 页面顶部可按 **来源**、**类型** 筛选；提示词单元格可点「展开 / 收起」

备选（需登录 GitHub）：

- 在 GitHub 网页打开 `docs/index.html` / `docs/day.html?date=YYYY-MM-DD`  
  - 私有仓库的 raw JSON 拉取常因未鉴权失败；失败时请改用上面的 embedded 页
- 或 `git clone` 本仓库后，本地用任意静态服务器 / 直接打开 `docs/embedded/*.html`

## 目录结构

```
data/YYYY-MM-DD.json          # 当日表格（行对象数组，含全部列）
data/index.json               # 可用日期列表
daily/grok_prompts_*.xlsx     # 原始 Excel 备份
docs/index.html               # 日期列表
docs/day.html?date=...        # 拉取 ../data/*.json 的在线表
docs/embedded/YYYY-MM-DD.html # 内联数据的离线单页（推荐）
templates/viewer.{css,js}     # 共用样式与逻辑
scripts/xlsx_to_json.py
scripts/build_embedded.py
scripts/update_index.py
```

列（中文）：来源 / 博主 / 链接 / 时间 / 类型 / 步骤数 / 题材 / 各步骤提示词+中文翻译 / 位置 / 点赞。

## 每日如何更新

采集流程见本地 `/workspace/xprompts/collect.md`。每日 xlsx 生成后执行：

```bash
/workspace/xprompts/publish_to_github.sh
```

脚本会（幂等）：

1. 取 `xprompts/daily/` 下最新 `grok_prompts_YYYY-MM-DD.xlsx`
2. 复制到本仓库 `daily/`，写成 `data/YYYY-MM-DD.json`
3. 生成 / 覆盖 `docs/embedded/YYYY-MM-DD.html`
4. 刷新 `data/index.json`
5. `git add` → `commit` → `push`（无变更则跳过 commit）

也可手动：

```bash
python3 scripts/xlsx_to_json.py daily/grok_prompts_YYYY-MM-DD.xlsx
python3 scripts/build_embedded.py YYYY-MM-DD
python3 scripts/update_index.py
git add -A && git commit -m "daily: YYYY-MM-DD ..." && git push
```

## 安全提醒

- 仓库保持 **private**
- **不要** 开 GitHub Pages / 不要做成公开 gist / 不要发到公开 CDN
- 分享给自己其他设备时，优先传 embedded HTML 文件，而不是把仓库改成 public
