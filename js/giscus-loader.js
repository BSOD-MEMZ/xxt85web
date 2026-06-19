(function () {
  'use strict';

  var container = document.querySelector('.giscus');
  if (!container) return;

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
  script.setAttribute('data-theme', 'https://xxtsoft.top/css/giscus-theme.css');
  script.setAttribute('data-lang', 'zh-CN');
  script.setAttribute('crossorigin', 'anonymous');
  script.async = true;

  container.appendChild(script);
})();
