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
