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

> **唯一一处有意为之的外部依赖是 giscus**（评论 / 留言本）：它本体就跑在
> `giscus.app` 的 iframe 里，没法本地化。除了它，页面不向任何第三方发起请求
> （Umami 那个有开关，默认开、可关，见坑 8）。
> giscus 的**主题**是本地文件（`css/giscus-theme.css` / `css/giscus-sticker-theme.css`），
> 只是要用绝对 URL 交给它 —— 见坑 23。

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
| `.vista-close-btn` | 直接绑在本体上，换掉就丢 → **补上容器委托后**换掉没事 | 外观要 macos 圆点 → **不标** |
| `.uac-close-btn` | `uac.js` 自己建 `<svg>` 并重新 `addEventListener` | 它的 `src` 是 `Window_CloseButton.png`，会被通配符命中 → **必须标** |
| `.image-viewer-*` | `image-viewer.js` 走事件委托 | 换掉没事，但配套脚本自己会升级 → **标**(见下) |

当前名单（`markKeepAlive()`）：
`.uac-close-btn` · `.image-viewer-close` · `.image-viewer-nav` ·
`.infobar-close` · `.xxt-copy-btn` · `.xxt-pin-close`

> ⚠️ **第十六轮定论：`.vista-close-btn` 的正确做法是「矢量化 + 容器委托」。**
>
> 它在 `markKeepAlive` 名单里时 → 不矢量化 → 露出原始 PNG（"返祖"）；
> 移出名单后 → 被换成 `<svg>` → 外观对了，但**直接监听死了，按钮按不动**。
> 两次都是同一个根因的两个面。
>
> **最终方案：让它照常被矢量化**（外观交给 `#i-close-dot` 符号，红圆点 + hover 浮出 ×，
> 颜色走 `--xxt-dot` / `--xxt-dot-x` —— 与侧栏 `.sidebar-close-btn` **同一套**），
> **点击改由容器上的事件委托兜底**：
>
> ```js
> // js/index.js —— 三处 dialog 各一份
> dialog.addEventListener('click', function (e) {
>     var t = e.target;
>     if (t && t.closest && t.closest('.vista-close-btn')) hideDialog();
> });
> ```
>
> 另外两处不在 `index.js` 里，别漏：
> `support/notes/index.html`（内联脚本，`noteDialog` 委托）、
> `js/theme-picker.js`（运行时建按钮，`dialog` 委托）。
>
> ❌ **不要**在 `.vista-close-btn` 上写 `background` / `::before` / `::after` 自己画圆：
> 符号已经画了一个，会叠成两个；`<img>` 的 `::before` 还会吞点击。
> ❌ 也**不要**写 `object-position: -9999px` 藏 PNG —— 一旦矢量化失败（sprite 没加载），
> 整枚按钮就彻底消失了。

如果某处确实需要脚本自己升级图标（如文章页的 `image-viewer.js`），
优先用**事件委托**挂在父容器上，与节点是否被替换无关。

### 10. 两个图标塞进一个 `<svg>`：id 要自己带，打底和顺序都不能错

`#play-img` 要切「播放/暂停」，矢量没法换 `src`，所以两枚 `<use>` 一起塞。

**① 换出来的 `<svg>` 必须自己 `setAttribute('id', 'play-img')`。**
它是 `createElementNS` 新建的节点，不会继承 `<img>` 的 id，而下面四条规则**全部**
挂在 `svg#play-img use.xxx` 上 —— 少这一行，四条一条都不命中，**两枚图标直接叠一起**。
（第七轮真凶。当时的 `test-play-cascade.js` 只模拟了 CSS 层叠、把宿主 id 写死在测试里，
所以一直是绿的；现在它改成从 `modern-sticker.js` 源码里读 id，漏写立刻红。）

**② 打底规则的特异性要抬到 `(0,1,1)`。**
全局 `.xxt-ic { display: inline-block }` 是 `(0,1,0)` 且在文件更靠后，
隐藏规则若也只写 `(0,1,0)` 会被它盖掉 —— **两个图标同时画出来叠在一起**。
所以写 `svg#play-img use.xxt-play-icon { display: none }`。

