# AGENTS.md

给 AI 助手（以及任何接手这个仓库的人）的项目指南。动手前请先读完「铁律」和「已知的坑」两节。

---

## 这是什么

**xxtsoft.top** —— 站长的个人网站。构建于 2022 年，2026 年时是站长（@BSOD-MEMZ / xxt8582753）的自留地。

内容重心：校园生活、音游（太鼓 / 舞萌 / pjsk）、ClassIsland 课表美化、竞赛经历、对学校制度的吐槽、AI 编程与工程反思。

- 部署：Netlify（`netlify.toml`）
- 仓库：`github.com/BSOD-MEMZ/xxt85web`（**公开**）
- 许可：代码 MIT，文章 CC BY-NC 4.0

---

## 文档索引

| 文档 | 内容 |
|---|---|
| [`docs/THEMING.md`](docs/THEMING.md) | 主题机制：如何新增主题、切换与 DOM 还原、配套脚本、首次访问引导 |
| [`docs/STICKER-BOOK.md`](docs/STICKER-BOOK.md) | 手账主题：设计令牌、组件实现、交互规范、实现技巧、本次改动清单 |
| 本文「已知的坑」 | 改样式前必读 |

---

## 铁律

这几条是站长的立场，不是建议。违反它们等于拆掉这个站。

1. **零外部依赖。** 不引入任何第三方 CDN、前端框架、npm 包、统计/追踪脚本。所有资源必须托管在本仓库内。
2. **隐私至上。** 不做任何数据收集。站点目前只有一个 Umami 访问统计（仅首页加载），
   且**开关是真正生效的**（见「已知的坑」第 8 条）——用户在控制面板关掉后，
   连 DNS 预连接都不会发出。不要改成默认强制加载，也不要新增任何其它统计。
3. **不做破坏性改动。** 默认主题（`style.css`）必须始终保持现状。新样式一律以「新主题」的形式加入，由用户在个性化面板里手动启用。
4. **零构建。** 没有打包、没有编译、没有 npm。改完文件就是成品，直接刷新即可生效。
5. **不修改文章正文与描述文本**，除非任务明确要求。

---

## 技术结构

### 页面

| 文件 | 说明 |
|---|---|
| `index.html` | 首页。文章列表由 `js/index.js` 动态渲染 |
| `articles.html` | 已废弃的跳转页 |
| `downloads.html` / `medias.html` | 下载、多媒体 |
| `about.html` / `museum.html` / `donate.html` / `guestbook.html` | 关于、博物馆、捐助、留言本 |
| `search.html` | 站内搜索 |
| `upload.html` | 投稿指南（步骤条） |
| `404.html` / `restroom.html` / `nanfang.html` | 杂项 |
| `articles/*.html` | 文章正文（生成产物，通常不动） |
| `support/` `olds/` `live2d-widget/` | 附属页面、历史存档、看板娘组件 |

**每个页面都挂了两样东西**，这是全站主题机制的基础：

```html
<link rel="stylesheet" href="style.css" type="text/css" id="themeCss" />
<script src="js/theme-loader.js"></script>
```

### DOM 骨架（全站统一）

```
.titlebar            站点名
.navbar              导航
.content.wrap        主体，网格布局
  .main              主内容
  .sidebar           侧栏（data-sidebar-id: function / news / contact / progress / wmp）
    .window          卡片/窗口
      .window-titlebar
      .window-content
.footer
```

侧栏窗口可用 `window-hidden` 类隐藏，支持拖拽排序。

---

## 主题系统（摘要）

主题 = **运行时切换的一个 CSS 文件**。同一时刻只加载一份，所以每份主题 CSS **必须自包含全站样式**，不存在「覆盖层」这种玩法。

| 主题文件 | 说明 | 配套脚本 |
|---|---|---|
| `style.css` | **默认**。Vista / Frutiger Aero 拟物风 | — |
| `xpstyle.css` | XP 经典 | — |
| `modern-sticker.css` | 手账 Sticker Book | `js/modern-sticker.js` + `js/modern-sticker-icons.js` |

新增主题 = 写一份自包含 CSS + 在 `js/index.js` 的 `themes` 数组加一项 +（可选）写同名 `modern-<name>.js`。**零 HTML 修改**。

- 完整机制、切换与 DOM 还原规则、配套脚本加载 → **[`docs/THEMING.md`](docs/THEMING.md)**
- 手账主题的设计规范、组件实现与技巧 → **[`docs/STICKER-BOOK.md`](docs/STICKER-BOOK.md)**

**手账主题的硬约束**：禁 `backdrop-filter`（`box-shadow` 可用）· 字体只用本机 `msyh` · 图标用 Phosphor 的 SVG sprite · 默认主题零影响。

