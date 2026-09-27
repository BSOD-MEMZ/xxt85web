# 主题系统

## 一句话

主题就是**运行时切换的一个 CSS 文件**。同一时刻只加载一份，所以每份主题 CSS 必须自包含全站样式——不存在「基础样式 + 覆盖层」这种玩法。

---

## 机制

顶层页挂的是这一段（**注意 `<link>` 不是写死在 HTML 里的**）：

```html
<script>
    (function () {
        var css = 'style.css';
        try {
            var t = localStorage.getItem('theme') || '';
            if (/^[A-Za-z0-9._-]+\.css$/.test(t)) css = t;
        } catch (err) { /* 隐私模式读不到:按默认走 */ }
        document.write('<link rel="stylesheet" type="text/css" id="themeCss" href="' + css + '">');
    })();
</script>
<script src="js/theme-loader.js"></script>
```

那段内联脚本决定**首屏用哪一份**，`js/theme-loader.js`（所有页面共用）做另外三件事：

```js
// 0. 兜底:若页面里那份 <link> 的地址和该用的主题不一致(比如某页漏了上面那段脚本),
//    才改写 href —— **先比再改**,无条件改会把已经正确的表拆掉重挂,又是一次闪烁
link.href = rootPath + (localStorage['theme'] || 'style.css');

// 1. 若主题名匹配 modern-*.css，额外加载同名 js/modern-*.js
//    （默认主题不匹配，行为与改动前完全一致）

// 2. 首次访问且未选择过时，加载 js/theme-picker.js 弹出风格引导
```

> **为什么首屏那一次要放在 HTML 里、而不是等脚本改 href**：
> 写死 `<link href="style.css">` 的话，浏览器会**立刻**去取默认主题（连它引用的
> `background.jpg` / `bar.png` 一起），再等 loader 下载完才改地址；而改地址会先丢掉
> 旧表 —— 于是**无样式 → 默认主题 → 用户主题**闪三下，资源还白下载一遍。
> 完整说明（含"为什么必须用 `document.write`""相对前缀怎么算")见 **AGENTS.md 坑 25**。

样式表地址由脚本推导，兼容 `file://` 与 `http(s)://`——用的是 `document.currentScript.src`，所以 **`theme-loader.js` 的路径不能挪**。

### 文章页那份不一样

文章页有自己的内联脚本（在 `<link>` 位置之前，把 `style.css` 换成
`modern-<x>-article.css` 或 `zuowen-style.css`），映射与
`articles/article-theme-loader.js` 的 `ARTICLE_THEME_MAP` **必须一致**。
顶层页加主题不用改 HTML（脚本只读文件名），**文章页要改那 47 份内联脚本** ——
`test-round16.js` 会逐页扫、比对，漏改一页就报红。

---

## 主题清单

| 文件 | 说明 | 行数 | 配套脚本 |
|---|---|---|---|
| `style.css` | **默认**。Vista / Frutiger Aero 拟物风 | ~1650 | — |
| `xpstyle.css` | XP 经典 | ~1000 | — |
| `modern-sticker.css` | 手账 Sticker Book | ~2900 | `js/modern-sticker.js`<br>`js/modern-sticker-icons.js` |

清单本体在 `js/index.js` 的 `themes` 数组（约 1010 行）。

---

## 新增一个主题

1. **写一份自包含的 CSS。** 参考 `style.css` 的覆盖范围，缺一个组件就会在对应页面露馅：

   `.titlebar` / `.navbar` / `.content` / `.main` / `.sidebar` / `.window` / `.window-titlebar` / `.window-content` / `.footer` / `.tips` / `.article-list` / `.preview-box` / `.search-*` / `.download-card` / `.video-item` / `.pagination` / `.vista-dialog` / `.vista-btn` / `.customize-panel` / `.uac-*` / `.wmp-*` / `.upload-*` / 复选框 / 进度条 / 滚动条

2. **在 `js/index.js` 的 `themes` 数组里加一项。**

3. **（可选）需要改 DOM 就写配套脚本**，命名 `modern-<name>.js`，`theme-loader.js` 会自动加载。

4. **（可选）giscus 评论区也要跟着换** —— 见下一节。不做也不会出错，评论区只是继续用默认那份主题。

**零 HTML 修改。**

---

## giscus 评论区：父页面管不着它

