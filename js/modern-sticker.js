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
        var MAX_TILT = 1.6;
        var BASE_LIFT = -2;
        var EXTRA_LIFT = 2;

        var rafId = null;
        var lastEvent = null;

        function applyLift(e) {
            if (document.body.classList.contains('customizing')) return;

            var el = e.target && e.target.closest ? e.target.closest(SELECTOR) : null;
            if (!el) return;

            var rect = el.getBoundingClientRect();
            if (!rect.width || !rect.height) return;

            var px = (e.clientX - rect.left) / rect.width - 0.5;
            var py = (e.clientY - rect.top) / rect.height - 0.5;

            el.style.setProperty('--tilt', (px * MAX_TILT * 2).toFixed(2) + 'deg');
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
       3. 播放器:播放时封面旋转
       ----------------------------------------------------------------- */
    function initDisc() {
        var audio = document.getElementById('main-audio');
        var player = document.querySelector('.aero-player');
        if (!audio || !player) return;

        function sync() {
            if (audio.paused) {
                player.classList.remove('playing');
            } else {
                player.classList.add('playing');
            }
        }

        audio.addEventListener('play', sync);
        audio.addEventListener('pause', sync);
        audio.addEventListener('ended', sync);
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
       5. 图标:Phosphor sprite 替换
       ----------------------------------------------------------------- */
    var ICON_SELECTOR = 'img[src*="images/icons/"], img[src$="/hot.png"], img[src$="/busy.png"]';
    var SVG_NS = 'http://www.w3.org/2000/svg';

    var iconState = {
        on: true,
        pairs: []   // [{ svg, img }] 用于切回旧主题时原样还原
    };
    var iconPending = false;

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

            var svg = document.createElementNS(SVG_NS, 'svg');
            svg.setAttribute('class', img.className ? 'xxt-ic ' + img.className : 'xxt-ic');
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
        swapIcons();

        if (window.MutationObserver) {
            new MutationObserver(scheduleIconSwap).observe(document.body, {
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
                if (!iconState.on) {
                    iconState.on = true;
                    swapIcons();
                }
            } else if (iconState.on) {
                restoreIcons();
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
        initStickerLift();
        initStamp();
        initDisc();
        initBadges();

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