**③ 三条规则的顺序必须严格是**（第 2 条若被写到第 1 条之前，或之后又冒出一条同特异性的
play 规则，就会把第 1 条的 `display:none` 掀掉，**两枚图标又叠一起** —— 第三轮栽在这）：

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

### 16. 对话框的出入场动画：只能走 `display` 的离散补间

站点的对话框**全部**靠行内 `style.display = 'block' | 'none'` 开关
（`index.js`、`theme-picker.js`、`uac.js`、`support/notes`），切的是 `display` 不是 class ——
所以文章页图片查看器那套「挂 `animation` + `.closing` 类」在这里用不了：
`display:none` 一写上元素立刻离开渲染树，动画根本没机会播。

`modern-sticker.css` 第 9b 节的解法（纯 CSS，不用 JS 参与，也就没有"延迟隐藏"的时序问题）：

| 方向 | 靠什么 |
|---|---|
| 离场 | `[style*="display:none"]`（**两种序列化都要写**，见下）给出关闭态值 + `transition-behavior: allow-discrete` 让 `display` 最后一步才变 `none` |
| 入场 | `@starting-style` —— 元素从 `display:none` 回到渲染树时它生效 |

三个必须记住的点：

1. **属性选择器要写两遍**：HTML 里手写的是 `display:none`，而
   `el.style.display = 'none'` 赋值后浏览器会**重新序列化成 `display: none;`**。
   只写其中一种，JS 关掉的那些对话框就不生效。
2. **`allow-discrete` 必须写成 longhand、且排在 `transition` 简写之后。**
   塞进简写里的话，不认这个值的旧浏览器会把**整条 `transition` 声明**丢掉 ——
   连 `.window` 原有的 `transform` / `box-shadow` 补间都没了。
   现在这样写，旧浏览器只丢一行，其余照常，动效退化成"立刻显示/立刻消失"= 改动前行为。
3. **动效只能用独立的 `translate` / `scale` 属性，不能碰 `transform`**：
   `#settingsDialog` / `#guestbookDialog` 的居中位移是**行内** `transform: translate(-50%,-50%)`，
   行内声明压得住本文件里的任何 `transform`。独立属性与它是叠加关系，才动得起来。

> 已覆盖：`.vista-dialog`（控制面板 / 留言本 / 风格引导 / 便笺）、`#customizePanel`、
> `#dialogOverlay`、`#noteDialogOverlay`、`.xxt-picker-overlay`（入场）。
> UAC 弹窗自带 `uacModalIn`（在 `uac.js` 里），不重复处理。
> 风格引导与 UAC 的**离场**是整块 `removeChild`，补间不了 —— 属已知限制。

### 17. 响应式断点：1240 / 1000 / 620 / 480

`modern-sticker.css` 第 15 节，**必须从大到小排列**（后写的会盖掉前面的）。

两个容易漏的：

- **网格下限要套 `min()`**：`repeat(auto-fill, minmax(min(300px, 100%), 1fr))`。
  直接写 `minmax(300px, 1fr)`，屏宽不足 300px 时整块横向溢出。
- **顶栏搜索框在 1000 断点必须回到文档流**（`position: static; width: 100%`）。
  它平时绝对定位贴在右侧；单栏后导航要换行，`top:50%` 会把它甩到两三行导航中间压住链接。

对话框宽度的兜底写 `.vista-dialog { max-width: calc(100vw - 24px) }` 即可 ——
`#settingsDialog` 的 `width:300px` 在**行内**，但 `max-width` 不在，所以能直接压住，不用 `!important`。

---

### 18. 页面自带的 `<style>` 排在主题之后 —— 同特异性 = 页面赢