评论区跑在 **giscus.app 的 iframe** 里，父页面的 CSS 一条也进不去。
所以给评论区换装只能走 `data-theme`，让 giscus 自己去取一份它能读懂的 CSS：

| 文件 | 谁在用 |
|---|---|
| `css/giscus-theme.css` | 默认主题（Vista / Aero 蓝）。**原样保留，别动** |
| `css/giscus-sticker-theme.css` | 手账主题（内页米黄 + 墨色 + 珊瑚/青） |

分流在 `js/giscus-loader.js`：读 `localStorage['theme']`，命中 `modern-sticker` 就用后者
（与 `js/uac.js` 的 `IS_STICKER` 同一套判定）。

三个必须知道的事实：

- **主题地址必须是绝对 https URL。** giscus 是在 giscus.app 那个 iframe 里取这份 CSS 的：
  相对路径会解析到 giscus.app 上，指到 `http://localhost` 则会被浏览器当混合内容拦掉。
  → **本地预览看不到 giscus 的新主题，得部署之后刷新才算数**。这是链路的固有限制。
- **颜色只能写死**，不能用父页面的 CSS 变量。所以 `css/giscus-sticker-theme.css` 里的
  `#F9F0DC`（`--color-canvas-default`）、`#3D3A38`（`--color-fg-default`）、
  `#EADFC4`（`--color-border-default`）必须分别等于主题的 `--paper-leaf` / `--ink` / `--rule`，
  否则 iframe 圆角处会露出一圈别的颜色。`test-round14.js` 会比对。
- **变量名要用 GitHub Primer 的原名**（`--color-canvas-default` / `--color-fg-default` /
  `--color-border-default` …）。老那份文件里写的 `--color-bg-primary` / `--color-text-primary`
  / `--color-border-primary` 那一族 giscus **根本不读**，等于白写 —— 那些规则能生效
  纯粹是靠文件末尾的显式选择器。新增主题时别再走那条路。

另外，容器（`.giscus`）本身在主题 CSS 里管：文章页把外框挂在 **iframe** 上
（描边用 `box-shadow` 的 1px 环，不用真 `border` —— iframe 的 height 是 giscus 算好写进行内的，
`border` 会让 `width:100%` 横向溢出 2px，而 `border-box` 又会把底部内容切掉 2px）。

---

## 主题切换的两条路径

### 路径一：个性化面板（`cycleTheme()`）

`js/index.js` 约 1140 行，循环切换 `themes` 数组并写 `localStorage`。**不刷新页面。**

这意味着切回旧主题时，被脚本改过的 DOM 仍然存在——所以每个 DOM 注入都**必须实现还原**。

### 路径二：首次访问引导（`theme-picker`）

点确定后写入 `theme` 与 `xxt-theme-picked`，然后 `location.reload()`。

这里刷新是必要的：有些脚本只会加载一次，刷新才能让新主题从头完整跑一遍。

---

## DOM 注入与还原一览

| 注入者 | 注入内容 | 还原方式 |
|---|---|---|
| `modern-sticker.js` | 图标 `<img>` → `<svg>` | `restoreIcons()`，切回时换回原 `<img>` |
| `modern-sticker.js` | 文章列表 → 卡片 | `restoreCards()`，写回保存的原 `innerHTML` |
| `modern-sticker.js` | 顶栏搜索框 | `searchBox.style.display = 'none'` |
| `modern-sticker.js` | 背景装饰层 | `removeDeco()` 移除节点 |
| `modern-sticker.js` | 侧栏提示条 | `removeInfobar()` |
| `modern-sticker.js` | 侧栏删除动画的状态类 | `sync()` 里清掉 `.xxt-removing` / `.xxt-restoring` |
| `modern-sticker.js` | 唱片封面的行内 `transform`（旋转角） | `discReset()` 摘掉行内 style + 归零角度 |
| `modern-sticker.js` | 侧栏窗口的图标印记（`<svg class="xxt-win-mark">`） | `restoreWindowMarks()` 移除节点 |
| `modern-sticker.js` | 导航栏访问键提示「首页(H)」去掉括号 | `restoreNavAccessKeys()` 把原文本逐字写回 |
| `modern-sticker.js` | 看板娘工具图标（`live2d-widget/dist/assets/*.png` → `<svg>`） | 与图标同一套 `restoreIcons()` |
| `modern-sticker.js` | 看板娘"本来没图标"处的补图标（媒体库角标 / 播放控件） | `restoreMediaIcons()` 移除节点 |

