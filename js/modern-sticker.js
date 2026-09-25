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
 *
 * 说明:不改动任何既有脚本;所有记录仅存于本地,不上传任何数据。
 */
(function () {
    'use strict';

    if (window.__xxtStickerThemeLoaded) return;
    window.__xxtStickerThemeLoaded = true;

    var reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* -----------------------------------------------------------------
       1. 贴纸抬起
       ----------------------------------------------------------------- */
    function initStickerLift() {
        // 仅在有精确指针(hover)的设备上启用;触屏走按下反馈,由 CSS 负责
        if (!window.matchMedia) return;
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
        if (reduceMotion) return;

        var SELECTOR = '.window, .download-card, .video-item';
        var MAX_TILT = 1.6;   // 最大倾斜角度(度)
        var BASE_LIFT = -2;   // 基础抬升(px)
        var EXTRA_LIFT = 2;   // 倾斜带来的额外抬升(px)

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

            // 指针偏右 → 右侧被压下 → 顺时针小幅旋转
            var tilt = (px * MAX_TILT * 2).toFixed(2);
            var lift = (BASE_LIFT - Math.abs(py) * EXTRA_LIFT).toFixed(2);

            el.style.setProperty('--tilt', tilt + 'deg');
            el.style.setProperty('--lift', lift + 'px');
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
            // 在元素内部移动不释放
            if (e.relatedTarget && el.contains(e.relatedTarget)) return;
            release(el);
        }, { passive: true });

        // 页面滚动或离开视口时收干净,避免残留倾斜
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
            // 强制回流以重启动画
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

        // 记录已读
        list.addEventListener('click', function (e) {
            var a = e.target && e.target.closest ? e.target.closest('a') : null;
            if (!a) return;
            var key = keyOf(a.getAttribute('href'));
            if (!key || read[key]) return;
            read[key] = 1;
            writeStore(read);
        }, true);

        mark();

        // 标签筛选会重渲染列表,跟随更新
        if (window.MutationObserver) {
            new MutationObserver(mark).observe(list, { childList: true });
        }
    }

    /* -----------------------------------------------------------------
       启动
       ----------------------------------------------------------------- */
    function boot() {
        initStickerLift();
        initStamp();
        initDisc();
        initBadges();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