---

## 已知的坑

踩过的，别再踩。

### 1. 先查真实选择器，别按类名想当然

**首页文章列表是 `<ul id="articleList">`，没有 `article-list` 类。** `class="article-list"` 只属于 `search.html` 的搜索结果列表。同名不同物，写样式前先 grep 确认。

### 2. `.cat-btn` 被运行时注入了两份样式

- `js/index.js`（约 1504 行）→ 注入到 `#tagFilters`（首页）
- `js/search-logic.js`（约 153 行）→ 注入到 `#categoryFilters`（搜索页）

它们出现在主题 CSS **之后**，同特异性会盖掉主题样式。写样式必须同时提高特异性：

```css
:is(#tagFilters, #categoryFilters) .cat-btn { ... }
```

另外 `#tagFilters` 容器本身带内联 `display:flex; flex-wrap:wrap; gap:4px`，覆盖需要 `!important`。

### 3. 任何 DOM 注入都要实现「切回时还原」

`cycleTheme()` **不刷新页面**，切回旧主题时被改过的 DOM 还在。所有注入（图标替换、卡片重构、搜索框、背景装饰）都要监听 `#themeCss` 的 `href` 变化并还原。参考 `modern-sticker.js` 里的 `restoreIcons()` / `restoreCards()` / `removeDeco()`。

### 4. 内联样式与 `!important`

`index.html` 里的 `<h2><span style="color:#003399">`、`.sidebar-close-btn` 的 `style="display:none"` 都是内联的，改它们必须用 `!important`。

### 5. 动画用 `backwards`，不要用 `both`

元素入场动画若用 `animation-fill-mode: both`，结束态（`transform: none`）会一直生效，**盖住 `:hover` 的 transform**。用 `backwards` 只在延迟期保持起始态，播完立刻交还元素自身样式。

### 6. Vista 的交互反馈是「换色」，不是「浮动」

`style.css` 里旧站的 hover/active 全靠**渐变底 + 描边色**变化实现，没有位移、没有投影。往拟物态上加浮动或阴影会立刻显得违和。要贴合旧站观感，直接去那份 CSS 里取值。

### 7. `theme-picker` 的入口不能挪

首次访问的风格引导（`js/theme-picker.js`）由 **`theme-loader.js`** 加载。不要挪到 `modern-sticker.js` —— 新用户首屏是默认主题，那时手账脚本根本没加载，挪过去就永远不会弹。

### 8. Umami 按开关加载（易被改回硬编码）

`index.html` 的 head 里有一段内联脚本，**只有** `localStorage.umami_enabled !== 'false'` 时才
动态注入 Umami 的 `<script>`：

```html
<script>
  (function () {
    if (localStorage.getItem('umami_enabled') === 'false') return;
    var s = document.createElement('script');
    s.defer = true;
    s.src = 'https://cloud.umami.is/script.js';
    s.setAttribute('data-website-id', '...');
    document.head.appendChild(s);
  })();
</script>
```

关于这段有三个必须知道的事实：

- **默认是开启的**，与 `js/index.js`（`getItem('umami_enabled') !== 'false'`）保持一致。
  这是原有行为，不要擅自改变默认值。
- **不要改回硬编码的 `<link rel="preconnect">` + `<script>`**。曾经就是那样写的，
  结果是用户取消了勾选脚本照常加载；而且 `preconnect` 本身就会向 `cloud.umami.is`
  发起 DNS 解析与 TCP 握手——**关掉状态下一次请求都不该发出**。
- 改动需**刷新页面**才生效（脚本只在页面加载时注入一次）。

---

## 本地开发

没有依赖要装。起个静态服务器即可：

```bash
python -m http.server 8765 --bind 127.0.0.1
```

然后访问 `http://127.0.0.1:8765/`。

调试用的小开关：

- `?theme-picker=1` —— 强制弹出风格选择引导
- `?ripple=debug` —— 任意设备上强制启用触摸涟漪

主题与开关状态都存在 `localStorage`，想模拟全新访客就清掉 `theme` / `xxt-theme-picked` / `xxt-theme-never`。

---

## 提交约定

- 改动做完就提交，提交信息写清**改了什么、为什么**
- 动样式时注明作用于哪套主题
- 不要提交 `.workbuddy/`（已在 `.gitignore` 中）

---

## 与站长协作

- 他能独立完成大部分开发，找 AI 通常是啃硬骨头。**方案要经得起追问**，糊弄会被识破
- 对设计决策给清晰选项让他拍板，别替他做决定
- 审美偏好：友好、有情绪、偏萌系。**避开理性网格 / 工业感 / 高对比粗描边那一类**
- 完成度靠实测说话，不接受「大概是」