统一监听 `#themeCss` 的 `href` 变化来判断是否切走：

```js
new MutationObserver(sync).observe(link, { attributes: true, attributeFilter: ['href'] });
```

**新增任何注入，都要在这个 `sync()` 里补上还原分支。**
特别注意**写进行内样式**的注入（如封面的 `style.transform`）——
切回旧主题时不会自动消失，必须显式清掉。

### 图标替换的通用保护：`data-xxt-keep`（名单必须尽量小）

`addEventListener` 绑在元素实例上，把 `<img>` 换成 `<svg>` 会连事件一起丢掉。
先后踩过四次（UAC 关闭、图片预览关闭/翻页、对话框关闭、侧栏关闭）。

```js
// js/modern-sticker.js
markKeepAlive()          // 给"必须保留 <img> 本体"的元素打 data-xxt-keep
ICON_SELECTOR            // 每个分支统一 :not([data-xxt-keep])
initIcons()              // markKeepAlive() 必须早于 swapIcons()
MutationObserver         // 每次回调重打一遍(幂等),覆盖动态弹窗
```

> ⚠️ **第五轮踩过：这份名单一网打尽就出事。**
> 当时把 `.vista-close-btn` / `.sidebar-close-btn` 也标了 → 它们不再被矢量化，
> 直接露出原始 PNG：首页小窗关闭键"返祖"，侧栏圆点整个消失
> （那套圆点是**矢量化后的 `i-close-dot`** 画的，不是 CSS 画的）。

**唯一判断标准：这个元素被换成 `<svg>` 之后，点击还有效吗？**

| 元素 | 换成 svg 后 | 结论 |
|---|---|---|
| `.sidebar-close-btn` | 委托在 sidebar 上 | 不标 |
| `.vista-close-btn` | 直接绑本体会丢 → **补上容器委托**后就没问题 | 不标（外观交给 `#i-close-dot`） |
| `.uac-close-btn` | `uac.js` 自建 `<svg>` 并重绑；src 是 `Window_CloseButton.png` 会被命中 | **标** |
| `.image-viewer-close` / `.image-viewer-nav` | 图片查看器**只出现在文章页**，顶层脚本本来也碰不到它们 | 标（这条在顶层名单里其实是死条目；文章页那边由 `modern-sticker-article.js` 矢量化，见下） |

当前名单：`.uac-close-btn` · `.image-viewer-close` · `.image-viewer-nav` ·
`.infobar-close` · `.xxt-copy-btn` · `.xxt-pin-close`

> ⚠️ **第十六轮定论：`.vista-close-btn` = 矢量化 + 容器委托，别自己画圆。**
>
> 它在名单里 → 露出原始 PNG（"返祖"）；移出名单 → 换成 `<svg>` 后**直接监听死了，按钮按不动**。
> 同一个根因的两个面，报过两次。
>
> **正解：照常矢量化**（外观 = sprite 的 `#i-close-dot` 符号，红圆点 + hover 浮出 ×，
> 颜色走 `--xxt-dot` / `--xxt-dot-x`，与侧栏完全同一套），
> **点击由容器上的委托兜底**：`closest('.vista-close-btn')`。
>
> 委托一共四处，别漏掉后两处（它们不在 `index.js` 里）：
> `js/index.js`（控制面板 / 留言本 / 欢迎框）、
> `support/notes/index.html`（内联脚本）、
> `js/theme-picker.js`（运行时建按钮）。
>
> ❌ 不要写 `background` / `::before` / `::after` —— 符号已经画了一个，会叠成两个圆；
> `<img>` 的 `::before` 还会吞点击。
> ❌ 不要写 `object-position: -9999px` —— sprite 没加载时整枚按钮会消失。

### 关闭键外观的单一来源

`.vista-close-btn` 与 `.sidebar-close-btn` **共用同一套变量**，只有这两条规则：

```css
.vista-close-btn          { --xxt-dot: #FF5F57; --xxt-dot-x: transparent; }
.vista-close-btn:hover    { --xxt-dot-x: rgba(0, 0, 0, .58); }
```

颜色实际由 `js/modern-sticker-icons.js` 里的 symbol 读取：

