/**
 * xxtsoft 主题加载器
 * 从 localStorage 读取保存的主题并应用
 * 所有页面引入此脚本即可共享主题
 */
(function () {
    'use strict';
    var theme = localStorage.getItem('theme') || 'style.css';
    var link = document.getElementById('themeCss');

    // 从 theme-loader.js 自身位置推导站点根目录，兼容 file:// 和 http(s)://
    var rootPath = document.currentScript.src.replace(/\/js\/theme-loader\.js.*$/, '/');

    if (link) {
        link.href = rootPath + theme;

        // 部分主题带有配套脚本(modern-xxx.css → js/modern-xxx.js)。
        // 默认主题 style.css / xpstyle.css 不匹配此规则，行为与改动前完全一致。
        var paired = /^(modern[a-z0-9-]*)\.css$/i.exec(theme);
        if (paired) {
            var script = document.createElement('script');
            script.src = rootPath + 'js/' + paired[1] + '.js';
            script.defer = true;
            document.head.appendChild(script);
        }
    }

    // 首次访问时引导选择风格。用户已经选过就不再加载这个脚本。
    // 首屏往往是默认主题，所以这段必须放在这里 —— 它是所有页面共用的入口。
    var picked = false;
    try {
        picked = localStorage.getItem('xxt-theme-picked') === '1' ||
            localStorage.getItem('xxt-theme-never') === '1';
    } catch (err) {
        picked = false;
    }

    var force = /[?&]theme-picker=1/.test(window.location.search);
    if (picked && !force) return;

    function loadPicker() {
        var s = document.createElement('script');
        s.src = rootPath + 'js/theme-picker.js';
        document.head.appendChild(s);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadPicker);
    } else {
        loadPicker();
    }
})();
