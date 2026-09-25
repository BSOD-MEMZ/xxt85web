/**
 * xxtsoft · 手账主题配套脚本 (Sticker Book)
 * ---------------------------------------------------------------------------
 * 仅在主题为 modern-sticker.css 时由 js/theme-loader.js 自动加载。
 * 默认主题(style.css / xpstyle.css)下此文件不会被请求。
 *
 * 职责:
 *   1. 贴纸抬起   —— 指针在卡片上移动时按相对位置做微倾斜,像指尖挑起贴纸
 *   2. 标签盖章   —— 点击文章标签筛选时的盖章反馈
 *   3. 黑胶旋转   —— 播放器播放时封面缓慢旋转
 *   4. 贴纸角标   —— 给近期文章贴角标,读过的换成小勾
 *   5. 图标替换   —— 把 images/icons/*.png 换成 Phosphor 矢量图标
 *   6. 搜索框     —— 在顶栏右侧注入站内搜索框
 *
 * 所有 DOM 改动都会在切回旧主题时原样还原,旧样式不受任何影响。
 * 所有记录仅存于本地,不上传任何数据。
 */
(function () {
    'use strict';

    if (window.__xxtStickerThemeLoaded) return;
    window.__xxtStickerThemeLoaded = true;

    var reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 从本脚本自身位置推导站点根路径,兼容 file:// 与 http(s)://
    var SELF_SRC = (document.currentScript && document.currentScript.src) || '';
    var SITE_ROOT = SELF_SRC.replace(/\/js\/[^\/?#]+.*$/, '/');

    /* -----------------------------------------------------------------
       1. 贴纸抬起
       ----------------------------------------------------------------- */
    function initStickerLift() {
        if (!window.matchMedia) return;
        // 仅在有精确指针(hover)的设备启用;触屏走 CSS 的按下反馈
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
        if (reduceMotion) return;

        var SELECTOR = '.window, .download-card, .video-item';
        var BASE_LIFT = -1.5;   // 只保留很轻微的上浮,不做旋转
        var EXTRA_LIFT = 1.5;

        var rafId = null;
        var lastEvent = null;

        function applyLift(e) {
            if (document.body.classList.contains('customizing')) return;

            var el = e.target && e.target.closest ? e.target.closest(SELECTOR) : null;
            if (!el) return;

            var rect = el.getBoundingClientRect();
            if (!rect.width || !rect.height) return;

            var py = (e.clientY - rect.top) / rect.height - 0.5;

            el.style.setProperty('--lift', (BASE_LIFT - Math.abs(py) * EXTRA_LIFT).toFixed(2) + 'px');
            el.classList.add('sticker-lift');
        }

        document.addEventListener('pointermove', function (e) {
            lastEvent = e;
            if (rafId) return;
            rafId = requestAnimationFrame(function () {
                rafId = null;
                if (lastEvent) applyLift(lastEvent);
            });
        }, { passive: true });

        function release(el) {
            if (!el || !el.classList.contains('sticker-lift')) return;
            el.classList.remove('sticker-lift');
            el.style.removeProperty('--tilt');
            el.style.removeProperty('--lift');
        }

        document.addEventListener('pointerout', function (e) {
            var el = e.target && e.target.closest ? e.target.closest(SELECTOR) : null;
            if (!el) return;
            if (e.relatedTarget && el.contains(e.relatedTarget)) return;
            release(el);
        }, { passive: true });

        window.addEventListener('blur', function () {
            var lifted = document.querySelectorAll('.sticker-lift');
            for (var i = 0; i < lifted.length; i++) release(lifted[i]);
        });
    }

    /* -----------------------------------------------------------------
       2. 标签盖章
       ----------------------------------------------------------------- */
    function initStamp() {
        if (reduceMotion) return;

        document.addEventListener('click', function (e) {
            var btn = e.target && e.target.closest ? e.target.closest('.cat-btn') : null;
            if (!btn) return;

            btn.classList.remove('stamping');
            void btn.offsetWidth;
            btn.classList.add('stamping');

            window.setTimeout(function () {
                btn.classList.remove('stamping');
            }, 380);
        });
    }

    /* -----------------------------------------------------------------
       3. 播放器:播放时封面旋转,暂停时**停在当前角度**(不回正)

       旧实现靠 CSS animation(.playing 上加 spinDisc),一暂停 animation 被
       摘掉,transform 立刻掉回 0deg —— 视觉上就是"啪"地弹回正位。

       这里改成 JS 逐帧推进角度:
         - play  → rAF 累加 angle(14s 一圈)
         - pause → 取消 rAF,把最后一次的 angle 以行内 transform 固定在元素上
       因为行内样式优先级最高,即使 animation / 主题 CSS 被切走也不会弹回。
       ----------------------------------------------------------------- */
    function initDisc() {
        var audio = document.getElementById('main-audio');
        var player = document.querySelector('.aero-player');
        if (!audio || !player) return;

        var art = player.querySelector('.wmp-album-art img');
        var reduceMotion = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var PERIOD = 14000;   /* 转一圈 14s,和原 CSS 动画保持一致 */
        var angle = 0;        /* 当前角度(度) */
        var rafId = 0;
        var lastTs = 0;

        function render() {
            if (art) art.style.transform = 'rotate(' + angle.toFixed(2) + 'deg)';
        }

        /* 切回默认主题时把封面还原成"没被碰过"的样子:
           停掉 rAF,角度归零,并**摘掉行内 transform** ——
           否则默认主题的封面会一直歪着。 */
        discReset = function () {
            if (rafId) {
                window.cancelAnimationFrame(rafId);
                rafId = 0;
            }
            lastTs = 0;
            angle = 0;
            if (art) art.style.transform = '';
        };

        function step(ts) {
            if (lastTs) {
                angle = (angle + (ts - lastTs) * 360 / PERIOD) % 360;
                render();
            }
            lastTs = ts;
            rafId = window.requestAnimationFrame(step);
        }

        function start() {
            if (reduceMotion || rafId) return;
            lastTs = 0;
            rafId = window.requestAnimationFrame(step);
        }

        function stop() {
            if (rafId) {
                window.cancelAnimationFrame(rafId);
                rafId = 0;
            }
            lastTs = 0;
            /* 不动 angle、不动 transform —— 就停在刚才那一帧 */
            render();
        }

        function sync() {
            if (audio.paused) {
                player.classList.remove('playing');
                stop();
            } else {
                player.classList.add('playing');
                start();
            }
        }

        audio.addEventListener('play', sync);
        audio.addEventListener('pause', sync);
        audio.addEventListener('ended', sync);
        /* 切歌时封面换成新图,新元素没有行内 transform,角度归零即可 */
        audio.addEventListener('loadstart', function () {
            angle = 0;
            render();
        });
        sync();
    }

    /* -----------------------------------------------------------------
       4. 贴纸角标:新文章贴角标,读过的换成小勾
       ----------------------------------------------------------------- */
    var READ_KEY = 'xxt-read-articles';
    var NEW_WITHIN_DAYS = 30;

    function readStore() {
        try {
            var raw = localStorage.getItem(READ_KEY);
            var obj = raw ? JSON.parse(raw) : {};
            return obj && typeof obj === 'object' ? obj : {};
        } catch (err) {
            return {};
        }
    }

    function writeStore(obj) {
        try {
            localStorage.setItem(READ_KEY, JSON.stringify(obj));
        } catch (err) {
            /* 隐私模式或配额满,静默降级 */
        }
    }

    function daysSince(dateStr) {
        if (!dateStr) return null;
        var m = String(dateStr).match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
        if (!m) return null;
        var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
        if (isNaN(d.getTime())) return null;
        return Math.floor((Date.now() - d.getTime()) / 86400000);
    }

    function initBadges() {
        var list = document.getElementById('articleList');
        if (!list) return;

        var data = window.xxtArticleData || {};
        var read = readStore();

        function keyOf(href) {
            if (!href) return null;
            for (var k in data) {
                if (data[k] && data[k].url === href) return k;
            }
            return null;
        }

        function mark() {
            if (articleState.cards) buildCards();

            var items = list.querySelectorAll('li');
            for (var i = 0; i < items.length; i++) {
                var li = items[i];
                var a = li.querySelector('a');
                li.classList.remove('is-new', 'is-read');
                if (!a) continue;

                var key = keyOf(a.getAttribute('href'));
                if (!key) continue;

                if (read[key]) {
                    li.classList.add('is-read');
                    continue;
                }

                var days = daysSince(data[key].date);
                if (days !== null && days <= NEW_WITHIN_DAYS) {
                    li.classList.add('is-new');
                }
            }
        }

        list.addEventListener('click', function (e) {
            var a = e.target && e.target.closest ? e.target.closest('a') : null;
            if (!a) return;
            var key = keyOf(a.getAttribute('href'));
            if (!key || read[key]) return;
            read[key] = 1;
            writeStore(read);
        }, true);

        mark();

        if (window.MutationObserver) {
            new MutationObserver(mark).observe(list, { childList: true });
        }
    }

    /* -----------------------------------------------------------------
       4b. 文章列表卡片化
       旧主题要靠 hover 才看得到作者 / 简介 / 日期,这里直接铺成卡片常驻展示。
       数据取自 window.xxtArticleData(由 index.js 提供),不重复定义。
       ----------------------------------------------------------------- */
    /* 由 initDisc() 赋值;切回默认主题时调用,摘掉封面上的行内旋转 */
    var discReset = null;

    var articleState = {
        cards: false,
        saved: [],      // [{ li, html }] 用于切回旧主题时还原
        firstRun: true  // 只在首次铺卡片时播入场动画
    };

    // 列表还是空的时候先摆几张骨架,index.js 渲染时会被整体替换
    function showSkeleton() {
        var list = document.getElementById('articleList');
        if (!list || list.children.length) return;

        var html = '';
        for (var i = 0; i < 6; i++) {
            html += '<li class="xxt-skeleton" aria-hidden="true">' +
                '<span class="xxt-sk-line xxt-sk-title"></span>' +
                '<span class="xxt-sk-line"></span>' +
                '<span class="xxt-sk-line xxt-sk-short"></span>' +
                '<span class="xxt-sk-line xxt-sk-meta"></span>' +
                '</li>';
        }
        list.innerHTML = html;
    }

    function tagLabel(key) {
        var cfg = window.xxtTagConfig || {};
        return (cfg[key] && cfg[key].name) ? cfg[key].name : key;
    }

    function buildCards() {
        var list = document.getElementById('articleList');
        if (!list) return;

        var data = window.xxtArticleData || {};
        var items = list.querySelectorAll('li');
        var made = 0;

        for (var i = 0; i < items.length; i++) {
            var li = items[i];
            if (li.classList.contains('xxt-card')) continue;

            var a = li.querySelector('a');
            if (!a) continue;

            var href = a.getAttribute('href') || '';
            if (href.indexOf('github.com') > -1) continue;   // 跳过页脚那条外链

            var key = null;
            for (var k in data) {
                if (data[k] && data[k].url === href) {
                    key = k;
                    break;
                }
            }
            if (!key) continue;

            var d = data[key];

            articleState.saved.push({ li: li, html: li.innerHTML });

            // 沿用原标题(含"编辑中""外链""热门"等标记图标),剔除 hover 预览框
            var clone = a.cloneNode(true);
            var box = clone.querySelector('.preview-box');
            if (box && box.parentNode) box.parentNode.removeChild(box);

            var link = document.createElement('a');
            link.className = 'xxt-card-link';
            link.setAttribute('href', href);
            if (a.getAttribute('target')) link.setAttribute('target', a.getAttribute('target'));
            if (a.getAttribute('rel')) link.setAttribute('rel', a.getAttribute('rel'));

            var html = '<div class="xxt-card-main">';
            html += '<div class="xxt-card-title">' + clone.innerHTML + '</div>';
            if (d.desc) html += '<p class="xxt-card-desc">' + d.desc + '</p>';
            html += '<div class="xxt-card-meta">';
            if (d.author) html += '<span class="xxt-card-author">' + d.author + '</span>';
            if (d.date) html += '<span class="xxt-card-date">' + d.date + '</span>';
            if (d.tags && d.tags.length) {
                for (var t = 0; t < d.tags.length; t++) {
                    html += '<span class="xxt-card-tag" data-tag="' + d.tags[t] + '">' +
                        tagLabel(d.tags[t]) + '</span>';
                }
            }
            html += '</div></div>';

            link.innerHTML = html;

            // 首次铺卡片时错落入场(错峰 45ms),之后筛选重渲染不再播
            if (articleState.firstRun && !reduceMotion) {
                link.classList.add('xxt-card-enter');
                link.style.animationDelay = (made * 45) + 'ms';
            }
            made++;

            li.classList.add('xxt-card');
            li.innerHTML = '';
            li.appendChild(link);
        }

        if (made > 0) articleState.firstRun = false;
    }

    function restoreCards() {
        for (var i = 0; i < articleState.saved.length; i++) {
            var item = articleState.saved[i];
            item.li.classList.remove('xxt-card');
            item.li.innerHTML = item.html;
        }
        articleState.saved = [];
    }

    // 卡片上的标签可以直接当筛选器用
    document.addEventListener('click', function (e) {
        var tag = e.target && e.target.closest ? e.target.closest('.xxt-card-tag') : null;
        if (!tag) return;
        e.preventDefault();
        e.stopPropagation();

        var key = tag.getAttribute('data-tag');
        var btn = document.querySelector('.cat-btn[data-tag="' + key + '"]');
        if (btn) btn.click();
    }, true);

    /* -----------------------------------------------------------------
       5. 图标:Phosphor sprite 替换
       -----------------------------------------------------------------
       ⚠️ 这里有一个反复踩的坑,先读再改:

       `addEventListener` 绑在**元素实例**上。把带监听的 <img> 换成 <svg>,
       旧节点被替换出文档,监听跟着一起消失 —— 表现是"按钮点不动"。
       已经踩过四次:UAC 关闭键、图片查看器三个按钮、以及本轮各 dialog 的
       右上角关闭键。

       所以替换前必须先问一句:**这个 <img> 身上有没有事件?**
       判断不了(JS 的 addEventListener 不留下任何可查询的痕迹),
       于是改成"由会绑事件的代码主动登记":凡是脚本要给它绑点击的图标元素,
       都打上 `data-xxt-keep` 属性。这里统一跳过,由原脚本自己决定外观。

       配套约定:新加"可点击图标"时,记得打 `data-xxt-keep`,
       或让该脚本自己做矢量化(像 uac.js / image-viewer.js 那样)。
       ----------------------------------------------------------------- */
    var ICON_SELECTOR = 'img[src*="images/icons/"]:not(.cat-btn *):not([data-xxt-keep]), ' +
        'img[src$="/hot.png"]:not(.cat-btn *):not([data-xxt-keep]), ' +
        'img[src$="/online.png"]:not(.cat-btn *):not([data-xxt-keep]), ' +
        'img[src$="/busy.png"]:not([data-xxt-keep]), ' +
        'img[src$="/Window_CloseButton.png"]:not([data-xxt-keep]), ' +
        'img[src*="media/assets/prev.png"]:not([data-xxt-keep]), ' +
        'img[src*="media/assets/next.png"]:not([data-xxt-keep]), ' +
        'img[src*="media/assets/play.png"]:not([data-xxt-keep]), ' +
        'img[src*="media/assets/pause.png"]:not([data-xxt-keep])';
    var SVG_NS = 'http://www.w3.org/2000/svg';

    var iconState = {
        on: true,
        pairs: []   // [{ svg, img }] 用于切回旧主题时原样还原
    };
    var iconPending = false;

    /* 给"带事件的关闭键"打上标记。
       index.html 里三处 <img class="vista-close-btn" src="images/Window_CloseButton.png">
       (控制面板 / 留言本 / 欢迎框)的事件都由 index.js 绑 —— 它们不能被换掉。

       用集合式选择器一次标完:只要它长得像"关闭按钮",又确实是 <img>,就标。
       将来新增 dialog 时不用改 HTML,也不会漏。 */
    function markKeepAlive() {
        var btns = document.querySelectorAll(
            '.vista-close-btn, .uac-close-btn, .image-viewer-close, ' +
            '.image-viewer-nav, .sidebar-close-btn, .infobar-close, ' +
            '[data-close], .xxt-copy-btn, .xxt-pin-close, .window-close'
        );
        for (var i = 0; i < btns.length; i++) {
            if (btns[i].tagName === 'IMG') {
                btns[i].setAttribute('data-xxt-keep', '1');
            }
        }
    }

    function loadSprite(done) {
        if (window.XXT_ICON_SPRITE) return done();

        var s = document.createElement('script');
        s.src = SITE_ROOT + 'js/modern-sticker-icons.js';
        s.onload = done;
        s.onerror = done;
        document.head.appendChild(s);
    }

    function ensureSpriteHolder() {
        if (document.getElementById('xxt-icon-sprite')) return;
        if (!window.XXT_ICON_SPRITE) return;

        var holder = document.createElement('div');
        holder.id = 'xxt-icon-sprite';
        holder.setAttribute('aria-hidden', 'true');
        holder.innerHTML = window.XXT_ICON_SPRITE;
        document.body.insertBefore(holder, document.body.firstChild);
    }

    function swapIcons() {
        if (!iconState.on) return;
        var map = window.XXT_ICON_MAP;
        if (!map) return;

        var imgs = document.querySelectorAll(ICON_SELECTOR);
        for (var i = 0; i < imgs.length; i++) {
            var img = imgs[i];
            var src = img.getAttribute('src') || '';
            var name = src.split('/').pop().split('?')[0].split('#')[0];
            var id = map[name];
            if (!id) continue;

            // 播放键特殊处理:一个按钮要在"播放/暂停"两个图标间切换,
            // 而矢量图标没法换 src —— 所以把两枚 symbol 一起塞进去,
            // 由 CSS 根据 .aero-player.is-playing 决定显示哪个。
            if (img.id === 'play-img') {
                var svgBoth = document.createElementNS(SVG_NS, 'svg');
                svgBoth.setAttribute('class', 'xxt-ic');
                svgBoth.setAttribute('data-icon', 'play');
                svgBoth.setAttribute('aria-hidden', 'true');
                svgBoth.setAttribute('focusable', 'false');

                var playUse = document.createElementNS(SVG_NS, 'use');
                playUse.setAttribute('href', '#i-play');
                playUse.setAttribute('class', 'xxt-play-icon');

                var pauseUse = document.createElementNS(SVG_NS, 'use');
                pauseUse.setAttribute('href', '#i-pause');
                pauseUse.setAttribute('class', 'xxt-pause-icon');

                svgBoth.appendChild(playUse);
                svgBoth.appendChild(pauseUse);

                if (img.parentNode) {
                    img.parentNode.replaceChild(svgBoth, img);
                    iconState.pairs.push({ svg: svgBoth, img: img });
                }
                continue;
            }

            var svg = document.createElementNS(SVG_NS, 'svg');
            svg.setAttribute('class', img.className ? 'xxt-ic ' + img.className : 'xxt-ic');
            svg.setAttribute('data-icon', id.replace(/^i-/, ''));
            svg.setAttribute('aria-hidden', 'true');
            svg.setAttribute('focusable', 'false');

            // 大尺寸图标(个性化面板等)沿用原来的像素尺寸
            var w = parseInt(img.getAttribute('width') || '', 10);
            var h = parseInt(img.getAttribute('height') || '', 10);
            if (w >= 28) {
                svg.style.width = w + 'px';
                svg.style.height = (h || w) + 'px';
                svg.style.verticalAlign = 'middle';
            }

            var use = document.createElementNS(SVG_NS, 'use');
            use.setAttribute('href', '#' + id);
            svg.appendChild(use);

            if (img.parentNode) {
                img.parentNode.replaceChild(svg, img);
                iconState.pairs.push({ svg: svg, img: img });
            }
        }
    }

    function scheduleIconSwap() {
        if (!iconState.on || iconPending) return;
        iconPending = true;
        requestAnimationFrame(function () {
            iconPending = false;
            swapIcons();
        });
    }

    function initIcons() {
        ensureSpriteHolder();
        markKeepAlive();   // 先打保护标记,再开始换 —— 顺序不能反
        swapIcons();

        if (window.MutationObserver) {
            new MutationObserver(function () {
                // dialog 可能后出现,每次换之前重标一遍(幂等)
                markKeepAlive();
                scheduleIconSwap();
            }).observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    function restoreIcons() {
        iconState.on = false;
        for (var i = 0; i < iconState.pairs.length; i++) {
            var pair = iconState.pairs[i];
            if (pair.svg.parentNode) {
                pair.svg.parentNode.replaceChild(pair.img, pair.svg);
            }
        }
        iconState.pairs = [];
    }

    /* -----------------------------------------------------------------
       6. 顶栏搜索框
       ----------------------------------------------------------------- */
    var searchBox = null;

    function buildSearchBox() {
        var box = document.createElement('div');
        box.className = 'xxt-nav-search';
        box.innerHTML =
            '<input type="text" placeholder="站内搜索" aria-label="站内搜索" />' +
            '<button type="button" aria-label="搜索">' +
            '<svg class="xxt-ic" aria-hidden="true" focusable="false">' +
            '<use href="#i-magnifying-glass"></use></svg>' +
            '</button>';
        return box;
    }

    function initSearchBox() {
        var host = document.querySelector('.navbar .wrap');
        if (!host) return;
        if (host.querySelector('.xxt-nav-search')) return;

        searchBox = buildSearchBox();
        host.appendChild(searchBox);

        var input = searchBox.querySelector('input');
        var btn = searchBox.querySelector('button');

        function go() {
            var term = input.value.trim();
            if (!term) {
                input.focus();
                return;
            }
            window.location.href = SITE_ROOT + 'search.html?s=' + encodeURIComponent(term);
        }

        btn.addEventListener('click', go);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') go();
        });
    }

    /* -----------------------------------------------------------------
       7. 侧栏小窗口:常驻圆点关闭 + 信息条
       ----------------------------------------------------------------- */
    var TIP_MUTE_KEY = 'xxt-sidebar-tip-muted';
    var infobar = null;

    function sidebarName(win) {
        var bar = win.querySelector('.window-titlebar');
        if (!bar) return '这个模块';
        var text = '';
        for (var i = 0; i < bar.childNodes.length; i++) {
            var node = bar.childNodes[i];
            if (node.nodeType === 3) text += node.nodeValue;
        }
        text = text.replace(/\s+/g, ' ').trim();
        return text ? '「' + text + '」' : '这个模块';
    }

    function syncCustomizePanel(win) {
        var panel = document.getElementById('customizePanel');
        if (!panel) return;
        var id = win.getAttribute('data-sidebar-id');
        if (!id) return;
        var item = panel.querySelector('.customize-icon-item[data-sidebar-id="' + id + '"]');
        if (!item) return;
        if (win.classList.contains('window-hidden')) {
            item.classList.add('grayed');
        } else {
            item.classList.remove('grayed');
        }
    }

    function removeInfobar() {
        if (infobar && infobar.parentNode) infobar.parentNode.removeChild(infobar);
        infobar = null;
    }

    function showInfobar(win) {
        removeInfobar();
        try {
            if (localStorage.getItem(TIP_MUTE_KEY) === '1') return;
        } catch (err) {
            /* 隐私模式:照常显示 */
        }

        var bar = document.createElement('div');
        bar.className = 'xxt-infobar';
        bar.setAttribute('role', 'status');

        var text = document.createElement('span');
        text.className = 'xxt-infobar-text';
        text.textContent = '已隐藏' + sidebarName(win) + ',可在个性化中加回';
        bar.appendChild(text);

        var undo = document.createElement('button');
        undo.type = 'button';
        undo.className = 'xxt-infobar-btn';
        undo.textContent = '撤销';
        undo.addEventListener('click', function () {
            win.classList.remove('window-hidden');

            // 贴回去:与"撕下来"对应的反向动画
            if (!reduceMotion) {
                win.classList.remove('xxt-restoring');
                void win.offsetWidth;
                win.classList.add('xxt-restoring');
                window.setTimeout(function () {
                    win.classList.remove('xxt-restoring');
                }, 340);
            }

            syncCustomizePanel(win);
            removeInfobar();
        });
        bar.appendChild(undo);

        var mute = document.createElement('button');
        mute.type = 'button';
        mute.className = 'xxt-infobar-btn';
        mute.textContent = '不再提醒';
        mute.addEventListener('click', function () {
            try {
                localStorage.setItem(TIP_MUTE_KEY, '1');
            } catch (err) {
                /* 忽略 */
            }
            removeInfobar();
        });
        bar.appendChild(mute);

        var close = document.createElement('button');
        close.type = 'button';
        close.className = 'xxt-infobar-close';
        close.setAttribute('aria-label', '关闭');
        close.innerHTML = '<svg class="xxt-ic" aria-hidden="true">' +
            '<use href="#i-close-dot"></use></svg>';
        close.addEventListener('click', removeInfobar);
        bar.appendChild(close);

        document.body.appendChild(bar);
        infobar = bar;
    }

    /* 删除组件的动画:先把卡片"撕下来"再收起。
       顺序 —— 轻微放大+抬升(像被捏住) → 侧倾缩小并淡出 → 加 window-hidden。
       全程约 340ms;开了「减少动态效果」或事件被打断时直接收尾。 */
    function animateRemove(win, done) {
        if (reduceMotion) { done(); return; }

        var finished = false;
        var timer = null;

        function finish() {
            if (finished) return;
            finished = true;
            if (timer) clearTimeout(timer);
            win.removeEventListener('animationend', finish);
            win.classList.remove('xxt-removing');
            done();
        }

        win.classList.remove('xxt-removing');
        void win.offsetWidth;               // 强制重排,让动画能重复播放
        win.classList.add('xxt-removing');
        win.addEventListener('animationend', finish, { once: true });
        timer = setTimeout(finish, 480);    // 兜底
    }

    function initSidebarClose() {
        var sidebar = document.getElementById('sidebarContainer');
        if (!sidebar) return;

        sidebar.addEventListener('click', function (e) {
            var btn = e.target && e.target.closest ? e.target.closest('.sidebar-close-btn') : null;
            if (!btn) return;

            // 个性化模式下交给 index.js 处理(它会更新面板状态)
            if (document.body.classList.contains('customizing')) return;

            var win = btn.closest('.window');
            if (!win) return;
            if (win.getAttribute('data-sidebar-id') === 'function') return;
            if (win.classList.contains('window-hidden')) return;

            // 动画期间先把卡片锁住,避免连点导致状态错乱
            if (win.classList.contains('xxt-removing')) return;

            animateRemove(win, function () {
                win.classList.add('window-hidden');
                syncCustomizePanel(win);
                showInfobar(win);
            });
        });
    }

    /* -----------------------------------------------------------------
       8. 背景:沿用原有的"切换背景"按钮,换成手账纸面色调
       ----------------------------------------------------------------- */
    var BG_TONES = 5;

    function initBgTone() {
        function sync() {
            var idx = parseInt(localStorage.getItem('bgIndex') || '0', 10);
            if (isNaN(idx) || idx < 0) idx = 0;
            document.documentElement.setAttribute('data-xxt-bg', String(idx % BG_TONES));
        }

        sync();

        // index.js 的 cycleBackground() 会改写 body 的内联 background-image
        if (window.MutationObserver) {
            new MutationObserver(sync).observe(document.body, {
                attributes: true,
                attributeFilter: ['style']
            });
        }

        window.addEventListener('storage', function (e) {
            if (e.key === 'bgIndex') sync();
        });
    }

    /* -----------------------------------------------------------------
       8b. 背景装饰:漂浮几何 + 滚动视差
       形状全是 CSS 画的,不引入任何图片;视差用 rAF 节流,
       每一层的速度不同,滚动时错开形成纵深。
       ----------------------------------------------------------------- */
    var DECO = [
        ['dot',    16, '#FF7A8A', '7%',  '16%', .10, 7],
        ['ring',   26, '#3FC7BE', '16%', '62%', .18, 9],
        ['square', 20, '#FFD21F', '30%', '12%', .08, 8],
        ['star',   22, '#B08BE8', '46%', '72%', .22, 11],
        ['tri',    18, '#5FB8F0', '58%', '20%', .12, 8],
        ['dot',    12, '#0E9E92', '68%', '48%', .26, 6],
        ['square', 26, '#FF7A8A', '78%', '78%', .16, 10],
        ['star',   16, '#FFD21F', '88%', '26%', .09, 9],
        ['ring',   34, '#1478C4', '94%', '58%', .20, 12],
        ['tri',    14, '#3FC7BE', '24%', '88%', .14, 7],
        ['dot',    20, '#B08BE8', '52%', '40%', .24, 8],
        ['square', 14, '#1478C4', '82%', '92%', .19, 6],
        /* 圆角五角星:比四角闪光更"玩具"一点,呼应贴纸的钝角 */
        ['star-round', 28, '#D08A00', '38%', '54%', .13, 10],
        ['star-round', 20, '#E0416E', '64%', '84%', .21, 8],
        ['star-round', 24, '#0E9E92', '12%', '34%', .17, 9],
        /* 第二梯队:把空隙填满,形状更密一点但仍留白 */
        ['heart',  20, '#FF7A8A', '21%', '26%', .15, 9],
        ['heart',  15, '#B08BE8', '73%', '10%', .11, 7],
        ['plus',   18, '#3FC7BE', '41%', '90%', .23, 8],
        ['plus',   14, '#FFD21F', '86%', '42%', .13, 7],
        ['star',   18, '#FF7A8A', '9%',  '72%', .25, 10],
        ['dot',    14, '#1478C4', '33%', '38%', .19, 6],
        ['ring',   20, '#E0A030', '56%', '8%',  .10, 9],
        ['square', 18, '#0E9E92', '91%', '68%', .21, 8],
        ['tri',    16, '#B08BE8', '65%', '32%', .09, 7],
        ['star-round', 18, '#5FB8F0', '48%', '60%', .16, 8]
    ];

    function buildDeco() {
        var host = document.createElement('div');
        host.id = 'xxt-bg-deco';
        host.setAttribute('aria-hidden', 'true');

        for (var i = 0; i < DECO.length; i++) {
            var cfg = DECO[i];

            var wrap = document.createElement('div');
            wrap.className = 'xxt-deco';
            wrap.setAttribute('data-speed', String(cfg[5]));
            wrap.style.left = cfg[3];
            wrap.style.top = cfg[4];

            var shape = document.createElement('span');
            shape.className = 'xxt-deco-shape xxt-deco-' + cfg[0];
            shape.style.width = cfg[1] + 'px';
            shape.style.height = cfg[1] + 'px';
            shape.style.color = cfg[2];
            shape.style.animationDuration = cfg[6] + 's';
            shape.style.animationDelay = (-i * 0.7).toFixed(1) + 's';

            wrap.appendChild(shape);
            host.appendChild(wrap);
        }

        document.body.insertBefore(host, document.body.firstChild);
        return host;
    }

    function initDeco() {
        if (reduceMotion) return;

        var host = document.getElementById('xxt-bg-deco') || buildDeco();
        if (!host) return;

        var items = host.querySelectorAll('.xxt-deco');
        var ticking = false;

        function update() {
            ticking = false;
            var y = window.pageYOffset ||
                (document.documentElement && document.documentElement.scrollTop) || 0;

            for (var i = 0; i < items.length; i++) {
                var speed = parseFloat(items[i].getAttribute('data-speed')) || 0.15;
                items[i].style.transform =
                    'translate3d(0,' + (-y * speed).toFixed(1) + 'px,0)';
            }
        }

        function onScroll() {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(update);
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        update();
    }

    function removeDeco() {
        var host = document.getElementById('xxt-bg-deco');
        if (host && host.parentNode) host.parentNode.removeChild(host);
    }

    /* -----------------------------------------------------------------
       主题切换同步:切回旧主题时把 DOM 原样还原
       ----------------------------------------------------------------- */
    function initThemeSync() {
        var link = document.getElementById('themeCss');

        function isModernTheme() {
            if (!link) return true;
            return (link.getAttribute('href') || '').indexOf('modern-sticker') > -1;
        }

        function sync() {
            var modern = isModernTheme();

            if (searchBox) {
                searchBox.style.display = modern ? '' : 'none';
            }

            if (modern) {
                if (!articleState.cards) {
                    articleState.cards = true;
                    buildCards();
                }
                if (!iconState.on) {
                    iconState.on = true;
                    swapIcons();
                }
            } else {
                if (articleState.cards) {
                    articleState.cards = false;
                    restoreCards();
                }
                if (iconState.on) restoreIcons();
                if (discReset) discReset();
                removeInfobar();
                removeDeco();

                // 切回旧主题时清掉动画过程中残留的状态类,
                // 否则中途切换会留下半透明的卡片
                var animating = document.querySelectorAll('.xxt-removing, .xxt-restoring');
                for (var i = 0; i < animating.length; i++) {
                    animating[i].classList.remove('xxt-removing', 'xxt-restoring');
                }
            }
        }

        if (link && window.MutationObserver) {
            new MutationObserver(sync).observe(link, {
                attributes: true,
                attributeFilter: ['href']
            });
        }

        sync();
    }

    /* -----------------------------------------------------------------
       启动
       ----------------------------------------------------------------- */
    function boot() {
        showSkeleton();
        initStickerLift();
        initStamp();
        initDisc();
        initBadges();
        initSidebarClose();
        initBgTone();
        initDeco();

        loadSprite(function () {
            initIcons();
            initSearchBox();
            initThemeSync();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