`support/chomowan` 的 head 是 `link#themeCss` → `js/theme-loader.js` → 一坨 `<style>`。
`theme-loader.js` 只改写那个 `<link>` 的 `href`（不新建节点），所以**页面那段 `<style>`
永远排在主题 CSS 之后**。CSS 层叠看的是样式表在文档里的顺序，不是加载完成的先后 ——
于是**同特异性的规则一律是页面赢**。

坑就出在这里：`modern-sticker.css` 的 14c 里原本有一条 `.aero-radar-legend .chip`，
想把手账风格盖到那页的 Aero 玻璃图例上；页面自己的选择器**一模一样**（都是 `(0,2,0)`），
页面又在后面 —— 这条规则从写下那天起就没生效过，chip 一直是 Aero 蓝。
而静态审计只断言"规则存在"，所以一路绿灯（第八轮才发现）。

**给这类页面（chomowan / manga / 其它 `support/*`）写覆盖时：**

| 对方怎么写 | 你要怎么压 |
|---|---|
| 页面 `<style>` 用 `#id` | 用 `.main > canvas#id` 这种带父级的写法抬到 `(1,1,1)` |
| 页面 `<style>` 用 `.class` | 用页面里的 `#id` 做前缀（如 `#mowanRadarLegend .chip`） |
| 元素**行内** `style="…"` | 只能 `!important`（行内声明压得过任何普通样式表规则） |

`#manga-reader` 这类行内写了 `background:none` / `border:none` / `box-shadow:…` 的，
一律 `!important`；而**页面没写过的属性**（如 `flex-wrap`、`border-radius`）正常写就行，
别滥用 `!important` —— 有一条 `gap` 简写的坑：行内 `gap:12px` 会连 `row-gap` 一起锁死，
stylesheet 里再写 `row-gap` 是压不住的。

> 验证不能只查"规则在不在"：`.workbuddy/tmp/test-round8.js` 会解析两侧样式表 +
> 行内声明，做真·层叠求解（特异性 → 源序 → `!important`），逐条判定"这处覆盖真的赢了吗"。
> **新增对 `support/*` 页面的覆盖时,照抄这套判法。**

**已经确认的三个实例（都是同一个根因）：**

| 页面 | 排在主题之后的是什么 | 压法 |
|---|---|---|
| `support/chomowan` | 页面自己的 `<style>`（现已抽成 `chomowan.css`） | `#mowanRadarLegend .chip` (1,1,0) |
| `medias.html` | `media/medias.js` **运行时注入**的 `#xxt-media-stats-css` | `#mediaStats li a` (1,0,2) |
| `media/player.html` | 整份 `media/style.css`（head 里排在主题之后） | `body:has(.video-container) …` (0,2,1) |

`media/player.html` 那招值得学：**.video-container 全站只出现在播放页**，
所以用 `body:has(.video-container) .titlebar` 既把特异性顶到 (0,2,1)，又天然只作用于那一页，
不必给每一页都写一遍同值规则。`:has()` 不支持时整块跳过、页面保持原样，属安全降级。

> ⚠️ **抬了特异性，别忘了响应式那几块也要跟着抬。**
> 7b 节把封面写成 `#videoList .video-thumb { width: 168px }`（1,1,0），
> 而 620 断点里原来那条 `.video-thumb { width: 100% }` 只有 (0,1,0) ——
> 窄屏"封面占满一行"当场失效。**基规则抬了特异性，媒体查询里同名规则必须一起抬**，
> `.workbuddy/tmp/test-round10.js` 里专门有一条断言盯这个。

### 19. canvas 里的「样式」不在 CSS 里 —— 图表换主题要走配色表

`<canvas>` 内部的颜色、字体、线宽全都是 JS 的绘制指令，CSS 一条也够不到
（能改的只有画布这个盒子的尺寸/边框/底纹）。所以「把图表做成新主题的样子」
= 改绘制代码。

`support/chomowan` 的两张图（故事线 gitgraph + 成员能力雷达图）第九轮做过这件事，
约定如下，以后加图照抄：

