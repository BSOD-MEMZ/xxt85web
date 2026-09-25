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

    /* 需要替换的图标。用文件名查映射表,查不到就跳过原样保留 PNG。 */
    var ICON_SELECTOR = 'img[src$=".png"], img[src$=".gif"]';

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
