# 🏆 番茄风向标 · Fanqie Rank Tracker

[![English](https://img.shields.io/badge/lang-English-blue)](README_EN.md)

> 👗🦸 **女频 + 男频双频道**：每日自动追踪番茄小说新书榜排行数据，各频道独立生成 AI 趋势分析（赛道 / 分类 / 题材 / 上升信号），部署为精美的在线看板，页头一键切换频道。

---

## ✨ 功能概览

| 功能 | 说明 |
|------|------|
| 🕷️ 自动爬取 | 每日抓取番茄**女频 / 男频**各自分类的新书榜 Top 20-30 |
| 📡 双频道隔离 | 男女频数据、趋势、接口、热点统计全部独立存放，互不覆盖 |
| 📊 趋势对比 | 自动对比相邻两天数据：新上榜 / 掉榜 / 排名变化 / 阅读量增长 |
| 🤖 AI 风向分析 | 接入 OpenAI 兼容 API（含 DeepSeek），按分类生成市场趋势速评 |
| 🧭 类型风向标 | 独立趋势页聚合多日数据，用 AI 总结各频道综合赛道、热门分类和高频题材；无 API 时规则兜底 |
| 🌱 首日也有分析 | 只有一天数据时按「当前在读总量」口径出结论，不再是一句「暂无趋势对比」 |
| 📚 短篇推荐 | 访问时按 99 个题材标签实时读取短故事，展示封面、摘要、阅读时长和互动数据，不落盘推荐内容 |
| 🖥️ 精美看板 | 暗色编辑风格仪表盘，带打字机动画和瀑布流书籍卡片 |
| 📱 移动适配 | 完整的移动端适配，侧边栏抽屉式菜单 |
| 🔌 数据接口 | 生成静态 `lastest` JSON 接口，可按频道和类型读取最新数据 |
| ⚡ 全自动化 | GitHub Actions + GitHub Pages，零服务器运维 |

---

## 🚀 食用指南

### 前置条件

- **Python 3.9+**
- **Git**
- 一个 GitHub 账号
- （可选）一个 OpenAI 兼容 API 的密钥，用于 AI 分析

### 第一步：Fork 仓库

点击 GitHub 页面右上角的 **Fork** 按钮，将项目 Fork 到你自己的账号下。

### 第二步：开启 GitHub Pages

1. 进入你 Fork 后的仓库 → **Settings** → **Pages**
2. Source 选择 **Deploy from a branch**
3. Branch 选择 `main`，目录选择 `/ (root)`
4. 点击 **Save**

稍等几分钟，你的看板就会上线：`https://<你的用户名>.github.io/FanqieRankTracker/`

### 第三步：配置 Secrets（可选，开启 AI 分析）

进入仓库 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**，添加以下三个 Secret：

| Secret 名称 | 说明 | 示例 |
|---|---|---|
| `API_BASE_URL` | OpenAI 兼容 API 的地址 | `https://api.deepseek.com/v1` |
| `API_KEY` | API 密钥 | `sk-xxxxxxxxxxxxx` |
| `API_MODEL` | 模型名称 | `deepseek-v4-flash` |

> **💡 提示：** 任何 OpenAI 兼容接口均可使用（如 DeepSeek / Moonshot / 自建服务等）。如果不配置这三个 Secret，系统将自动使用基于规则的摘要替代 AI 分析，**不影响核心功能**；本地运行时可把这些配置写进项目根目录的 `.env`（参考 `.env.example`，已被 `.gitignore` 忽略）。

### 第四步：手动触发首次运行

1. 进入仓库 → **Actions** → 左侧选择 **Daily Fanqie Rank Scraper**
2. 点击右上角 **Run workflow** → **Run workflow**
3. 等待 Workflow 运行完成（约 3–5 分钟）

运行成功后，`data/` 目录下会自动生成数据文件，打开 GitHub Pages 链接即可看到看板。

### 第五步：坐等自动更新

GitHub Actions 已配置为 **每天 UTC 00:00（北京时间 08:00）** 自动运行。之后无需任何手动操作，数据和看板会每天自动更新。

看板右上角的 **风向标** 可进入 `trend.html`，先查看当下火热综合赛道（如古风言情）、具体热门分类和高频题材，再按具体类型查看近 7 / 14 / 30 日或全部周期的趋势分析。全站热点会优先使用 AI 总结，未配置 API 或生成失败时使用规则统计文案兜底。

---

## 📡 双频道数据（女频 / 男频）

两个频道的产物完全隔离，跑男频不会覆盖女频看板：

| 产物 | 女频 | 男频 |
|---|---|---|
| 每日原始快照 | `data/fanqie_female_new_ranks_YYYYMMDD.json` | `data/fanqie_male_new_ranks_YYYYMMDD.json` |
| 看板聚合数据 | `data/latest_ranks.json` | `data/latest_ranks_male.json` |
| 全站热点总结 | `data/market_summary.json` | `data/market_summary_male.json` |
| 日期索引 | `data/dates.json` | `data/dates_male.json` |
| 趋势归档 | `data/trends/YYYY-MM-DD.json` | `data/trends_male/YYYY-MM-DD.json` |
| 静态接口 | `api/lastest/*`、`api/lastest.json` | `api/lastest_male/*`、`api/lastest_male.json` |

> 女频沿用历史路径是为了向后兼容已有链接和调用方；所有页面统一通过 `js/channel.js` 决定读哪一套。
>
> 页头的 **女频 / 男频** 按钮切换频道（也会记住选择、同步到 URL 的 `?gender=`）：
> `index.html?gender=male`、`trend.html?gender=male`。

各频道还各自拥有一套「综合赛道分组 + 题材关键词」：

| 频道 | 综合赛道 |
|---|---|
| 女频 | 古风言情 / 现代言情 / 幻想言情 / 快穿衍生 / 年代民国 / 娱乐星光 / 游戏体育 |
| 男频 | 玄幻仙侠 / 都市超能 / 历史军事 / 悬疑惊悚 / 科幻末世 / 都市爽文 / 游戏体育 / 衍生同人 |

---

## 🔌 最新数据接口

构建脚本会同步生成 GitHub Pages 可直接访问的静态 JSON 接口：

| 类型 | 路径 | 说明 |
|---|---|---|
| 类型索引（女频） | `api/lastest.json` | 返回所有可用类型及对应 URL |
| 全量数据（女频） | `api/lastest/all.json` | `type=all`，返回全部分类、趋势和书籍 |
| 单类型数据（女频） | `api/lastest/<类型>.json` | 返回指定类型的数据，例如 `api/lastest/古风世情.json` |
| 类型索引（男频） | `api/lastest_male.json` | 同上，男频频道 |
| 全量数据（男频） | `api/lastest_male/all.json` | 男频全部分类、趋势和书籍 |
| 单类型数据（男频） | `api/lastest_male/<类型>.json` | 例如 `api/lastest_male/东方仙侠.json` |

示例：

```bash
curl https://<你的用户名>.github.io/FanqieRankTracker/api/lastest/all.json
curl https://<你的用户名>.github.io/FanqieRankTracker/api/lastest/古风世情.json
curl https://<你的用户名>.github.io/FanqieRankTracker/api/lastest_male/all.json
curl https://<你的用户名>.github.io/FanqieRankTracker/api/lastest_male/东方仙侠.json
```

---

## 🔧 本地开发

```bash
# 1. 克隆仓库
git clone https://github.com/<你的用户名>/FanqieRankTracker.git
cd FanqieRankTracker

# 2. 创建虚拟环境（推荐）
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. 安装依赖
pip install -r requirements.txt
playwright install chromium

# 4. 运行爬虫（默认女频；加 --gender male 抓男频）
python scrape_fanqie_ranks.py --gender female
python scrape_fanqie_ranks.py --gender male

# 5. 构建看板数据（AI 分析配置写到项目根目录 .env，参考 .env.example）
copy .env.example .env   # Windows（macOS/Linux: cp .env.example .env）
python scripts/build_latest.py --gender female
python scripts/build_latest.py --gender male

# 没有 API key 也能跑：会自动降级为规则统计摘要
# 强制重算全部 AI 总结：加 --force
# 只想重算统计口径、不调用 AI（省钱/离线）：加 --no-ai

# 6. 本地预览前端
python -m http.server 8000
# 打开 http://localhost:8000          女频
# 打开 http://localhost:8000/?gender=male  男频
```

Windows 用户还可以直接双击：

| 脚本 | 作用 |
|---|---|
| `一键更新.bat` | 抓取并构建**女频** |
| `一键更新男频.bat` | 抓取并构建**男频** |
| `一键更新全部.bat` | 男女频依次跑完 |
| `启动看板.bat` | 本地起服务并打开看板 |

---

## 📁 项目结构

```
FanqieRankTracker/
├── .github/workflows/
│   ├── scrape.yml              # GitHub Actions 自动化工作流（男女频一起跑）
│   └── force_update.yml        # 手动强制重算（可选频道）
├── css/
│   └── style.css               # 暗色编辑风格主题样式
├── js/
│   ├── channel.js              # 频道（女频/男频）路径、赛道分组、题材词库、切换按钮
│   ├── app.js                  # 前端渲染逻辑（瀑布流 + 打字机动画）
│   ├── trend.js                # 类型风向标页逻辑
│   └── book.js                 # 作品详情页逻辑
├── scripts/
│   ├── build_latest.py         # 趋势对比 + AI 分析构建脚本（--gender female|male）
│   └── migrate_md_to_json.py   # 历史 md 迁移脚本
├── data/
│   ├── fanqie_female_new_ranks_YYYYMMDD.json  # 女频每日原始快照
│   ├── fanqie_male_new_ranks_YYYYMMDD.json    # 男频每日原始快照
│   ├── latest_ranks.json / latest_ranks_male.json    # 最新聚合数据（看板数据源）
│   ├── market_summary.json / market_summary_male.json # 各频道全站热点总结
│   └── trends/ 、 trends_male/                 # 各频道趋势归档
├── api/
│   ├── lastest/                # 女频最新数据静态接口（all + 按类型拆分）
│   └── lastest_male/           # 男频最新数据静态接口
├── index.html                  # 仪表盘入口页
├── trend.html                  # 类型风向标趋势分析页
├── shorts.html                 # 短篇推荐页
├── book.html                   # 作品详情页
├── scrape_fanqie_ranks.py      # 番茄小说爬虫（Playwright，--gender female|male）
├── .env.example                # AI 配置模板（复制为 .env 使用）
├── requirements.txt            # Python 依赖
└── README.md                   # 本文件
```

---

## ⚙️ 工作流程

```
┌─────────────────────────────────────────────────────────────┐
│                   GitHub Actions (每日 08:00)                │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Playwright   │───▶│  build_latest │───▶│  git commit  │  │
│  │  爬取榜单数据  │    │  趋势对比      │    │  自动提交     │  │
│  │              │    │  + AI 分析     │    │  到 main     │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                             │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
                    GitHub Pages 自动部署
                    用户访问在线看板 🌐
```

---

## 📝 常见问题

<details>
<summary><b>Q: Workflow 运行失败怎么办？</b></summary>

检查 Actions 日志中的错误信息。常见原因：
- 番茄小说页面结构变更 → 需要更新爬虫选择器
- Playwright 安装超时 → 尝试重新运行

</details>

<details>
<summary><b>Q: 不配置 AI Secret 也能用吗？</b></summary>

可以！系统会自动 fallback 到基于规则的摘要（如"新增3本上榜；《XX》排名上升+5位"）。只是没有 AI 自然语言分析而已。

</details>

<details>
<summary><b>Q: 可以换成男频或其他榜单吗？</b></summary>

男频已经内置支持，不需要改代码：

```bash
python scrape_fanqie_ranks.py --gender male
python scripts/build_latest.py --gender male
```

男频产物写到 `data/*_male.json` / `data/trends_male/` / `api/lastest_male/`，与女频完全隔离；
页面右上角切换「女频 / 男频」按钮即可查看（URL 上加 `?gender=male` 也行）。
想抓别的榜单，再改 `scrape_fanqie_ranks.py` 里 `GENDER_CONFIG` 的 `init_url` 即可。

</details>

<details>
<summary><b>Q: 男频一开始只有一天数据，会不会没有分析？</b></summary>

不会。只有一天时系统会切换成「当前在读总量」口径，照样给出综合赛道、具体分类、高频题材三层结论
（并标注「首日在读口径」）；积累到第二天起自动变成增长/新上榜/掉榜口径。

</details>

---

## 📜 License

MIT

---

<p align="center">
  <sub>Made with ☕ and 🤖 — 数据每日自动更新，无需手动维护</sub>
</p>