| 位置 | 干什么 |
|---|---|
| `support/chomowan/charts.js` | 两张图的绘制代码（原来内联在 HTML 里，第九轮抽出来） |
| `support/chomowan/chomowan.css` | 画布盒子 + 图例 chip 的页面自有样式（也抽出来了） |
| 文件顶部 `VISTA` / `STICKER` | 两套配色，`var PAL = IS_STICKER ? STICKER : VISTA` |

四条硬规矩：

1. **`VISTA` 里的色值必须是原代码里抄下来的、一个都不改** —— 默认主题零影响。
   验证靠 `test-round9.js`：它把 `git HEAD` 版的内联脚本抓出来，比对
   `ctx.*` 调用集合、非字符串数字常量、以及全部颜色字面量，确认"一条不丢"。
2. **`STICKER` 的颜色全部走 `tok('--ink', '#…')`**（读主题 `:root` 令牌，带同值 fallback），
   这样以后主题调色，图表跟着走，不会两处各说各话。**别在 STICKER 里硬写颜色。**
3. **字体也要分两套栈**：`family`（中文优先，给中文标题）与 `familyLatin`（拉丁优先，给日期/链接）。
   默认主题原来就是两套，合成一套会悄悄换掉数字的字形。
4. **判定主题读 `#themeCss` 的 href**（`theme-loader.js` 在 head 里就改好了，body 末尾的脚本读到的一定是当前主题），
   别读 `localStorage.theme` —— 预览中的主题不会写回 localStorage。

> 抽文件时最怕的是"手抄错一个标题/漏搬一个颜色"，这两种错页面都不报错。
> `test-round9.js` 就是为它写的：`story` 数组逐字符比对、`members` 的名字与数值比对、
> 原有色值/API/数字常量全覆盖，另外还查"story 里的站内链接是否真实存在"。
>
> ⚠️ 页面的 `<style>` 换成外部 `<link>` 时，**`<link>` 的位置不能动**：
> 它必须仍在主题 link 之后，否则 14c 里那几条带 `#mowanRadarLegend` 前缀的覆盖
> 会失去前提（见坑 18）。
>
> 已知未做：两张画布都是固定 620 逻辑宽（靠 CSS 缩放到容器），**手机上字会跟着一起缩**。
> 要真适配得把 `W` 改成按容器宽度算，并把标题/链接也加换行 —— 属于重排，不是换皮。

---

### 20. 图标是 `background-image` 画的那些元素：只能靠主题脚本注入 `<use>`

`js/modern-sticker.js` 的图标机制是「把 `<img>` 换成 `<svg><use>`」——
它够不到**压根没有 `<img>`、图标靠 CSS `background-image` 画**的元素。
媒体库就有两处：列表页封面上的播放角标（`.play-icon` / `.flash-play-icon`，空 `div`）、
播放页控件条的按钮（`#video-player .control-button`，背景图是 `media/assets/*.png`）。

做法（见 `js/modern-sticker.js` 第 5b 节）：

- 主题脚本直接把 `<svg><use href="#i-…">` **塞进**这些元素，图标取自同一份精灵表；
- **有状态的按钮把两枚图标都塞进去**（播放/暂停、扬声器/静音、全屏/退出），
  由 CSS 按按钮当前的类放行其中一枚 —— 和 `#play-img` 同一套路，因此不用监听类变化；
- 注入的东西要在 `initThemeSync()` 里还原（`restoreMediaIcons()`），切回旧主题不留残余；
- 动态渲染的内容（`medias.js` 渲染的列表、`player.html` 渲染的控件）靠
  `initIcons()` 里那个 MutationObserver 补上（`scheduleMediaIcons()`）。

⚠️ **别在手绘 CSS 图标上纠缠。** 第十轮先手搓了一套三角/双条/喇叭/叉/对角括号，
被站长一句"看着怪怪的，用现成的图标库"打回 —— 这个站的"现成图标库"就是
`js/modern-sticker-icons.js`（Phosphor + Simple Icons，本地化、无 CDN）。缺图标就补进精灵表：

