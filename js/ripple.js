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

  // 读取用户设置：ripple_enabled 为 "false" 时关闭（默认开启）
  if (!isDebug && localStorage.getItem('ripple_enabled') === 'false') return;

  // 检测是否为 Windows 系统
  var isWindows = /Windows/i.test(navigator.userAgent);

  // 检测是否为触摸设备
  var isTouchDevice = 'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0;

  // 非调试模式下：Windows 或非触摸设备不启用涟漪
  if (!isDebug && (isWindows || !isTouchDevice)) return;

  var rippleBasePath = 'images/ripple/';
  var totalFrames = 12;
  var frameInterval = 20;
  var rippleSize = 65; // 图片尺寸 65x65

  /**
   * 创建涟漪元素并播放动画
   * @param {number} x - 触摸点 X 坐标（页面坐标）
   * @param {number} y - 触摸点 Y 坐标（页面坐标）
   */
  function createRipple(x, y) {
    var el = document.createElement('div');
    el.className = 'touch-ripple';

    // 计算位置（居中于触摸点）
    var left = x - rippleSize / 2;
    var top = y - rippleSize / 2;

    el.style.left = left + 'px';
    el.style.top = top + 'px';

    var img = document.createElement('img');
    img.src = rippleBasePath + '0.png';
    img.width = rippleSize;
    img.height = rippleSize;
    img.alt = '';
    img.draggable = false;
    el.appendChild(img);

    document.body.appendChild(el);

    // 逐帧播放
    var frameIndex = 0;
    var timer = setInterval(function () {
      frameIndex++;
      if (frameIndex >= totalFrames) {
        clearInterval(timer);
        // 动画结束，移除元素
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
        return;
      }
      img.src = rippleBasePath + frameIndex + '.png';
    }, frameInterval);
  }

  // 监听触摸事件
  document.addEventListener('touchstart', function (e) {
    // 对每个触摸点都创建涟漪
    for (var i = 0; i < e.changedTouches.length; i++) {
      var touch = e.changedTouches[i];
      createRipple(touch.pageX, touch.pageY);
    }
  }, { passive: true });

  // 调试模式：鼠标点击也可触发涟漪
  if (isDebug) {
    document.addEventListener('click', function (e) {
      createRipple(e.pageX, e.pageY);
    });
  }
})();
