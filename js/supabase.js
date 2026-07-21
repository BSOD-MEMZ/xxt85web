/**
 * Supabase 客户端初始化
 * 
 * 使用前请先在 https://supabase.com 创建项目，然后替换下面的 URL 和 publishable key。
 * publishable key 是公开的、可安全暴露在前端代码中，数据库安全由 RLS（行级安全）策略保障。
 */

(function () {
  'use strict';

  var SUPABASE_URL = 'https://hdgdqfseqsvqtqwcpfdu.supabase.co';
  var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_zQZQ_BGRpZjNwUA-HeiaOw_pPK70fWi';

  // 如果尚未配置，跳过初始化
  if (SUPABASE_URL.indexOf('xxxxxxxxxxxx') !== -1) {
    console.warn('[xxtsoft] Supabase 尚未配置，请在 js/supabase.js 中填入你的项目 URL 和 publishable key。');
    window.__xxtSupabase = null;
    return;
  }

  // 动态加载 UMD 版本（兼容无打包工具的静态页面）
  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
  script.onload = function () {
    try {
      // UMD 构建会将 supabase 挂到 window.supabase
      var sbLib = window.supabase;
      if (!sbLib || !sbLib.createClient) {
        throw new Error('Supabase SDK 加载异常，请刷新页面重试');
      }
      window.__xxtSupabase = sbLib.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
      console.log('[xxtsoft] Supabase 初始化成功');
      document.dispatchEvent(new CustomEvent('xxt:supabase-ready'));
    } catch (e) {
      console.error('[xxtsoft] Supabase 初始化失败:', e);
      window.__xxtSupabase = null;
    }
  };
  script.onerror = function () {
    console.error('[xxtsoft] 无法加载 Supabase SDK，请检查网络连接。');
    window.__xxtSupabase = null;
  };
  document.head.appendChild(script);
})();