```bash
node .workbuddy/tmp/gen-icons.js .workbuddy/tmp/icons-new.js   # 先输出到临时文件
node .workbuddy/tmp/cmp-icons.js                                # 比对:只允许精灵表那行变、且是纯追加
cp .workbuddy/tmp/icons-new.js js/modern-sticker-icons.js       # 确认无误再覆盖
```

`gen-icons.js` 里的 `EXTRA_PHOSPHOR` 是「没有对应 PNG、只进精灵表不进映射表」的图标
（播放器控件要的 `speaker-slash` / `arrows-out` / `arrows-in` 就是这么加的）。
**重跑生成器有漂移风险**（Simple Icons 用的是 `@latest`），所以 `cmp-icons.js` 会比
「已有符号内容有没有变」「映射表有没有动」—— 别跳过它直接覆盖。

> 三个配套断言（`test-round10.js`）：**脚本里引用的每个 `#i-xxx` 都必须在精灵表里存在**
> （拼错一个就是"图标不显示"而页面不报错）；**`XXT_ICON_MAP` 相对上一版只能有登记过的改动**
> （那是 `<img>` 替换的命根子，加符号不该动它 —— 有意的改动写进 `MAP_CHANGES` 白名单，
> 别让"与上一版一致"变成"谁都不敢改映射"）。

### 21. 「两边都以为对方会做」= 谁都没做

**症状 A：文章页图片查看器的关闭 / 左右键一直是原始 PNG。**

`articles/modern-sticker-article.js` 的 `ICON_SELECTOR` 把这三个键 `:not()` 掉了，
理由是"`image-viewer.js` 自己会换图标"；而 `image-viewer.js` 那套 `upgradeThemeIcons()`
确实存在 —— 但它只在 `window.XXT_ICON_MAP` **已经存在**时才动手，
而精灵表是主题脚本那一刻才开始 `<script>` 加载的：

```
DOMContentLoaded
  ├─ image-viewer.js  init()      → 建弹层 → upgradeThemeIcons() → XXT_ICON_MAP 还不存在 → 静默跳过
  └─ 主题脚本 boot()  → loadSprite() → 精灵到位 → run()
                                        └─ swapIcons() 把这三个键 :not() 掉了 → 也不管
```

两边都写了替换代码，两边都没生效，**页面零报错**。

**判据（以后排除图标前只问这一句）：这个元素被换成 `<svg>` 之后，点击还有效吗？**

- 事件**直接绑在元素实例**上、且没人会重绑 → 必须排除（`.uac-close-btn` 是唯一一个）
- 走**事件委托**（挂在父容器上）→ 换掉没事，**不该排除**
  （图片查看器的关闭/翻页挂在 `modal` 上；`.vista-close-btn` / `.sidebar-close-btn` 同理）

现在三个键交给文章页脚本（它有"精灵加载完 → `run()`"+"MutationObserver"双保险，
弹层无论早于还是晚于精灵出现都能覆盖），`image-viewer.js` 那套保留作幂等兜底。

**症状 B：UAC 的盾牌图标在白底上看不见。**

`js/uac.js` 里手账覆盖块只改了 `.uac-banner` 的 `background`、**没声明 `color`**，
而它上面那套 Vista 基线写的是 `.uac-banner{...color:#fff}`（深蓝渐变配白字）。
两条选择器完全同特异性 → 覆盖块在后，但**没声明就压不住**，实际 `color` 仍是 `#fff`；
矢量化后的 `<svg class="xxt-ic">` 走 `fill: currentColor`，于是白盾牌压在 `#FFFBEA` 便签上
（对比度 1.04:1，等于看不见）。

> 通则：**换底色的覆盖块，记得把字色/图标色一起声明**。`fill: currentColor` 的图标
> 颜色完全来自继承，查样式时"这枚图标为什么是白的"要看的是**祖先的 `color`**，
> 不是图标自己的规则。
> 量化的判据写进了 `test-round11.js`：算 WCAG 对比度，图标类元素要 ≥ 3:1
> （现在用的 `#B07400` 是 3.79:1，白色只有 1.04:1）。

