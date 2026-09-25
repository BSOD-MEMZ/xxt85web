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

**顶层页都挂了两样东西**，这是全站主题机制的基础：

```html
<link rel="stylesheet" href="style.css" type="text/css" id="themeCss" />
<script src="js/theme-loader.js"></script>
```

**文章页是另一套，别混**（`articles/*.html`，47 篇 + 1 篇特例）：

```html
<link rel="stylesheet" href="style.css">          <!-- 解析到 articles/style.css -->
<script src="article-theme-loader.js"></script>   <!-- 在 body 末尾 -->
```

注意名字：文章页挂的是 `article-theme-loader.js`，它是 `articles/` 目录下的**另一个文件**，
与顶层页的 `js/theme-loader.js` 毫无关系——两者只是名字像。
文章页也不读 `#themeCss`，而是靠 loader 改写那个 `<link>` 的 href。

> 特例：`articles/4thanniversary.html`（周年纪念页）自带完整的内联样式与脚本，不挂任何 loader，
> 主题机制不会碰它。

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

要用到文章页的主题，还得多做两步（都在 `articles/` 下，同样零 HTML 修改）：

1. 写一份**文章页版样式** `modern-<name>-article.css`。文章页的 DOM 与顶层页完全不同
   （`.header-image` / `.gradient-divider` / `.content-container` / `.article-content` /
   `.xxt-code-block` / `.image-viewer-*`），顶层主题 CSS 的规则一条也套不上，必须单独写一份。
2. 在 `articles/article-theme-loader.js` 的 `ARTICLE_THEME_MAP` 里登记一行
   （`'modern-xxx.css': 'modern-xxx-article.css'`）。**没登记的主题会安全地保持文章页默认外观**，
   不会出现「样式替换了但文件不存在」的空窗。同名 `.js` 会被自动加载，没有也行。

只有 `modern-sticker.css` 走了这条路，文章页样式 = `articles/modern-sticker-article.css`。

- 完整机制、切换与 DOM 还原规则、配套脚本加载 → **[`docs/THEMING.md`](docs/THEMING.md)**
- 手账主题的设计规范、组件实现与技巧 → **[`docs/STICKER-BOOK.md`](docs/STICKER-BOOK.md)**

**手账主题的硬约束**：禁 `backdrop-filter`（`box-shadow` 可用）· 字体只用本机 `msyh` · 图标用 Phosphor 的 SVG sprite · 默认主题零影响。

### 第三方资源全部本地化

**不引任何外部 CDN**（隐私 + 离线可用）。已本地化的有：

| 目录 | 内容 | 许可 |
|---|---|---|
| `js/modern-sticker-icons.js` | 图标 sprite（Phosphor + Simple Icons + 自绘） | MIT / CC0 |
| `vendor/katex/` | KaTeX 0.16.9 + 20 个 woff2 字体 | MIT |
| `live2d-widget/` | 看板娘本体与模型 | 见其 LICENSE |

改图标映射后**必须重跑生成器**（脚本不提交）：

```bash
node .workbuddy/tmp/gen-icons.js js/modern-sticker-icons.js
```

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

### 8. Umami 按开关加载（易被改回硬编码）`index.html` 的 head 里有一段内联脚本，**只有** `localStorage.umami_enabled !== 'false'` 时才
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

### 9. 图标替换会吃掉点击事件（有机制，但名单必须尽量小）

`addEventListener` 绑在**元素实例**上。把带监听的 `<img>` 换成 `<svg>`，事件跟着元素一起消失，
表现就是「按钮点不动」。先后踩过四次：UAC 关闭、图片预览关闭/翻页、对话框 `.vista-close-btn`、
侧栏关闭。

机制：

```
js/modern-sticker.js
  markKeepAlive()   → 给"必须保留 <img> 本体"的元素打 data-xxt-keep
  ICON_SELECTOR     → 每个分支统一 :not([data-xxt-keep])
  initIcons()       → markKeepAlive() 必须早于 swapIcons()(顺序反了会漏标)
  MutationObserver  → 每次回调重打一遍(幂等),覆盖动态弹出的对话框
```

> ⚠️ **第五轮踩过：这份名单一网打尽就出事。**
> 当时把 `.vista-close-btn` / `.sidebar-close-btn` 也标了，结果它们不再被矢量化，
> 直接露出原始 PNG —— 首页小窗关闭键"返祖"，侧栏的圆点整个消失
> （那套圆点是靠矢量化后的 `i-close-dot` 画的，不是 CSS 画的）。

