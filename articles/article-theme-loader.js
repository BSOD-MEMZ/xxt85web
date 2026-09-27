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
        /* 本文件在文章页里被引入了**两次**(head 与 body 结尾),没有闸门就会
           插两份 <script> —— 同一个 URL 浏览器只下载一次,但会**执行两遍**。
           (配套脚本本身是幂等的,所以此前没出过事;但不该靠它兜着。) */
        if (window.__xxtArticleThemeScript === src) return;
        window.__xxtArticleThemeScript = src;

        var s = document.createElement('script');
        s.src = src;
        s.defer = true;
        s.onerror = function () { /* 无配套脚本,或加载失败:样式照常生效 */ };
        document.head.appendChild(s);
    }

    /* ---- 1. 主站主题优先 ---- */
    var mapped = ARTICLE_THEME_MAP[readKey('theme')];
    if (mapped) {
        /* ⚠️ 首屏那份样式表现在由页面 head 里的内联脚本直接给出(见 AGENTS.md 坑 25),
           所以这里一般都**找不到** style.css 那个 link —— 找不到就跳过,
           别新建,否则同一份样式会被挂两次。 */
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
        /* 头里那段内联脚本已经直接给了 zuowen-style.css 的话,这里什么都不用做
           —— 否则会再插一份同样的 link,而且下面那个"禁用默认样式"的循环
             用 indexOf('style.css') 判断,会把 zuowen-style.css 也一起禁用掉
             (它名字里就含 "style.css"),于是刚给的那份被自己关掉。 */
        var sheets = document.querySelectorAll('link[rel="stylesheet"]');
        var i, hasZuowen = false;
        for (i = 0; i < sheets.length; i++) {
            if (/(^|\/)zuowen-style\.css$/.test(sheets[i].getAttribute('href') || '')) {
                hasZuowen = true;
                break;
            }
        }
        if (hasZuowen) return;

        // 禁用默认的 style.css(精确匹配:indexOf('style.css') 会连带命中 zuowen-style.css)
        for (i = 0; i < sheets.length; i++) {
            if (/(^|\/)style\.css$/.test(sheets[i].getAttribute('href') || '')) {
                sheets[i].disabled = true;
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