顺便：`imageclose.png` 的映射原本是 `i-x`（普通叉），但 `articles/modern-sticker-article.css`
里早就写了 `--xxt-dot` / `--xxt-dot-x` —— **那两个变量只有 `close-dot` 这个 symbol 会读**，
所以映射改成 `i-close-dot` 后，站内三处关闭键（对话框 / 侧栏 / 图片查看器）才真正是同一枚。
`i-x` 因此没人引用了，已从精灵表删除；`swapToolbarClose()` 的兜底也从 `#i-x` 改成 `#i-close-dot`
（原来它和主路径给的图标不一致，CSS 里那条 `.button:hover .xxt-ic[data-icon="close-dot"]`
的 hover 白叉永远不出现）。

### 22. 三个「不报错但做不成」的写法（第十三轮）

**① `<img>` 是替换元素，`::before` / `::after` 根本不渲染。**

给正文图挂胶带、挂角标、挂任何装饰，都挂不到 `<img>` 自己身上。
背景层也不行 —— `background` 永远画在内容**下面**，胶带会被照片压住。
要挂东西只能**包一层**（`articles/modern-sticker-article.js` 的 `buildPolaroids()`
包了个 `<span class="xxt-photo">`，白框和 `::before` 胶带都挂在框上）。

配套两条：

- **倾倒用独立的 `rotate` 属性，别写进 `transform`** —— 否则和 `:hover` 的
  `translateY` 互相覆盖（同一条 `transform` 只能有一个值）。
  独立的 `translate` / `rotate` / `scale` 三者与 `transform` 是**叠加**的。
- 包装函数必须**幂等**：`article-theme-loader.js` 在文章页被引入了两次
  （head 一次、body 结尾一次），配套脚本会执行两遍。

**② 只按后缀挑元素，会把「名字撞车的截图」当图标换掉。**

`articles/assets/warning.png` 是一张 **1920×1080 的截图**（`alt="截图"`），
文件名却正好是图标表里的 `warning.png`。选择器原来写的是 `img[src$=".png"]`，
于是这张截图被静默换成 16px 的警告小图标，**页面零报错**。

现在文章页的选择器是：

```js
'img[width][src$=".png"]:not(.uac-close-btn), ' +
'img[width][src$=".gif"]:not(.uac-close-btn), ' +
'img[src*="images/icons/"]:not(.uac-close-btn)'
```

- `[width]` 是闸门：文章里的真图标全都带 `width`（16 / 20）
- `images/icons/` 那一支是必要的例外：`wefuckedsalt` 的 tips 里那枚
  `knowledges.png` 没写 `width`，只在 icons 目录下
- 全站实测：候选 243，老选择器会收 243，新的只收 180 —— 63 张截图不再被误收

> 断言这类"过滤器"时，**匹配规则要从选择器字符串本身推出来**，
> 不能把规则在测试里再抄一遍 —— 抄一遍的话，选择器哪天把 `[width]` 丢了，
> 测试还是照旧全绿。另外补一条空转守卫：新选择器必须**仍然收得到 ≥150 个**
> 真图标，否则"没有截图被误收"是白测。

**③ 下层的装饰被"实色填充"盖住时，改填充，不要抬层级。**

侧栏小窗口右下角压着一枚图标底纹（`.xxt-win-mark`），而它必须在**正文下面**
（`z-index: -1`）—— 所以列表项、进度条轨道这些**不能用实色打底**，
否则整片盖住底纹。做法是新增半透明薄纱令牌：

```css
--veil-1:    rgba(61, 58, 56, .045);    /* 列表 hover */
--veil-2:    rgba(61, 58, 56, .07);     /* 凹槽（进度条轨道） */
--veil-warm: rgba(255, 221, 122, .38);  /* 正在播放 / 选中 */
```

