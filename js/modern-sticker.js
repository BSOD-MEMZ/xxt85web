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
 *                    (换成 <svg> 会丢 addEventListener,故有 data-xxt-keep 名单)
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

        /* 手账期间这些预览图挂的是 data-src(一个都没下过),回到普通主题就得补上 ——
           那边要的是"提前下好、hover 时无缝"。 */
        var lazy = document.querySelectorAll('#articleList img[data-src]');
        for (var j = 0; j < lazy.length; j++) {
            lazy[j].setAttribute('src', lazy[j].getAttribute('data-src'));
        }
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
       (已经栽过四次:UAC 关闭键、图片查看器三个按钮、各 dialog 的右上角关闭键。)

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
        'img[src*="media/assets/pause.png"]:not([data-xxt-keep]), ' +
        // 左右翻页箭头:support/manga 的漫画阅读器是顶层页里唯一用它们的地方
        // (文章页的图片查看器走自己那套 image-viewer.js,不受这里影响)
        'img[src*="images/left.png"]:not([data-xxt-keep]), ' +
        'img[src*="images/right.png"]:not([data-xxt-keep]), ' +
        // 播放页(media/player.html)的下载图标直接用 media/assets/ 下的那份,
        // 不走 images/icons/(列表页那边由 medias.js 的 dlIcon() 换算过去),
        // 所以单独补两条。这两个路径全站只有 media/videos.js 的数据在用
        'img[src*="assets/downvideo.png"]:not([data-xxt-keep]), ' +
        'img[src*="assets/bilibili.png"]:not([data-xxt-keep]), ' +
        // Live2D 看板娘的工具图标(chat.png / hitokoto.png …)。它们不在
        // images/icons/ 下,所以上面那些通配符一条都命中不了 —— 单独放行。
        // 图标本体在下面的 LIVE2D_ICON_MAP 里,不进主映射表(见那张表的说明)。
        'img[src*="live2d-widget/dist/assets/"]:not([data-xxt-keep])';
    var SVG_NS = 'http://www.w3.org/2000/svg';

    /* Live2D 看板娘那几枚图标单独一张小表,**故意不进 XXT_ICON_MAP**。

       理由:主映射表是按**文件名**查的,而看板娘这几个名字太普通
       (chat.png / model.png / info.png / close.png …)。一旦并进去,
       别的页面只要有一张同名图片落进 ICON_SELECTOR(比如以后有人在
       images/icons/ 下放个 model.png),就会被静默换成看板娘的图标。
       所以这里按"路径 + 文件名"两头一起认。

       ⚠️ 但**文件名撞名是躲不掉的**:close / search / game / info 这四个
          主表里本来就有,所以 swapIcons() 里查表的**顺序**是关键 ——
          **先查这张小表**,查不到才回落主表。写反了就会静默走错
          (close.png 会被主表判成红点 i-close-dot)。

       toggle.png 是收起后贴屏幕左缘那枚书签。

       close.png(「收起看板娘」)用的是普通的叉 `i-x`,**不是**站内那枚
       macos 红点 `i-close-dot` —— 它在这一列贴纸按钮里显得像另一个体系的东西。 */
    var LIVE2D_ICON_MAP = {
        'search.png': 'i-magnifying-glass',
        'hitokoto.png': 'i-note',
        'game.png': 'i-game-controller',
        'model.png': 'i-cube',
        'texture.png': 'i-palette',
        'chat.png': 'i-chat-circle-dots',
        'info.png': 'i-info',
        'photo.png': 'i-image',
        'close.png': 'i-x',
        'toggle.png': 'i-caret-right'
    };
    var LIVE2D_ASSET_PATH = 'live2d-widget/dist/assets/';

    var iconState = {
        on: true,
        pairs: []   // [{ svg, img }] 用于切回旧主题时原样还原
    };
    var iconPending = false;

    /* 给「换掉就会丢事件、且原脚本不会重新绑定」的关闭键打标记。

       ⚠️ 这份名单必须**尽量小**:把 .vista-close-btn / .sidebar-close-btn 也塞进来,
       它们就不再被矢量化,直接露出原始 PNG —— 首页小窗关闭键变回原始图、
       若干窗口的圆点整个消失。

       判断标准:这个元素被换成 <svg> 之后,点击还有效吗?
         · 事件委托(c 挂在父容器).sidebar-close-btn —— 换掉没事 → 不标
         · 原脚本自己会重新绑 .uac-close-btn(uac.js 建了一个新 <svg> 并 addEventListener)
           → 但 uac.js 用的是 images/Window_CloseButton.png,会被通配符命中,
             所以必须标,否则两套逻辑打架
         · 直接 addEventListener 绑在本体上,且没人会重绑 → **必须标**

       index.html 里三处 <img class="vista-close-btn" src="images/Window_CloseButton.png">
       (控制面板 / 留言本 / 欢迎框)的事件由 index.js 直接绑在本体上,换成 <svg> 就丢。
       但它们的外观需要那个 macos 圆点 —— 所以**不标**,改由 CSS 在 <img> 上自绘
       (见 modern-sticker.css 的 .vista-close-btn 与 ::after,用
        object-position:-9999px 把 PNG 推出视野,再画红点 + hover 浮出 ×)。
       这样事件和外观同时保住。

       ⚠️ 这里写的是 ::after,别改回 ::before —— CSS 那边的 ::before 才是吞点击的元凶。
       改这块时记得同步 CSS 里的注释,两处容易走散。 */
    function markKeepAlive() {
        var btns = document.querySelectorAll(
            '.uac-close-btn, .image-viewer-close, .image-viewer-nav, ' +
            '.infobar-close, .xxt-copy-btn, .xxt-pin-close'
        );
        for (var i = 0; i < btns.length; i++) {
            if (btns[i].tagName === 'IMG') {
                btns[i].setAttribute('data-xxt-keep', '1');
            }
        }

        // 从名单里移除过的类名,要把残留的标记清掉 ——
        // 否则页面若在中途热重载/二次执行,旧的 data-xxt-keep 会一直挡着矢量化
        var stale = document.querySelectorAll(
            '.vista-close-btn[data-xxt-keep], ' +
            '.sidebar-close-btn[data-xxt-keep], ' +
            '[data-close][data-xxt-keep], ' +
            '.window-close[data-xxt-keep]'
        );
        for (var j = 0; j < stale.length; j++) {
            stale[j].removeAttribute('data-xxt-keep');
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

            /* 看板娘那几枚文件名有几个和主表**撞名**(close.png / search.png /
               game.png / info.png),所以必须**先查看板娘那张小表**,查不到才回落主表。
               ⚠️ 写反了不会报错,只会静默走错:close.png 在**主表**里是 i-close-dot
                  (macos 红点),于是"收起看板娘"永远是个红点而不是叉。 */
            var id = null;
            if (src.indexOf(LIVE2D_ASSET_PATH) > -1) id = LIVE2D_ICON_MAP[name];
            if (!id) id = map[name];
            if (!id) continue;

            // 播放键特殊处理:一个按钮要在"播放/暂停"两个图标间切换,
            // 而矢量图标没法换 src —— 所以把两枚 symbol 一起塞进去,
            // 由 CSS 根据 .aero-player.is-playing 决定显示哪个。
            if (img.id === 'play-img') {
                var svgBoth = document.createElementNS(SVG_NS, 'svg');
                svgBoth.setAttribute('class', 'xxt-ic');
                // ⚠️ id 必须原样带走。CSS 里那四条决定"显示 play 还是 pause"的规则
                // 全部挂在 `svg#play-img use.xxx` 上,而这个 <svg> 是新建的元素,
                // 不会自动继承 <img> 的 id —— 少了这一行,四条规则一条都不命中,
                // 两枚 symbol 会同时画出来,看着就是"播放/暂停图标重叠"。
                // (player.js 那边靠 getElementById('play-img') 拿播放键,
                //  并判断 tagName === 'IMG' 才回退成换 src,所以这里的 id 也是它要的。)
                svgBoth.setAttribute('id', 'play-img');
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

    /* 图标交接门:摘掉 <html> 上的 xxt-ic-pending,主题 CSS 第 14k 节那份"候选图标先藏起来"
       的规则随之失效,图标一起出现。

       为什么需要它:本脚本是 defer 的、精灵表还要再下一个请求,而浏览器早把 PNG 画出来了
       —— 不藏的话就是"原始图标一闪、再变成矢量"。
       调用点只有一个:**initIcons() 结尾**。那时精灵要么已就位、要么明确失败了
       (`loadSprite` 的 onerror 也走 done),两种情况下图标都必须显示出来,
       所以这里不看换没换成,一律放行。幂等,重复调用无害。 */
    function releaseIconGate() {
        var de = document.documentElement;
        de.className = de.className.split('xxt-ic-pending').join(' ')
            .replace(/\s{2,}/g, ' ').replace(/^\s+|\s+$/g, '');
    }

    function initIcons() {
        ensureSpriteHolder();
        markKeepAlive();   // 先打保护标记,再开始换 —— 顺序不能反
        swapIcons();

        /* ⚠️ 紧跟 swapIcons 就开门,别挪到函数末尾:后面两个 decorate* 万一抛错,
           门就永远开不了 —— 而"图标一直看不见"比"印记晚几毫秒出现"严重得多。
           (它们注入的是本来没有图标的地方,不存在闪的问题。) */
        releaseIconGate();

        decorateMediaIcons();
        decorateWindowMarks();
        stripNavAccessKeys();

        if (window.MutationObserver) {
            new MutationObserver(function () {
                // dialog 可能后出现,每次换之前重标一遍(幂等)
                markKeepAlive();
                scheduleIconSwap();
                // 媒体库的列表/播放器都是脚本渲染出来的,得跟着补图标
                scheduleMediaIcons();
                // 侧栏窗口会被拖拽重排,补过的印记跟着走;重排后这里只做兜底
                scheduleWindowMarks();
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
       5b. 媒体库:给"本来没图标"的元素补上矢量图标

       媒体库有两处图标是 CSS background-image 画的,压根没有 <img>,
       所以上面那套"换 <img>"的机制够不到:
         · 列表页封面上的播放角标(#videoList .play-icon / .flash-play-icon,空 div)
         · 播放页控件条的按钮(#video-player .control-button,背景是 media/assets/*.png)
       这里直接把 <svg><use> 塞进元素里,图标全部取自同一份精灵表。

       有状态的按钮(播放/暂停、扬声器/静音、全屏/退出)**两枚都塞**,
       由 CSS 按按钮当前的类决定显示哪一枚 —— 与 #play-img 同一套路子,
       按钮的类由 player.js 切换,所以不用去监听它。
       ----------------------------------------------------------------- */
    var BADGE_ICONS = [
        ['#videoList .play-icon', 'i-play'],
        ['#videoList .flash-play-icon', 'i-lightning']
    ];

    var CTRL_ICON_SETS = [
        {
            match: /(^|\s)(play|pause)-btn(\s|$)/,
            icons: [['i-play', 'xxt-ctrl-play'], ['i-pause', 'xxt-ctrl-pause']]
        },
        {
            match: /(^|\s)(mute|muted)-btn(\s|$)/,
            icons: [['i-speaker-high', 'xxt-ctrl-vol'], ['i-speaker-slash', 'xxt-ctrl-mute']]
        },
        {
            match: /(^|\s)(exit-)?fullscreen-btn(\s|$)/,
            icons: [['i-arrows-out', 'xxt-ctrl-fs'], ['i-arrows-in', 'xxt-ctrl-fs-in']]
        }
    ];

    var mediaIconNodes = [];
    var mediaIconPending = false;

    function makeIconUse(iconId, extraClass) {
        var svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('class', extraClass ? 'xxt-ic ' + extraClass : 'xxt-ic');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        var use = document.createElementNS(SVG_NS, 'use');
        use.setAttribute('href', '#' + iconId);
        svg.appendChild(use);
        return svg;
    }

    function decorateMediaIcons() {
        if (!iconState.on || !window.XXT_ICON_SPRITE) return;

        var i, j;

        /* 封面角标 */
        for (i = 0; i < BADGE_ICONS.length; i++) {
            var hosts = document.querySelectorAll(BADGE_ICONS[i][0]);
            for (j = 0; j < hosts.length; j++) {
                if (hosts[j].querySelector('.xxt-ic')) continue;   // 已经补过
                var badge = makeIconUse(BADGE_ICONS[i][1], '');
                hosts[j].appendChild(badge);
                mediaIconNodes.push(badge);
            }
        }

        /* 播放控件按钮:按当前的类决定塞哪一对 */
        var btns = document.querySelectorAll('#video-player .control-button');
        for (i = 0; i < btns.length; i++) {
            if (btns[i].querySelector('.xxt-ic')) continue;
            var cls = ' ' + (btns[i].className || '') + ' ';
            for (j = 0; j < CTRL_ICON_SETS.length; j++) {
                if (!CTRL_ICON_SETS[j].match.test(cls)) continue;
                var set = CTRL_ICON_SETS[j].icons;
                for (var k = 0; k < set.length; k++) {
                    var ic = makeIconUse(set[k][0], set[k][1]);
                    btns[i].appendChild(ic);
                    mediaIconNodes.push(ic);
                }
            }
        }
    }

    function scheduleMediaIcons() {
        if (!iconState.on || mediaIconPending) return;
        mediaIconPending = true;
        requestAnimationFrame(function () {
            mediaIconPending = false;
            decorateMediaIcons();
        });
    }

    function restoreMediaIcons() {
        for (var i = 0; i < mediaIconNodes.length; i++) {
            var n = mediaIconNodes[i];
            if (n.parentNode) n.parentNode.removeChild(n);
        }
        mediaIconNodes = [];
    }

    /* -----------------------------------------------------------------
       5c. 右侧小窗口的图标底纹

       控制面板里每个侧栏窗口都配了一枚 48px 图标(images/icons/<名字>.png),
       这里把同一枚图标再放进窗口本体里一份,当作压在纸上的"印记"用,
       外观全交给 CSS(见 modern-sticker.css 的 svg.xxt-win-mark)。

       ⚠️ 图标文件名与窗口 id **不是一一对应**:窗口叫 progress,
          图标文件却叫 process.png。表里写的是"图标文件名",别按 id 想当然。
       ⚠️ 顺序上必须挂在**窗口最后**(不是第一个子节点):
          index.js 的拖拽/显隐虽然只认 data-sidebar-id,但把节点塞到
          .window-titlebar 前面会打乱"标题在内容之前"的既有阅读顺序。
          画在文字下面靠的是 CSS 的 z-index:-1,与 DOM 顺序无关。
       ----------------------------------------------------------------- */
    var WINDOW_MARK_ICONS = {
        'function': 'function.png',
        'news': 'news.png',
        'contact': 'contact.png',
        'progress': 'process.png',
        'wmp': 'wmp.png'
    };
    var windowMarkNodes = [];
    var windowMarkPending = false;

    function decorateWindowMarks() {
        if (!iconState.on || !window.XXT_ICON_MAP) return;

        var wins = document.querySelectorAll('.sidebar .window[data-sidebar-id]');
        for (var i = 0; i < wins.length; i++) {
            var win = wins[i];
            if (win.querySelector('.xxt-win-mark')) continue;   // 已经补过

            var png = WINDOW_MARK_ICONS[win.getAttribute('data-sidebar-id')];
            if (!png) continue;
            var id = window.XXT_ICON_MAP[png];
            if (!id) continue;
            /* 精灵表里没有这枚符号的话,别造一个引用不到的空 <svg> */
            if (window.XXT_ICON_SPRITE &&
                window.XXT_ICON_SPRITE.indexOf('<symbol id="' + id + '"') < 0) continue;

            var mark = makeIconUse(id, 'xxt-win-mark');
            mark.setAttribute('data-icon', id.replace(/^i-/, ''));
            win.appendChild(mark);
            windowMarkNodes.push(mark);
        }
    }

    function scheduleWindowMarks() {
        if (!iconState.on || windowMarkPending) return;
        windowMarkPending = true;
        requestAnimationFrame(function () {
            windowMarkPending = false;
            decorateWindowMarks();
        });
    }

    function restoreWindowMarks() {
        for (var i = 0; i < windowMarkNodes.length; i++) {
            var n = windowMarkNodes[i];
            if (n.parentNode) n.parentNode.removeChild(n);
        }
        windowMarkNodes = [];
    }

    /* -----------------------------------------------------------------
       5d. 导航栏的访问键提示

       "首页(H) / 文章(A) / 下载(D) / 多媒体(M) / 关于(A)":这是 Windows
       菜单那套访问键的写法,在经典 Vista 主题下是味道的一部分,所以
       **HTML 里那行字一个字不改** —— 只在手账主题下由脚本把括号去掉。

       为什么不用 CSS 干:括号就是 <a> 里的一段普通文字,没有独立元素,
       CSS 挑不出来(::first-letter 只能碰第一个字符)。页面上也没有
       accesskey 属性可删 —— 它就是可见文本。

       原文存进 navKeyPairs,切回默认主题时逐字写回(与图标、窗口印记同一套)。
       ⚠️ 带元素子节点的链接直接跳过(donate.html 的导航里有 <img> + "Alipay"
          那种),否则一行 textContent = … 会把里面的 <img> 一起抹掉。
       ----------------------------------------------------------------- */
    var NAV_KEY_RE = /^([\s\S]*?)\s*[（(]\s*[A-Za-z0-9]\s*[）)]\s*$/;
    var navKeyPairs = [];

    function stripNavAccessKeys() {
        if (navKeyPairs.length) return;
        var links = document.querySelectorAll('.navbar ul a');
        for (var i = 0; i < links.length; i++) {
            var a = links[i];
            if (a.children.length) continue;          // 里面有 <img> 之类,不动
            var text = a.textContent;
            var m = NAV_KEY_RE.exec(text);
            if (!m) continue;                         // 本来就没写访问键
            navKeyPairs.push({ el: a, text: text });
            a.textContent = m[1];
        }
    }

    function restoreNavAccessKeys() {
        for (var i = 0; i < navKeyPairs.length; i++) {
            navKeyPairs[i].el.textContent = navKeyPairs[i].text;
        }
        navKeyPairs = [];
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
       默认专辑封面:两张图,按**实际生效**的主题切 src
       -----------------------------------------------------------------
       Aero(默认主题)用 WMP 经典空封面 images/default_album.png(白纸 + 蓝三角),
       手账用 images/default_album.svg(唱片)。两张都留在仓库里,谁也不删。

       ⚠️ 只动"src 仍指向 default_album.*"的情况:用户点过歌之后 src 就是
          **真实封面**了,那时切主题**绝不能**覆盖它。
       ⚠️ 判据读 #themeCss 的 href(实际生效的那个主题),与 charts.js、
          player.js 的 defaultAlbumSrc() 是同一套。
       ----------------------------------------------------------------- */
    function syncAlbumCover(modern) {
        var img = document.getElementById('album-img');
        if (!img) return;

        var cur = img.getAttribute('src') || '';
        if (cur.indexOf('images/default_album.') !== 0) return;   /* 真实封面,不碰 */

        var want = modern ? 'images/default_album.svg' : 'images/default_album.png';
        if (cur !== want) img.setAttribute('src', want);
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

            syncAlbumCover(modern);

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
                    decorateMediaIcons();
                    decorateWindowMarks();
                }
                stripNavAccessKeys();
            } else {
                if (articleState.cards) {
                    articleState.cards = false;
                    restoreCards();
                }
                if (iconState.on) restoreIcons();
                restoreMediaIcons();
                restoreWindowMarks();
                restoreNavAccessKeys();
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

        /* ⚠️ 封面**不依赖 sprite**,所以别排在 loadSprite 的回调里 ——
           这个脚本本身只在手账主题下才被 theme-loader 加载,走到这儿就是手账。
           早一步换掉 src,首屏就少一次"白纸三角 → 唱片"。 */
        syncAlbumCover(true);

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