```svg
<symbol id="i-close-dot" viewBox="0 0 16 16">
  <circle cx="8" cy="8" r="7.6" fill="var(--xxt-dot, #FF5F57)"/>
  <path d="M5.6 5.6 L10.4 10.4 M10.4 5.6 L5.6 10.4"
        stroke="var(--xxt-dot-x, transparent)" stroke-width="1.7"
        stroke-linecap="round" fill="none"/>
</symbol>
```

> 为什么 symbol 里的 `fill="var(--xxt-dot)"` 不会被 `.xxt-ic { fill: currentColor }` 盖掉？
> 因为那条 CSS 作用在 `<svg>` 上、是**继承值**，而 `<circle>` 自带的表现属性
> 是作用在元素自身的声明 —— 自身声明永远赢过继承值。

改图标颜色时**只动这两条规则**，别去碰符号。

站内**三处**关闭键、**同一枚**符号，只有变量值各写一份：

| 谁 | 在哪 | 变量写在哪 |
|---|---|---|
| `.vista-close-btn` | 顶层页对话框（控制面板 / 留言本 / 欢迎框） | `modern-sticker.css` |
| `.sidebar-close-btn` | 侧栏窗口 | `modern-sticker.css` |
| `.image-viewer-close` | 文章页图片查看器（`imageclose.png` → `i-close-dot`） | `articles/modern-sticker-article.css` |

> ⚠️ 图片查看器那一枚**不能**再套纸底/描边：`.image-viewer-close` 身上原本有
> 共用的 `background: var(--paper); border: 1px solid var(--rule-2)`，
> 而符号画的是一个几乎铺满整框的红圆 —— 外圈会剩一圈纸色描边，看着像"圆环套圆点"。
> 所以 `svg.image-viewer-close` 里写了 `background: none; border: none`；
> **连带 `.image-viewer-close:hover` 里也不能写 `background`**：
> 它的特异性是 `(0,2,0)`，会盖过 `svg.image-viewer-close` 的 `(0,1,1)`，一 hover 就冒出白底。

### 播放键是个例外

`#play-img` 一个按钮要在「播放 / 暂停」两个图标间切换，而矢量图标没法换 `src`。
做法：`modern-sticker.js` 把 `#i-play` 与 `#i-pause` 两枚 symbol 一起塞进同一个 `<svg>`，
由 CSS 按 `.aero-player.is-playing` 决定显示哪一个。
`player.js` 里 `setPlayingUI()` 负责同步这个 class（旧主题下它仍然照旧换 `<img src>`）。

> ⚠️ **换出来的 `<svg>` 必须自己带上 `id="play-img"`。**
> 它是 `createElementNS` 新建的元素，不会继承 `<img>` 的 id；而下面四条规则
> 全部挂在 `svg#play-img use.xxx` 上 —— 少写这一行，四条一条都不命中，
> 表现就是**播放/暂停两个图标同时画出来叠在一起**。
> （第七轮的真凶。当时 `test-play-cascade.js` 是"通过"的，因为它把宿主的
> id 写死在测试里，只验证了 CSS 层叠、没验证 JS 真的产出了那个 id ——
> 现在测试改成从 `js/modern-sticker.js` 源码里读 id，漏写立刻报红。）
>
> ⚠️ **两枚 symbol 必须显式 `display: none` 打底**，再用状态类各放行一个。
> 隐藏规则要写成 `svg#play-img use.xxx`（特异性 `(0,1,1)`）——
> 全局 `.xxt-ic { display: inline-block }` 是 `(0,1,0)` 且在文件更靠后，
> 特异性不够就会被它盖掉，结果是**播放/暂停两个图标同时画出来叠在一起**。
>
> ⚠️ **顺序同样致命**：必须是「先全藏 → 再无条件放行 play → 最后用
> `.aero-player.is-playing` (`(0,2,2)`) 收回 play 放行 pause」。
> 若在「全藏」之后又出现一条同特异性的 play 规则，会把 `display:none` 掀掉，
> 两个图标再次重叠（第三轮就栽在这）。
> 判特异性别靠肉眼，跑 `.workbuddy/tmp/test-play-cascade.js`（自写层叠模拟器）。

### 唱片旋转：只能写行内 `transform`

封面旋转**不能**用 CSS `animation`：一暂停 `.playing` 被摘，animation 消失，
`transform` 立刻掉回 `0deg` —— 看着就是「啪」地弹回正位。
且 `animation` 在运行时会覆盖行内 `transform`，两者不能共存。

现实现（`modern-sticker.js` 的 `initDisc()`）：

