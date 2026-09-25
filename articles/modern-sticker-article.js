/**
 * xxtsoft 文章页 · 手账主题配套脚本
 *
 * 由 article-theme-loader.js 在主站主题命中 ARTICLE_THEME_MAP 时加载。
 * 只做一件事:把文章页里的 PNG 图标换成矢量图标。
 *
 * 图标数据来自 ../js/modern-sticker-icons.js —— 与主站同一个文件,
 * 用户在首页已经加载过,文章页再引用会直接命中浏览器缓存,不产生额外流量。
 * 该文件载入后只是把数据挂在 window 上,不会自动注入,所以需要这里的代码。
 *
 * 不做的事(有意为之):
 *   · 不注入背景装饰 / 搜索框 / 卡片化 —— 那些是主站首页的东西,
 *     放在阅读页只会分散注意力。主站的 modern-sticker.js 因此不在此加载。
 *   · 不改动任何正文内容。
 */
(function () {
    'use strict';

    var SVG_NS = 'http://www.w3.org/2000/svg';
    var SPRITE_URL = '../js/modern-sticker-icons.js';

    /* 需要替换的图标。用文件名查映射表,查不到就跳过原样保留 PNG。
       UAC 对话框的关闭按钮单独排除:它的点击事件由 uac.js 自己绑定,
       这里换掉 <img> 会连事件一起换没 —— 那枚图标交给 uac.js 处理。 */
    var ICON_SELECTOR = 'img[src$=".png"]:not(.uac-close-btn), img[src$=".gif"]:not(.uac-close-btn)';

    /* 头图上的「关闭页面」:文字保留,图标换成矢量叉
       (旧样式不走本脚本,原 PNG 一字未改) */
    function swapToolbarClose() {
        var anchors = document.querySelectorAll('.gradient-divider .button');
        for (var i = 0; i < anchors.length; i++) {
            var a = anchors[i];
            if (a.getAttribute('data-xxt-close')) continue;
            if ((a.getAttribute('href') || '').indexOf('window.close') === -1) continue;

            var img = a.querySelector('img');
            if (!img || !img.parentNode) continue;

            var svg = document.createElementNS(SVG_NS, 'svg');
            svg.setAttribute('class', 'xxt-ic');
            svg.setAttribute('data-icon', 'x');
            svg.setAttribute('aria-hidden', 'true');
            svg.setAttribute('focusable', 'false');

            var use = document.createElementNS(SVG_NS, 'use');
            use.setAttribute('href', '#i-x');
            svg.appendChild(use);

            img.parentNode.replaceChild(svg, img);
            a.setAttribute('data-xxt-close', '1');
        }
    }

    function injectSprite() {
        if (document.getElementById('xxt-icon-sprite')) return;
        var host = document.createElement('div');
        host.id = 'xxt-icon-sprite';
        host.setAttribute('aria-hidden', 'true');
        host.innerHTML = window.XXT_ICON_SPRITE;
        document.body.insertBefore(host, document.body.firstChild);
    }

    function swapIcons() {
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
            svg.setAttribute('data-icon', id.replace(/^i-/, ''));
            svg.setAttribute('aria-hidden', 'true');
            svg.setAttribute('focusable', 'false');

            // 沿用原来的像素尺寸(文章页的图标基本都是 16px)
            var w = parseInt(img.getAttribute('width') || '', 10);
            var h = parseInt(img.getAttribute('height') || '', 10);
            if (w) {
                svg.style.width = w + 'px';
                svg.style.height = (h || w) + 'px';
            }

            var use = document.createElementNS(SVG_NS, 'use');
            use.setAttribute('href', '#' + id);
            svg.appendChild(use);

            if (img.parentNode) {
                img.parentNode.replaceChild(svg, img);
            }
        }
    }

    function run() {
        injectSprite();
        swapIcons();
        swapToolbarClose();

        /* 图片查看器由 image-viewer.js 在 DOMContentLoaded 时挂到 body 上,
           两处脚本的加载顺序不固定 —— 所以这里用 MutationObserver 兜住
           后出现的 <img>,它们一样会被换成矢量图标。 */
        if (window.MutationObserver) {
            new MutationObserver(function () {
                swapIcons();
            }).observe(document.body, { childList: true, subtree: true });
        }
    }

    function loadSprite(done) {
        // 主站已经加载过的话直接用,省一次请求(同一 URL 也是缓存命中)
        if (window.XXT_ICON_SPRITE && window.XXT_ICON_MAP) {
            done();
            return;
        }
        var s = document.createElement('script');
        s.src = SPRITE_URL;
        s.async = false;
        s.onload = done;
        s.onerror = function () {
            /* 图标加载失败不影响阅读,静默保留 PNG */
        };
        document.head.appendChild(s);
    }

    function boot() {
        loadSprite(run);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
