/**
 * xxtsoft 文章主题加载器
 * 从 localStorage 读取文章CSS偏好设置，动态切换文章页面样式
 * 在 articles/ 目录下的所有文章页面中引入
 */
(function () {
    'use strict';
    var articleCss = localStorage.getItem('article_css') || 'default';

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
