/**
 * xxtsoft 文章主题加载器
 *
 * 两层主题,按优先级从高到低:
 *   1. 主站主题 —— localStorage['theme'] 命中 ARTICLE_THEME_MAP 时,
 *      把本站默认的 style.css 换成对应的文章页主题样式。
 *      这样用户在主站切到手账主题后,文章页也是同一套外观。
 *   2. 文章排版偏好 —— localStorage['article_css'](仅首页控制面板可改),
 *      在 default / zuowen(作文本)之间切换。
 *
 * 默认(即什么都不命中)保持本站原有的 style.css,行为与加入本机制前一致。
 * 新增主站主题时,只需在 ARTICLE_THEME_MAP 里登记一行;
 * 未登记的现代主题不会误替换样式,文章页会安全地保持默认外观。
 *
 * 在 articles/ 目录下的所有文章页面中引入。
 */
(function () {
    'use strict';

    /* 主站主题 → 文章页样式。键是 localStorage['theme'] 的值(主题文件名)。 */
    var ARTICLE_THEME_MAP = {
        'modern-sticker.css': 'modern-sticker-article.css'
    };

    function readKey(key) {
        try {
            return localStorage.getItem(key) || '';
        } catch (err) {
            return '';
        }
    }

    /* 定位本站默认样式表的 link。
       用精确匹配而不是 indexOf('style.css') —— 后者会连带命中 zuowen-style.css */
    function findDefaultLink() {
        var links = document.querySelectorAll('link[rel="stylesheet"]');
        for (var i = 0; i < links.length; i++) {
            var href = links[i].getAttribute('href') || '';
            if (/(^|\/)style\.css$/.test(href)) {
                return links[i];
            }
        }
        return null;
    }

    /* 主题同名脚本:modern-sticker-article.css → modern-sticker-article.js
       没有这个文件也不影响样式(静默略过) */
    function loadScript(src) {
        var s = document.createElement('script');
        s.src = src;
        s.defer = true;
        s.onerror = function () { /* 无配套脚本,或加载失败:样式照常生效 */ };
        document.head.appendChild(s);
    }

    /* ---- 1. 主站主题优先 ---- */
    var mapped = ARTICLE_THEME_MAP[readKey('theme')];
    if (mapped) {
        var link = findDefaultLink();
        if (link) {
            link.setAttribute('href', mapped);
        }
        loadScript(mapped.replace(/\.css$/, '.js'));
        return;
    }

    /* ---- 2. 原有的文章排版偏好(逻辑未改动) ---- */
    var articleCss = readKey('article_css') || 'default';

    if (articleCss === 'zuowen') {
        // 禁用默认的 style.css
        var links = document.querySelectorAll('link[rel="stylesheet"]');
        for (var i = 0; i < links.length; i++) {
            if (links[i].href.indexOf('style.css') !== -1) {
                links[i].disabled = true;
                break;
            }
        }
        // 注入作文本CSS
        var zuowenLink = document.createElement('link');
        zuowenLink.rel = 'stylesheet';
        zuowenLink.id = 'zuowenCss';
        zuowenLink.href = 'zuowen-style.css';
        document.head.appendChild(zuowenLink);
    }
})();
