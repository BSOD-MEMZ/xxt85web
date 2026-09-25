# 主题系统

## 一句话

主题就是**运行时切换的一个 CSS 文件**。同一时刻只加载一份，所以每份主题 CSS 必须自包含全站样式——不存在「基础样式 + 覆盖层」这种玩法。

---

## 机制

每个页面都挂了这两样东西，这是全站主题共享的基础：

```html
<link rel="stylesheet" href="style.css" type="text/css" id="themeCss" />
<script src="js/theme-loader.js"></script>
```

`js/theme-loader.js`（所有页面共用）做三件事：

```js
// 1. 读主题并按需改写样式表地址
link.href = rootPath + (localStorage['theme'] || 'style.css');

// 2. 若主题名匹配 modern-*.css，额外加载同名 js/modern-*.js
//    （默认主题不匹配，行为与改动前完全一致）

// 3. 首次访问且未选择过时，加载 js/theme-picker.js 弹出风格引导
```

样式表地址由脚本推导，兼容 `file://` 与 `http(s)://`——用的是 `document.currentScript.src`，所以 **`theme-loader.js` 的路径不能挪**。

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

**零 HTML 修改。**

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

统一监听 `#themeCss` 的 `href` 变化来判断是否切走：

```js
new MutationObserver(sync).observe(link, { attributes: true, attributeFilter: ['href'] });
```

**新增任何注入，都要在这个 `sync()` 里补上还原分支。**

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