**唯一判断标准：这个元素被换成 `<svg>` 之后，点击还有效吗？**

| 元素 | 换掉会怎样 | 结论 |
|---|---|---|
| `.sidebar-close-btn` | `index.js` 走**事件委托**挂在 sidebar 上 | 换掉没事 → **不标** |
| `.vista-close-btn` | `index.js` **直接绑在本体**上，换掉就丢 | 但外观需要 macos 圆点 → **不标**，改由 CSS 在 `<img>` 上自绘 |
| `.uac-close-btn` | `uac.js` 自己建 `<svg>` 并重新 `addEventListener` | 它的 `src` 是 `Window_CloseButton.png`，会被通配符命中 → **必须标** |
| `.image-viewer-*` | `image-viewer.js` 走事件委托 | 换掉没事，但配套脚本自己会升级 → **标**(见下) |

当前名单（`markKeepAlive()`）：
`.uac-close-btn` · `.image-viewer-close` · `.image-viewer-nav` ·
`.infobar-close` · `.xxt-copy-btn` · `.xxt-pin-close`

`.vista-close-btn` 的外观由 CSS 画在那枚**保留的 `<img>`** 上
（`object-position: -9999px -9999px` 把 PNG 推出视野，`::before` 画红点、
`::after` hover 浮出 ×）——**这样事件和外观同时保住**，这是关键技巧。

如果某处确实需要脚本自己升级图标（如文章页的 `image-viewer.js`），
优先用**事件委托**挂在父容器上，与节点是否被替换无关。

### 10. 两个图标塞进一个 `<svg>` 时必须显式打底 `display:none`，且顺序不能反

`#play-img` 要切「播放/暂停」，矢量没法换 `src`，所以两枚 `<use>` 一起塞。
但全局 `.xxt-ic { display: inline-block }` 是 `(0,1,0)` 且在文件更靠后，
隐藏规则若也只写 `(0,1,0)` 会被它盖掉 —— **两个图标同时画出来叠在一起**。
隐藏规则要抬到 `(0,1,1)`：`svg#play-img use.xxt-play-icon { display: none }`。

**更隐蔽的坑（第三轮就是栽在这）：** 三条规则的特异性/顺序必须严格是

```
1. svg#play-img use.xxt-play-icon,
   svg#play-img use.xxt-pause-icon        { display: none  }   ← 先全藏
2. svg#play-img use.xxt-play-icon         { display: block }   ← 无条件放行 play
3. .aero-player.is-playing …play-icon     { display: none  }   ← 播放时收回
   .aero-player.is-playing …pause-icon    { display: block }
```

第 2 条若被写到第 1 条之前（或之后又出现一条同特异性的 play 规则），
就会把第 1 条的 `display:none` 掀掉，**两枚图标又叠一起**。
判特异性别靠肉眼 —— `.workbuddy/tmp/test-play-cascade.js` 是个自写的层叠模拟器，
跑一遍就有结论。

### 11. 主题 CSS 在文章页不存在

`modern-sticker.css` **只在顶层页加载**；文章页走 `articles/modern-sticker-article.css`。
任何「运行时才出现、且文章页也会出现」的组件（UAC 弹窗、图片查看器）都不能只写在顶层 CSS 里。

UAC 的解法是把覆盖搬进 `js/uac.js`（`id="uac-sticker-styles"`，按主题开关注入），
顶层页 + 文章页共用一份。**改 UAC 外观请改 `uac.js`。**

### 12. 别信 `window.initWidget` 的 `export` 后缀

`live2d-widget/dist/waifu-tips.js` 末尾有 `export { a as l }`，是打包器残留。
它同时有 `window.initWidget = ...`，所以作为 `type="module"` 加载仍然正常。
判断看板娘是否可用时，**以 `window.initWidget` 是否存在为准，别看那个 `export`。**

另一个坑：`autoload.js` 里 `cubism5Path` 原本指向 `cubism.live2d.com`（外部 CDN）。
本站模型（`model/bilibili-live/22`、`/33`）都是 Cubism 2 的 `model.moc`，
版本判定为 2，**那条外部路径永远不会被读取** —— 已改成本地路径，别改回去。

### 13. 想「暂停后停在原角度」，就不能用 CSS `animation`