```
play   → rAF 累加 angle(14s 一圈),写进行内 transform
pause  → cancelAnimationFrame,不重置 angle → 停在当前帧
loadstart(切歌) → angle = 0
切回默认主题   → discReset() 摘掉行内 transform
```

### UAC 的关闭按钮不要碰

`js/uac.js` 自己给那枚 `<img class="uac-close-btn">` 绑了点击事件。
文章页的图标替换若把它一并换掉，事件会连元素一起消失 ——
所以 `articles/modern-sticker-article.js` 的 `ICON_SELECTOR` 里显式排除了 `.uac-close-btn`，
矢量化改由 `uac.js` 的 `upgradeCloseBtn()` 自己完成。

### 图标替换会吃掉点击事件（通用坑）

→ 见上文 [「图标替换的通用保护：`data-xxt-keep`」](#图标替换的通用保护data-xxt-keep)。
一句话：**别再逐个加 `:not()`，把类名加进 `markKeepAlive()` 的候选表。**

若某处确实需要脚本自己升级图标（如文章页的 `image-viewer.js`），
优先用**事件委托**挂在父容器上，与节点是否被替换无关。

> ⚠️ **别拿"另一个脚本会做"当排除理由。** 第十一轮的实例：文章页的
> `ICON_SELECTOR` 把图片查看器的三个键 `:not()` 掉了，理由是 `image-viewer.js`
> 自己会升级 —— 但那个升级在 `window.XXT_ICON_MAP` 还不存在时**静默返回**
> （精灵表是主题脚本那一刻才 `<script>` 加载的），于是两边都没换，**页面零报错**。
>
> 排除前只问一句：**这个元素被换成 `<svg>` 之后，点击还有效吗？**
> 走委托的（查看器三个键、`.sidebar-close-btn`、`.vista-close-btn`）→ 不该排除；
> 只有事件**直接绑在元素实例**上的才排除（目前只有 `.uac-close-btn` 一处）。
>
> 给图标上色的注意点：`fill: currentColor` 的图标，颜色**完全来自继承** ——
> 覆盖样式块只改 `background` 不改 `color`，图标就会继承到父级（乃至基线里
> 那条 `color:#fff`）的颜色。UAC 的盾牌就这么在白底便签上白了一轮。

### chips（`.cat-btn`）里的图标一律不换

它们是配色装饰点，主题里已 `display: none`。替换成矢量只会多造无用节点，
而且 `data-icon` 的着色规则会和 chip 自身颜色打架 —— 所以 `ICON_SELECTOR` 里
用 `:not(.cat-btn *)` 排除。

### 外部样式表排在主题之后 —— 同特异性时**对方赢**

CSS 层叠看的是**文档顺序**，不是加载先后。主题 `<link id="themeCss">` 在 `<head>` 靠前，
所以凡是"排在它后面"的样式表，**只要特异性一样，就是它盖住主题**。
目前踩过三处（同一个坑的三个变种）：

| 谁 | 为什么排在后面 | 覆盖时怎么抬特异性 |
|---|---|---|
| `media/style.css` | `media/player.html` 在主题 link 之后又引了一份 | `body:has(.video-container) …`（↑ 到 `(0,2,1)`） |
| 页面自己的 `<style>` | 如 `support/chomowan`：link → script → style，那段 `<style>` 永远在最后 | `#mowanRadarLegend …`（↑ 到 `(1,1,0)`） |
| `live2d-widget/dist/waifu.css` | 由 `autoload.js` **运行时** append 到 `<head>` 末尾 | `#waifu …` / `html #waifu-toggle`（2 个 id 压 1 个） |

另有 **giscus** 那份（`css/giscus-*.css`）跑在 iframe 里，属于"另一份文档"，见上文。

> **规矩：给这类地方写覆盖，先问一句"它排在我前面还是后面"。**
> 判"到底谁赢"别靠肉眼 —— `test-round8.js` / `test-round10.js` / `test-round15.js`
> 都带**真·层叠求解器**（特异性 → 源序 → `!important`），会逐条判胜负。
> 反面教材：`modern-sticker.css` 14c 里那条 `.aero-radar-legend .chip`
> 因为特异性与页面一样、又排在前面，**从写下那天起就没生效过**。

### 无窗口包裹的页面（裸 `.main`）

多数页面的内容包在 `.window > .window-content` 里，主题规则针对这个结构写。
但有些页面 `.main` 下是**裸**的 `h2 / p / h3 / hr`，一条窗口规则都套不上：

- `support/chomowan/index.html`（雷达图 / 剧情图两段 canvas）
- `articles.html`（0 个 `.window`）

这类页面在 `modern-sticker.css` 里有专门一节 `14c` 兜底：

| 元素 | 问题 | 处理 |
|---|---|---|
| `hr` | **`style.css` 从未定义过 `hr`**，一直是浏览器默认的灰色凹线 | 改成主题的 `2px dashed` 接缝 |
| 裸 `.main > h3` | 没有窗口内那套四色轮换 | 左侧补一枚旋转 9° 的彩色小书签 |
| 裸 `.main > canvas` | 直接贴在白纸上，没有边界 | 给一张纸作底（纸色 + 描边 + 圆角 + 阴影） |
| 页面自带的内联 Aero 样式 | 如 chomowan 的 `.aero-radar-legend .chip` 蓝白玻璃渐变 | 用更高特异性在主题里改写（不改 HTML） |

**约定：这类页面不写入主题系统之外的处理，一律在 `modern-sticker.css` 里兜底，
不碰页面自己的 HTML。**

### UAC 在文章页也必须是手账样式

顶层页的 `.uac-*` 规则原本写在 `modern-sticker.css`，**但文章页不加载那份 CSS**
（只加载 `articles/modern-sticker-article.css`，里面没有任何 `.uac-*`），
所以文章页的 UAC 会掉回 `uac.js` 自己注入的 Vista 基线。

现在这份覆盖**整体搬到了 `js/uac.js`**（`id="uac-sticker-styles"`，仅在
`localStorage.theme` 命中 `modern-sticker` 时注入），顶层页 + 文章页共用一份，
也不受 CSS 加载顺序影响。改 UAC 外观请改 `uac.js`，别再往 `modern-sticker.css` 里加。

### LaTeX 公式

- 引擎：KaTeX 0.16.9，**已本地化**在 `vendor/katex/`（含 20 个 woff2）
- 入口：`articles/katex-loader.js`，文章页加一行 `<script src="katex-loader.js">` 即可
- 定界符：`$…$` / `\(…\)` 行内，`$$…$$` / `\[…\]` 独行
- **按需加载**：正文里没有定界符就一个字节都不取
- 不用 KaTeX 官方的 `auto-render`：它跳过不了 `<pre>`/`<code>`，
  技术文里命令行提示符、PHP 变量、正则里的 `$` 会被误当公式 ——
  本项目自己走 DOM 并跳过 `PRE/CODE/SCRIPT/STYLE/TEXTAREA/KBD/SAMP/NOSCRIPT`
- 包裹层 `.xxt-math-inline` / `.xxt-math-display`，两套文章页 CSS 各自排版

**改图标映射后要重跑生成器**：`node .workbuddy/tmp/gen-icons.js js/modern-sticker-icons.js`

---

## 配套脚本的加载规则

```
modern-sticker.css  →  js/modern-sticker.js   （theme-loader.js 自动派生）
```

规则在 `theme-loader.js` 里，正则 `/^(modern[a-z0-9-]*)\.css$/i`。不匹配的主题（`style.css` / `xpstyle.css`）走原路径，行为与改动前完全一致。

> 这是唯一能实现「主题带脚本」而不用改 15 个 HTML 的办法。

---

## 文章页主题（`articles/`）

**文章页不在主站的主题系统里。** 这是最容易搞错的一处，动之前先读完本节。

顶层页用 `js/theme-loader.js` + `link#themeCss`；文章页用的是 `articles/` 目录下另一套：

```
articles/article-theme-loader.js     文章页的主题加载器
articles/style.css                   文章页的默认样式（344 行，自包含）
articles/zuowen-style.css            「作文本」备选排版
articles/modern-sticker-article.css  手账主题的文章页样式
articles/modern-sticker-article.js   配套脚本（只做图标矢量化）
```

> 名字陷阱：文章页里那个 `<script src="article-theme-loader.js">` **不是** `js/theme-loader.js`。
> 用 grep 找 `theme-loader` 时两者都会命中，别据此断定文章页跟随主站主题——它不会。
> 文章页也不读 `#themeCss`，而是由 loader 改写 `<link>` 的 `href`。

### 两层优先级

`article-theme-loader.js` 按下面的顺序判断，前一层命中就 `return`：

| 顺序 | 依据 | 命中后 |
|---|---|---|
| 1 | `localStorage['theme']` 在 `ARTICLE_THEME_MAP` 里 | 把默认样式表的 href 换成文章页主题样式，并加载同名 `.js` |
| 2 | `localStorage['article_css'] === 'zuowen'` | 原有的「作文本」逻辑（禁用 + 注入），**一字未改** |
| 3 | 都不命中 | 什么都不做，保持 `articles/style.css` |

**默认主题（`style.css` / `xpstyle.css`）走的仍是原来的路径，行为与加入本机制前完全一致。**

### 给新主题加文章页支持

1. 在 `articles/` 下写 `modern-<name>-article.css`。
   **必须自包含**——文章页的 DOM 与顶层页毫无重合，顶层主题的规则一条也套不上。
   要覆盖的组件：`.header-image` / `.title-overlay` / `.gradient-divider` / `.button` /
   `.content-container` / `.author-info` / `.article-content`（全套正文标签）/ `.tips` /
   `.nbttree` / `.xxt-code-block` / `.code-container`（含 `td.gutter` / `td.code`）/
   `.hljs-*` / `.image-viewer-*`。
2. 在 `article-theme-loader.js` 的 `ARTICLE_THEME_MAP` 里登记一行。

没登记的主题不会误替换文章页样式，所以忘了登记的最坏后果是「文章页保持原样」，不是白屏。

### 图标

文章页的图标复用主站的 `js/modern-sticker-icons.js`。
**这不是额外开销**：用户在首页已经加载过同一个 URL，文章页再引用会命中浏览器缓存。
`modern-sticker-article.js` 只做注入 sprite + 替换 `<img>`，不引入主站的
`modern-sticker.js`——背景装饰、搜索框、卡片化那些是首页的东西，放进阅读页只会分散注意力。

图片查看器（`image-viewer.js` 运行时生成）与 UAC 对话框（`uac.js` 运行时生成）里的图标
都在 `DOMContentLoaded` 之后才出现，所以 `modern-sticker-article.js` 挂了一个
`MutationObserver` 兜底；首次 `swapIcons()` 同步执行，已经存在的图标也一并处理。

### 文章页的错误处理约定

`articles/image-viewer.js` 里有两处「不能靠元素属性表达状态」的地方：

- **复制按钮的三段反馈**：矢量图标无法换 `src`，所以按下后走
  `xxt-copy-shrink`（方框缩小消失）→ `xxt-copy-check`（绿勾用伪元素画）→ `xxt-copy-out` → 复位，
  用两段 `setTimeout` 串起来（不用 `animationend`，保持 IE 兼容）。
- **图片查看器的关闭动画**：`.closing` 类先播退场动画，靠 `animationend` + 320ms 兜底
  再真正隐藏；`_closing` 标记挡住连点与快速 ESC。
- **左右键的禁用态**：按钮被换成 `<svg>` 后 `.src` 赋值失效，改由 `setNavState()`
  切 `.is-disabled` 类（`<img>` 时仍回退到换图，保证旧主题不变）。

### 特例

`articles/4thanniversary.html` 自带完整内联样式与脚本、不挂任何 loader，主题机制不碰它。

---

## 首次访问引导（`theme-picker`）

**入口必须在 `theme-loader.js`，不能放进某个主题的脚本里。**
新用户首屏是默认主题，那时手账的脚本根本没加载，放进去就永远不会弹。

设计要点：

- 对话框外壳复用站点的 `.window.vista-dialog` / `.window-titlebar` / `.vista-btn` 类
  → 切主题时**对话框自身也跟着变**，用户看到的是整个页面当场切换
- 内部布局与两份骨架（内联 SVG）用独立的 `.xxt-picker-*` 内联样式表，不依赖任何主题 CSS
- 点骨架 → 改 `#themeCss` 的 `href` 即时预览；预览到 `modern-*` 主题时顺带拉起配套脚本
- 状态键：`xxt-theme-picked`（已选择）、`xxt-theme-never`（不再提醒）
- `?theme-picker=1` 强制弹出，便于调试

---

## 相关文档

- 手账主题的设计规范与实现技巧 → [`STICKER-BOOK.md`](STICKER-BOOK.md)
- 改样式前必读的坑 → [`../AGENTS.md`](../AGENTS.md) 的「已知的坑」
