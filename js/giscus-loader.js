/**
 * Giscus 评论区加载器
 *
 * 注意:这个文件只负责建 <script>;真正的评论界面跑在 giscus.app 的 iframe 里,
 * 父页面的 CSS **一条也进不去** —— 所以"给评论区换主题"只能靠 data-theme
 * 指向一份 giscus 读得懂的 CSS:
 *
 *   css/giscus-theme.css           默认主题(Vista / Aero 蓝)—— 原样保留
 *   css/giscus-sticker-theme.css   手账主题(内页米黄 + 墨色 + 珊瑚/青)
 *
 * ⚠️ 主题地址必须是**绝对 https URL**。giscus 是在 giscus.app 那个 iframe 里
 *    去取这份 CSS 的:相对路径会解析到 giscus.app 上,而指到 http(localhost)
 *    会被浏览器当混合内容拦掉。所以**本地预览看不到新的 giscus 主题,
 *    得部署之后刷新才算数** —— 这是这条链路的固有限制,不是没生效。
 *
 * ⚠️ 主题只在加载时挑一次。评论区只出现在文章页 / 留言本 / 播放页,
 *    那几处都没有主题切换器(切换器只在首页),所以不需要运行时重设。
 *    真要加,得给 iframe postMessage({ giscus: { setConfig: { theme } } })。
 */
(function () {
  'use strict';

  var container = document.querySelector('.giscus');
  if (!container) return;

  var SITE = 'https://xxtsoft.top/css/';
  var THEME_VISTA = SITE + 'giscus-theme.css';
  var THEME_STICKER = SITE + 'giscus-sticker-theme.css';

  /* 与 js/uac.js 同一套判定:主题名就是 localStorage['theme'] 里的文件名。
     读不到(隐私模式)就按默认主题走。 */
  function currentTheme() {
    try {
      return localStorage.getItem('theme') || '';
    } catch (err) {
      return '';
    }
  }

  var themeUrl = currentTheme().indexOf('modern-sticker') > -1 ? THEME_STICKER : THEME_VISTA;

  var script = document.createElement('script');
  script.src = 'https://giscus.app/client.js';
  script.setAttribute('data-repo', 'BSOD-MEMZ/xxt85web');
  script.setAttribute('data-repo-id', 'R_kgDOPBiDtw');
  script.setAttribute('data-category', 'Announcements');
  script.setAttribute('data-category-id', 'DIC_kwDOPBiDt84C-n-h');
  script.setAttribute('data-mapping', 'pathname');
  script.setAttribute('data-strict', '0');
  script.setAttribute('data-reactions-enabled', '1');
  script.setAttribute('data-emit-metadata', '0');
  script.setAttribute('data-input-position', 'top');
  script.setAttribute('data-theme', themeUrl);
  script.setAttribute('data-lang', 'zh-CN');
  script.setAttribute('crossorigin', 'anonymous');
  script.async = true;

  container.appendChild(script);
})();