**这是个跨两条规则的约定**（一边写 `z-index:-1`，另一边不许用实色），
`test-round12.js` 会把两侧都断言上。

### 23. giscus 是**另一份文档**：父页面的 CSS 一条都进不去

评论区跑在 giscus.app 的 iframe 里。所以：

- **换装只能靠 `data-theme`** 指向一份 giscus 读得懂的 CSS。两份：
  `css/giscus-theme.css`（默认主题，**别动**）· `css/giscus-sticker-theme.css`（手账）。
  分流在 `js/giscus-loader.js`（读 `localStorage['theme']`，与 `js/uac.js` 同一套判定）。
- **主题地址必须是绝对 https URL**，而且**本地预览永远看不到效果**：
  giscus 是在 giscus.app 那个 iframe 里去取这份 CSS 的 —— 相对路径会解析到 giscus.app，
  指到 `http://localhost` 会被当混合内容拦掉。**改完 giscus 主题必须部署 + 刷新才算数。**
- **跨文档同值**：iframe 里的主题色读不到父页面的变量，只能写死。所以
  `--color-canvas-default` 必须 **逐字符等于** 父页面给 iframe 铺的底色（手账里都是
  `#F9F0DC`，即 `--paper-leaf`），`--color-fg-default` / `--color-border-default` 同理。
  写岔了 iframe 圆角处会露出一圈别的颜色。`test-round14.js` 比对这三对。
- **变量名用 GitHub Primer 的原名**（`--color-canvas-default` / `--color-fg-default` /
  `--color-border-default` / `--color-btn-*` …）。老文件里那族
  `--color-bg-primary` / `--color-text-primary` / `--color-border-primary` giscus
  **根本不读**，写了等于白写（那些规则能生效纯粹是靠文件末尾的显式选择器）。
- **外框别用真 `border`**：iframe 的 `height` 是 giscus 按内容量算好写进行内的。
  `content-box` 下 `width:100%` + 2px 边框 = 横向溢出 2px；`border-box` 又会把底部内容切掉 2px。
  用 `box-shadow: 0 0 0 1px var(--rule)` 那圈**不出现在布局里**的环。

> 顺带记一下手账主题现在的**纸色层级**（写新组件时按这个排队，别越级）：
>
> ```
> 页面背景 --paper        #FFFCF3   252.0
> 提示条 / 标题栏 --paper-2 #FBF5E4   245.0
> 正文卡 / 评论区 --paper-leaf #F9F0DC  240.5   ← 第十四轮新增
> 行内 code / 凹槽 --paper-3 #F5EDD7   237.1
> 相纸 / 代码块 #FFFFFF              255
> ```
>
> `--paper-leaf` 刻意夹在 `--paper-2` 与 `--paper-3` 中间：正文那一层要比页面深
> （不然看不出层级，拍立得的白框也糊在纸里），但又不能深到和 code 撞车。

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

### 写验证脚本时注意行尾（坑过一次）

仓库是 `core.autocrlf=true`，**工作区里的文件是 CRLF**（`style.css`、`index.html`、
`js/index.js`、`media/style.css` 全是；只有用写入工具新建的文件才是 LF）。
于是断言里但凡写了 `'\n}'` / `'a,\nb'` 这种 pattern，在 CRLF 文件上**静默匹配不到** ——
`if (hit >= 0) { …一堆 check… }` 整段被跳过，测试照样报绿。
（第十轮就中过：`indexOf('@media … 620px')` 之后找 `'\n}\n'` 拿到 -1，
那几条断言其实一条都没跑。）

**规矩：测试里的 `read()` 一律带 `.replace(/\r\n/g, '\n')`。**
另外 Python 的文本模式 `open(..., 'w')` 在 Windows 上会把整份文件 LF→CRLF，
用它批量改过 CSS/JS 之后记得确认一遍行尾没被整体翻掉（提交不受影响，autocrlf 会归一，
但**读文件的测试脚本会当场失效**）。

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
