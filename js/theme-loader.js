/**
 * xxtsoft 主题加载器
 * 从 localStorage 读取保存的主题并应用
 * 所有页面引入此脚本即可共享主题
 */
(function () {
    'use strict';
    var theme = localStorage.getItem('theme') || 'style.css';
    var link = document.getElementById('themeCss');
    if (link) link.href = theme;
})();
