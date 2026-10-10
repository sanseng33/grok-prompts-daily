# Grok Imagine 每日提示词（私有）

成人向（NSFW）Grok 生图 / 生视频提示词日表，仅供 Soke 私人查阅。

## GitHub Pages（软锁）

站点从仓库 `docs/` 目录发布（`main` / `/docs`）。

- **密码**：`soke2026`（硬编码客户端门；本标签页 `sessionStorage` 解锁一次后保持）
- **注意**：这是**纯前端软锁**，密码哈希与页面源码均可被查看/绕过，**不是真正的访问控制**。GitHub Pages 即便仓库是 private，**站点 URL 本身仍是公开的**（任意知道链接的人都能打开 HTML；私有仓库 Pages 通常还需 GitHub Pro）。
- 推荐入口：Pages 上的 `index.html` → `embedded/YYYY-MM-DD.html`（数据已内联）

## 今天怎么看

1. Pages（若已启用）：打开站点首页，输入密码后选日期
2. 或下载 `docs/embedded/YYYY-MM-DD.html`，本机浏览器打开（同样有密码门）
3. 页面顶部可按 **来源**、**类型** 筛选；提示词单元格可点「展开 / 收起」

备选：`git clone` 后本地打开 `docs/embedded/*.html`。

## 目录结构

```
data/YYYY-MM-DD.json          # 当日表格（行对象数组）
data/index.json               # 可用日期列表
docs/data/                    # 同上副本，供 GitHub Pages（只发布 docs/）使用
daily/grok_prompts_*.xlsx     # 原始 Excel 备份
docs/index.html               # 日期列表（带密码门）
docs/day.html?date=...        # 拉取 JSON 的在线表（带密码门）
docs/embedded/YYYY-MM-DD.html # 内联数据的离线单页（推荐，带密码门）
templates/viewer.{css,js}     # 共用样式与逻辑
templates/gate.js             # 客户端密码门（SHA-256 + sessionStorage）
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
2. 复制到本仓库 `daily/`，写成 `data/YYYY-MM-DD.json`（并同步到 `docs/data/`）
3. 生成 / 覆盖 `docs/embedded/YYYY-MM-DD.html`（含密码门）
4. 刷新 `data/index.json` + `docs/data/index.json`
5. `git add` → `commit` → `push`（无变更则跳过 commit）

也可手动：

```bash
python3 scripts/xlsx_to_json.py daily/grok_prompts_YYYY-MM-DD.xlsx
cp -f data/*.json docs/data/
python3 scripts/build_embedded.py YYYY-MM-DD
python3 scripts/update_index.py
cp -f data/index.json docs/data/
git add -A && git commit -m "daily: YYYY-MM-DD ..." && git push
```

## 安全提醒

- 仓库保持 **private**
- 客户端密码门**可被绕过**（查看源码 / 哈希 / DevTools）；仅防随手点开
- Pages 站点 URL 是公开的；不要把链接发到公开场合
- 真正保密请勿依赖 Pages，改用 clone / 传 embedded 文件

## 隐藏条目（✕ 按钮）与存储适配器

- 每行右侧 ✕ = 仅在本浏览器隐藏。状态由 `templates/storage.js` 的 `window.HiddenStore` 管理（异步 `get(id)` / `set(id, rec|null)` / `list()`），当前实现为 localStorage，键 `grok-hidden:<帖子id>`。
- 记录结构：`{ id, handle, date, hidden_at, reason }`。「导出隐藏列表」下载 `{exported_at, version:1, hidden:[记录...]}`。
- 排序/分区选择存在 `grok-pref:sort`、`grok-pref:section`。

### 跨设备同步（已实现：Supabase）
- 右上角「登录同步」用 Supabase email+密码登录（会话由 supabase-js 持久化）。登录后 hidden_items 为准、localStorage 作离线缓存；本设备首次登录时会把本地已隐藏条目 upsert 上去。隐藏对所有日期生效。
- 表：`public.hidden_items(user_id uuid default auth.uid(), post_id, handle, day, reason, hidden_at, PK(user_id,post_id))`，RLS `auth.uid()=user_id`。
- 采集回流：`/workspace/xprompts/fetch_hidden.py`。

#### 原设计说明
1. 后端：Cloudflare Worker + KV（key=`hidden:<id>`，value=记录 JSON）或 Supabase 表 `hidden(id text pk, handle, date, hidden_at, reason)` + RLS。
2. 认证：静态页的密码门只是软锁，后端需要独立凭据（Worker 校验共享密钥/签名 token，或 Supabase 匿名登录 + 行级策略）；不要把可写密钥硬编码进公开页面。
3. 在 `storage.js` 中实现同签名的 `remote` 适配器（fetch Worker/Supabase REST），在页面加载时用 `window.HiddenStore = remote` 替换；可保留 localStorage 作离线缓存，联网后合并（以 hidden_at 新者为准）。viewer.js 无需改动。
4. CORS：Worker/Supabase 允许 `https://sanseng33.github.io`。

### 回流到每日采集（未实现）
- 采集前拉取隐藏列表（导出 JSON 或后端 API），把 id 写入 `/workspace/xprompts/seen_ids.txt`（`# hidden`），避免重复入表。
- 统计被隐藏作者：同一作者 ≥N 次 → 自动加入跳过名单（如 `skip_authors.txt`，build_xlsx.py 过滤）；`reason` 字段可用于提炼排除模式（关键词/标签），喂给 learn_keywords.py 作为负样本。