唱片封面（`.wmp-album-art img`）原本靠 `.aero-player.playing { animation: spinDisc }` 转。
问题：一暂停 `.playing` 被摘掉，animation 随之消失，`transform` 立刻掉回 `0deg` ——
视觉上就是「啪」地弹回正位。

**`animation` 和行内 `transform` 会互相打架**：animation 在跑的时候会覆盖行内值。
所以「保持角度」只能二选一：

- 用 JS 逐帧累加角度，写进 **行内 `transform`**（行内优先级最高，谁也掀不掉）
- 暂停 = `cancelAnimationFrame` + 不动角度 + 重新 `render()`

现实现见 `js/modern-sticker.js` 的 `initDisc()`：

```
play   → requestAnimationFrame 累加 angle(14s 一圈)
pause  → cancelAnimationFrame,不重置 angle,把当前角度固化到行内 transform
loadstart(切歌) → angle = 0
切回默认主题 → discReset() 摘掉行内 transform(否则默认主题封面一直歪着)
```

`discReset()` 已在 `initThemeSync()` 的还原分支里调用 —— **新增这类「写进行内样式」的
注入，务必同样挂上还原，否则切回旧主题会留下残余。**

### 14. 别相信「加载失败会被看到」——`onerror` 静默吞掉的坑

第五轮踩到：`katex-loader.js` 的 `BASE` 用自身 `src` 推出 `articles/`，
但 KaTeX 实际躺在站点根的 `vendor/katex/`。于是它去请求 `articles/katex.min.js` → 404，
`onerror` 里只是 `loadCallbacks = []` 静默收场，**页面上一点报错都没有**，
表现就是「公式没渲染，一堆 `$`」。这种 bug 靠肉眼看页面是查不出来的。

两条经验：

1. **路径一定要实测解析结果**，别推一遍就当对。用 `node -e` 模拟几种 src
   （`https://` / `http://localhost` / `file://`）看拼出来什么。
2. **凡是 `onerror` 静默降级的加载器，都要有独立验证手段。**
   KaTeX 这种可以在 Node 里用 `vm` + 最小 DOM 垫片跑一遍
   （`document.compatMode='CSS1Compat'`，否则它会抱怨 quirks mode）。

### 15. `&&` 和 `||` 混用会悄悄吃掉一整类图片

`articles/image-viewer.js` 里的旧过滤器：

```js
img.src && !img.src.includes('.png') || img.src.includes('.jpg') || …
```

`&&` 结合得比 `||` 紧，实际等价于 `(src && 不是png) || 是jpg || …`。
`.png` 不可能同时又是 `.jpg`，**于是所有纯 `.png` 的正文图被整条排除** ——
点上去没反应。`assets/xpbutton3.png`、`bmp324.png`、`AeroShot6.png` 全中招。

改成**允许式**判定更稳：排除已知的装饰图标（`close`/`home`/`printer`/`left`/`right`），
其余一律当正文图。

---

## LaTeX 公式

KaTeX 0.16.9 **已本地化**在 `vendor/katex/`（含 20 个 woff2，无 CDN 请求）。

```html
<script src="katex-loader.js"></script>   <!-- 文章页 </body> 前加这一行 -->
```

> ⚠️ **路径推导是这里最容易翻车的地方。**
> `katex-loader.js` 在 `articles/`，而 KaTeX 在站点根的 `vendor/katex/` ——
> 两者不同目录。`BASE` 必须从自身 `src` 里砍掉 `articles/katex-loader.js`
> 得到站点根，再拼 `vendor/katex/`（另留 `../vendor/katex/` 兜底）。
> 写错就会 404，而 `onerror` 是静默降级的，**页面上一堆 `$` 且毫无报错**（第五轮就是）。

正文里直接写 `$…$`（行内）、`$$…$$`（独行），也支持 `\(…\)` / `\[…\]`。

- **按需加载**：正文没有定界符就一个字节都不取
- **不用**官方 `auto-render`：它跳过不了 `<pre>`/`<code>`，命令行里的 `$PATH`、PHP 变量会被误当公式
- 包裹层 `.xxt-math-inline` / `.xxt-math-display`，两套文章页 CSS 各自排版
- 自测（无需浏览器）：
  ```bash
  node -e "const fs=require('fs'),vm=require('vm'); ..."   # vm + DOM 垫片跑真 KaTeX
  ```
  重点验证 `katex.version` 能打印、`renderToString` 有输出、
  且 `vendor/katex/fonts/` 里 20 个 woff2 与 CSS 的 20 条 `url(fonts/…)` 一一对应。

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
