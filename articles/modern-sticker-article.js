/**
 * xxtsoft 文章页 · 手账主题配套脚本
 *
 * 由 article-theme-loader.js 在主站主题命中 ARTICLE_THEME_MAP 时加载。
 * 只做一件事:把文章页里的 PNG 图标换成矢量图标。
 *
 * 图标数据来自 ../js/modern-sticker-icons.js —— 与主站同一个文件,
 * 用户在首页已经加载过,文章页再引用会直接命中浏览器缓存,不产生额外流量。
 * 该文件载入后只是把数据挂在 window 上,不会自动注入,所以需要这里的代码。
 *
 * 不做的事(有意为之):
 *   · 不注入背景装饰 / 搜索框 / 卡片化 —— 那些是主站首页的东西,
 *     放在阅读页只会分散注意力。主站的 modern-sticker.js 因此不在此加载。
 *   · 不改动任何正文内容。
 */
(function () {
    'use strict';

    var SVG_NS = 'http://www.w3.org/2000/svg';
    var SPRITE_URL = '../js/modern-sticker-icons.js';

    /* 需要替换的图标。用文件名查映射表,查不到就跳过原样保留 PNG。

       ⚠️ 只排除一类元素 —— 它的点击事件直接绑在 <img> 实例上,
       而 addEventListener 是跟着元素走的,换掉 <img> 就等于把事件一起换没:

         · .uac-close-btn   UAC 对话框关闭键,uac.js 把监听直接绑在本体上
                            (它自己换完 <svg> 会重新绑,所以这里不能抢)

       ⚠️ 图片查看器的三个键(.image-viewer-close / -prev / -next)**必须留在这里** ——
       它们以前被 :not() 排除掉了,理由是"image-viewer.js 自己会换",
       但那个替换只在**精灵表已经加载好**时才生效:image-viewer.js 在
       DOMContentLoaded 里建弹层并当场升级,而精灵是本脚本那一刻才开始加载的
       → window.XXT_ICON_MAP 还不存在 → 升级被静默跳过,三个键一直是原始 PNG。
       现在交给这里:本脚本有"精灵加载完 → run()" + MutationObserver 双保险,
       弹层无论发生在加载前还是加载后都能被覆盖。
       (image-viewer.js 自己那套还在,两边幂等,谁先跑都只是跳过已换好的 <svg>。)
       点击不会丢 —— image-viewer.js 的关闭/翻页走的是 modal 上的事件委托。

       ⚠️⚠️ **必须加 [width] 这道闸**:正文里的**截图**很多也是 .png,
       文件名还会跟图标撞车 —— `articles/assets/warning.png` 是一张 1920×1080 的
       截图(alt="截图"),名字却正好是图标表里的 `warning.png`。原来只按后缀挑,
       那张截图会被换成 16px 的警告小图标,**而且页面零报错**。
       文章里真图标的特征很稳:要么带 width(16 / 20),要么就躺在 images/icons/ 下
       (`wefuckedsalt` 的 tips 里那枚 knowledges.png 就没写 width)。 */
    var ICON_SELECTOR =
        'img[width][src$=".png"]:not(.uac-close-btn), ' +
        'img[width][src$=".gif"]:not(.uac-close-btn), ' +
        'img[src*="images/icons/"]:not(.uac-close-btn)';

    /* 给某处按钮换矢量图标并"原样保留"原 <img> 的 class / 尺寸。
       返回新的 <svg>;查不到映射就返回 null,调用方自己决定要不要回退。 */
    function makeIcon(name, proto) {
        var map = window.XXT_ICON_MAP;
        if (!map) return null;
        var id = map[name];
        if (!id) return null;

        var svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('class', proto && proto.className
            ? 'xxt-ic ' + proto.className
            : 'xxt-ic');
        svg.setAttribute('data-icon', id.replace(/^i-/, ''));
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');

        var use = document.createElementNS(SVG_NS, 'use');
        use.setAttribute('href', '#' + id);
        svg.appendChild(use);
        return svg;
    }

    /* 头图上的「关闭页面」:文字保留,图标换成矢量叉
       (旧样式不走本脚本,原 PNG 一字未改)

       ⚠️ 用 close-dot 而不是普通的 i-x:站内所有关闭键都是这枚交通灯圆点
       (素材是 close.png,走上面的通用分支本来就映射到 close-dot),
       而 CSS 里那条 `.button:hover .xxt-ic[data-icon="close-dot"]`
       正是给这枚图标配的 hover 白叉 —— 两处对不上就会"有个叉永远不出现"。 */
    function swapToolbarClose() {
        var anchors = document.querySelectorAll('.gradient-divider .button');
        for (var i = 0; i < anchors.length; i++) {
            var a = anchors[i];
            if (a.getAttribute('data-xxt-close')) continue;
            if ((a.getAttribute('href') || '').indexOf('window.close') === -1) continue;

            var img = a.querySelector('img');
            if (!img || !img.parentNode) continue;

            var svg = document.createElementNS(SVG_NS, 'svg');
            svg.setAttribute('class', 'xxt-ic');
            svg.setAttribute('data-icon', 'close-dot');
            svg.setAttribute('aria-hidden', 'true');
            svg.setAttribute('focusable', 'false');

            var use = document.createElementNS(SVG_NS, 'use');
            use.setAttribute('href', '#i-close-dot');
            svg.appendChild(use);

            img.parentNode.replaceChild(svg, img);
            a.setAttribute('data-xxt-close', '1');
        }
    }

    /* ---- 正文图 → 拍立得 + 一条胶带 ----------------------------------
       ⚠️ 必须**包一层 <span>**:<img> 是替换元素,::before/::after 根本不渲染,
          胶带没法只靠 CSS 挂在图片上;而背景层又画不到图片内容之上
          (background 永远在内容下面),胶带会变成"被照片压住"。
       只包 .article-content 里**没有 width** 的图 —— 正文里的 16/20px 小图标
       都带 width,给它们套白框会变成一块巨大的白板。
       每张照片的倾角、胶带角度、胶带横向偏移都错开一点(刻意的不整齐)。 */
    var PHOTO_TILTS = ['-.7deg', '.5deg', '-.35deg', '.8deg', '-.55deg', '.35deg'];
    var TAPE_TILTS = ['-3deg', '2.5deg', '-1.5deg', '3.5deg', '-2deg'];
    var TAPE_SHIFTS = ['-14px', '10px', '-4px', '16px', '-9px'];
    var photoCount = 0;

    function buildPolaroids() {
        var imgs = document.querySelectorAll('.article-content img:not([width])');
        for (var i = 0; i < imgs.length; i++) {
            var img = imgs[i];
            var parent = img.parentNode;
            if (!parent) continue;
            // 幂等:已经包过就跳过(选择器拿不到父节点的类,所以在这里判)
            if (parent.className && (' ' + parent.className + ' ').indexOf(' xxt-photo ') > -1) continue;

            var wrap = document.createElement('span');
            wrap.className = 'xxt-photo';
            wrap.style.setProperty('--tilt', PHOTO_TILTS[photoCount % PHOTO_TILTS.length]);
            wrap.style.setProperty('--tape-tilt', TAPE_TILTS[photoCount % TAPE_TILTS.length]);
            wrap.style.setProperty('--tape-shift', TAPE_SHIFTS[photoCount % TAPE_SHIFTS.length]);
            photoCount++;

            parent.insertBefore(wrap, img);
            wrap.appendChild(img);
        }
    }

    function injectSprite() {
        if (document.getElementById('xxt-icon-sprite')) return;
        var host = document.createElement('div');
        host.id = 'xxt-icon-sprite';
        host.setAttribute('aria-hidden', 'true');
        host.innerHTML = window.XXT_ICON_SPRITE;
        document.body.insertBefore(host, document.body.firstChild);
    }

    function swapIcons() {
        var map = window.XXT_ICON_MAP;
        if (!map) return;

        var imgs = document.querySelectorAll(ICON_SELECTOR);
        for (var i = 0; i < imgs.length; i++) {
            var img = imgs[i];
            var src = img.getAttribute('src') || '';
            var name = src.split('/').pop().split('?')[0].split('#')[0];
            var id = map[name];
            if (!id) continue;

            var svg = document.createElementNS(SVG_NS, 'svg');
            svg.setAttribute('class', img.className ? 'xxt-ic ' + img.className : 'xxt-ic');
            svg.setAttribute('data-icon', id.replace(/^i-/, ''));
            svg.setAttribute('aria-hidden', 'true');
            svg.setAttribute('focusable', 'false');

            // 沿用原来的像素尺寸(文章页的图标基本都是 16px)
            var w = parseInt(img.getAttribute('width') || '', 10);
            var h = parseInt(img.getAttribute('height') || '', 10);
            if (w) {
                svg.style.width = w + 'px';
                svg.style.height = (h || w) + 'px';
            }

            var use = document.createElementNS(SVG_NS, 'use');
            use.setAttribute('href', '#' + id);
            svg.appendChild(use);

            /* title 原样带走(image-viewer.js 里那套替换也这么做)。
               图片查看器的三个键都带 title,换完不该把悬停提示弄丢 */
            var title = img.getAttribute('title');
            if (title) svg.setAttribute('title', title);

            if (img.parentNode) {
                img.parentNode.replaceChild(svg, img);
            }
        }
    }

    /* 图标交接门(与 js/modern-sticker.js 的同名函数、以及主题 CSS 第 14k 节配套):
       head 那段内联脚本在手账主题下给 <html> 挂了 xxt-ic-pending,把候选图标先藏住,
       免得"原始 PNG 一闪再变成矢量"。这里换完就摘掉 —— 不管换没换成,
       图标都得显示出来(`loadSprite` 的 onerror 也走 done,所以失败路径一样会到)。 */
    function releaseIconGate() {
        var de = document.documentElement;
        de.className = de.className.split('xxt-ic-pending').join(' ')
            .replace(/\s{2,}/g, ' ').replace(/^\s+|\s+$/g, '');
    }

    function run() {
        injectSprite();
        swapIcons();
        swapToolbarClose();
        buildPolaroids();
        releaseIconGate();

        /* 图片查看器由 image-viewer.js 在 DOMContentLoaded 时挂到 body 上,
           两处脚本的加载顺序不固定 —— 所以这里用 MutationObserver 兜住
           后出现的 <img>,它们一样会被换成矢量图标。 */
        if (window.MutationObserver) {
            new MutationObserver(function () {
                swapIcons();
                buildPolaroids();   // 幂等,包过的会跳过
            }).observe(document.body, { childList: true, subtree: true });
        }
    }

    function loadSprite(done) {
        // 主站已经加载过的话直接用,省一次请求(同一 URL 也是缓存命中)
        if (window.XXT_ICON_SPRITE && window.XXT_ICON_MAP) {
            done();
            return;
        }
        var s = document.createElement('script');
        s.src = SPRITE_URL;
        s.async = false;
        s.onload = done;
        s.onerror = function () {
            /* 图标加载失败不影响阅读,静默保留 PNG */
        };
        document.head.appendChild(s);
    }

    function boot() {
        loadSprite(run);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
