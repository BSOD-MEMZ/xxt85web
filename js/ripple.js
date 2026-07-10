/**
 * xxtsoft 触摸涟漪效果
 * 仅在非 Windows 系统且支持触摸屏时启用
 * 触摸时在触点位置播放 12 帧涟漪动画，不影响正常交互
 *
 * 调试模式：在 URL 后加 ?ripple=debug 可在任意设备上用鼠标点击测试涟漪效果
 */
(function () {
  'use strict';

  // 调试模式：URL 参数 ?ripple=debug 强制启用，鼠标点击也可触发
  var isDebug = /[?&]ripple=debug(&|$)/i.test(window.location.search);

  // 读取用户设置：ripple_enabled 为 "true" 时才开启（默认关闭，需手动在控制面板打开）
  if (!isDebug && localStorage.getItem('ripple_enabled') !== 'true') return;

  // 检测是否为 Windows 系统
  var isWindows = /Windows/i.test(navigator.userAgent);

  // 检测是否为触摸设备
  var isTouchDevice = 'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0;

  // 非调试模式下：Windows 或非触摸设备不启用涟漪
  if (!isDebug && (isWindows || !isTouchDevice)) return;

  var totalFrames = 12;
  var frameInterval = 20;
  var rippleSize = 65; // 精灵图每帧尺寸 65x65，总图 65x780（12帧纵向排列）

  /**
   * 创建涟漪元素并播放精灵图动画
   * @param {number} x - 触摸点 X 坐标（视口坐标）
   * @param {number} y - 触摸点 Y 坐标（视口坐标）
   */
  function createRipple(x, y) {
    var el = document.createElement('div');
    el.className = 'touch-ripple';

    // 定位：居中于触摸点
    el.style.left = (x - rippleSize / 2) + 'px';
    el.style.top  = (y - rippleSize / 2) + 'px';

    document.body.appendChild(el);

    // 逐帧播放：移动 background-position-y（负值向上偏移）
    var frameIndex = 0;
    var timer = setInterval(function () {
      frameIndex++;
      if (frameIndex >= totalFrames) {
        clearInterval(timer);
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
        return;
      }
      el.style.backgroundPositionY = -(frameIndex * rippleSize) + 'px';
    }, frameInterval);
  }

  // 监听触摸事件
  document.addEventListener('touchstart', function (e) {
    // 对每个触摸点都创建涟漪
    // 使用 clientX/clientY 而非 pageX/pageY，因为涟漪元素是 position:fixed，
    // 需要视口坐标而非页面坐标（后者含滚动偏移，会导致滚动后涟漪错位）
    for (var i = 0; i < e.changedTouches.length; i++) {
      var touch = e.changedTouches[i];
      createRipple(touch.clientX, touch.clientY);
    }
  }, { passive: true });

  // 调试模式：鼠标点击也可触发涟漪
  if (isDebug) {
    document.addEventListener('click', function (e) {
      createRipple(e.pageX, e.pageY);
    });
  }
})();
