const live2d_path = (() => {
  const script = document.currentScript;
  if (script) {
    const src = script.src;
    return src.substring(0, src.lastIndexOf('/') + 1);
  }
  // 回退：根据当前页面路径推断（适用于本地调试）
  return window.location.origin + '/live2d-widget/dist/';
})();

function loadExternalResource(url, type) {
  return new Promise((resolve, reject) => {
    let tag;

    if (type === 'css') {
      tag = document.createElement('link');
      tag.rel = 'stylesheet';
      tag.href = url;
    }
    else if (type === 'js') {
      tag = document.createElement('script');
      tag.type = 'module';
      tag.src = url;
    }
    if (tag) {
      tag.onload = () => resolve(url);
      tag.onerror = () => reject(url);
      document.head.appendChild(tag);
    }
  });
}

(async () => {
  const OriginalImage = window.Image;
  window.Image = function(...args) {
    const img = new OriginalImage(...args);
    img.crossOrigin = "anonymous";
    return img;
  };
  window.Image.prototype = OriginalImage.prototype;
  await Promise.all([
    loadExternalResource(live2d_path + 'waifu.css', 'css'),
    loadExternalResource(live2d_path + 'waifu-tips.js', 'js')
  ]);
  initWidget({
    waifuPath: live2d_path + 'waifu-tips.json',
    // cdnPath: 'https://fastly.jsdelivr.net/gh/fghrsh/live2d_api/',
    cubism2Path: live2d_path + 'live2d.min.js',
    // cubism5Path 指向 live2d 官方 CDN,但本站的模型(bilibili-live 22/33)
    // 全是 Cubism 2 的 model.moc,版本判定为 2 —— 这条路径永远不会被读取。
    // 留着它等于给页面挂了一个用不到的外部域名,与本站"零第三方 CDN"的原则冲突,
    // 所以直接去掉(真要用 Cubism 5 模型时再补一个本地化的路径)。
    cubism5Path: live2d_path + 'live2dcubismcore.min.js',
    //tools: ['hitokoto', 'asteroids', 'switch-model', 'switch-texture', 'search', 'info', 'quit'],
    tools: ['search', 'hitokoto', 'asteroids', 'switch-model', 'chat', 'quit'],
    logLevel: 'warn',
    drag: false,
  });
})();

console.log("Live2D 加载成功");