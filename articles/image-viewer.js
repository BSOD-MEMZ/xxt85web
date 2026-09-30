// 图片查看器功能
(function() {
    let currentImageIndex = -1;
    let images = [];

    // 创建模态框HTML
    function createModal() {
        const modal = document.createElement('div');
        modal.className = 'image-viewer-modal';
        modal.innerHTML = `
            <div class="image-viewer-content">
                <img class="image-viewer-close" src="imageclose.png" alt="Close" title="Close">
                <img class="image-viewer-img" src="" alt="Full size image">
                <img class="image-viewer-nav image-viewer-prev" src="left.png" alt="Previous" title="Previous">
                <img class="image-viewer-nav image-viewer-next" src="right.png" alt="Next" title="Next">
            </div>
        `;
        return modal;
    }

    // 初始化图片查看器
    function init() {
        // 获取所有文章内容中的图片
        const contentImages = document.querySelectorAll('.article-content img');

        if (contentImages.length === 0) return;

        // 工具栏那三枚图标不在 .article-content 里,但要防患于未然 ——
        // 它们和正文图放一起会被当成可预览的图。
        const DECOR_ICONS = /(^|\/)(close|home|printer|left|right|imageclose)\.png$/i;

        // tips 块里那些行内小图标(16 / 20px)同样不是正文图。
        //
        // 它们**带 width 属性**,而正文里的真实截图一律不写 width —— 要么什么都不写,
        // 要么写 inline style(`style="width:300px;height:auto"`)。
        // 全站 511 张 <img> 统计下来,width 属性只出现过 16 和 20 两个值,全是图标。
        // 另有 6 张 `../images/icons/knowledges.png` 连 width 都没写,
        // 所以再按目录兜一道(站点图标都在 images/icons/ 下,正文图不在那儿)。
        //
        // 不排除会怎样:正文第一张照片在序列里的下标变成 1 →"上一张"永远不灰;
        // 而且一路往前翻,会翻到那张 16px 图标被放大铺满整屏。
        const ICON_MAX = 24;                            // px:宽度属性比它小 = 图标
        const ICON_DIR = /(^|\/)images\/icons\//i;

        // 判定"这是一张正文图"。
        //
        // ⚠️ 别用 `img.src && !img.src.includes('.png') || img.src.includes('.jpg') || ...`
        // 这种写法:`&&` 比 `||` 结合得紧,实际等价于
        //     (src && 不是png) || 是jpg || 是jpeg || ...
        // 于是**所有纯 .png 的正文图会被整条排除**(png 不可能又同时是 jpg),
        // 表现就是"点图片打不开预览"。bmp / webp / gif 等也会被漏掉。
        // 这里改成:排除已知的装饰图标与行内小图标,其余一律当作正文图。
        images = Array.from(contentImages).filter(img => {
            const src = img.getAttribute('src') || img.src || '';
            if (!src) return false;

            const path = src.split('?')[0].split('#')[0];
            if (DECOR_ICONS.test(path)) return false;
            if (ICON_DIR.test(path)) return false;

            const w = parseInt(img.getAttribute('width') || '', 10);
            if (!isNaN(w) && w <= ICON_MAX) return false;

            return true;
        });

        if (images.length === 0) return;

        // 创建模态框
        const modal = createModal();
        document.body.appendChild(modal);

        const imgElement = modal.querySelector('.image-viewer-img');

        // ⚠️ 导航 / 关闭按钮**不能**在这里缓存成常量:
        // 手账主题会把它们从 <img> 换成 <svg>,缓存下来的引用会失效
        // (样式加在脱离文档的旧节点上,看起来就是"按钮没反应/状态不对")。
        // 所以一律用函数实时取。
        const q = (sel) => modal.querySelector(sel);
        const navBtns = () => [q('.image-viewer-prev'), q('.image-viewer-next')];

        // 为每个图片添加点击事件
        images.forEach((img, index) => {
            img.addEventListener('click', function(e) {
                e.stopPropagation();
                showImage(index, modal, imgElement);
            });
        });

        // 关闭 / 上一张 / 下一张:统一走**事件委托**,挂在不会变动的 modal 上。
        // 这样无论图标是 PNG 还是被主题脚本换成了 <svg>,点击都不会失效
        // —— 之前是直接绑在 <img> 上,换掉节点后事件就跟着没了。
        modal.addEventListener('click', function (e) {
            var t = e.target;

            if (t.closest && t.closest('.image-viewer-close')) {
                e.stopPropagation();
                closeModal(modal);
                return;
            }
            if (t.closest && t.closest('.image-viewer-prev')) {
                e.stopPropagation();
                if (currentImageIndex > 0) {
                    currentImageIndex--;
                    showImage(currentImageIndex, modal, imgElement);
                }
                return;
            }
            if (t.closest && t.closest('.image-viewer-next')) {
                e.stopPropagation();
                if (currentImageIndex < images.length - 1) {
                    currentImageIndex++;
                    showImage(currentImageIndex, modal, imgElement);
                }
            }
        });

        // 初始化按钮状态（只有一张图片的情况）
        // —— 交给 showImage 统一处理,它也实时查询按钮,天然兼容图标替换
        if (images.length === 1) {
            var btns = navBtns();
            setNavState(btns[0], true, 'left.png', 'left_disable.png');
            setNavState(btns[1], true, 'right.png', 'right_disable.png');
        }

        // 点击背景关闭
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal(modal);
            }
        });

        // 键盘快捷键
        document.addEventListener('keydown', function(e) {
            if (modal.classList.contains('active')) {
                if (e.key === 'Escape') {
                    closeModal(modal);
                } else if (e.key === 'ArrowLeft' && currentImageIndex > 0) {
                    currentImageIndex--;
                    showImage(currentImageIndex, modal, imgElement);
                } else if (e.key === 'ArrowRight' && currentImageIndex < images.length - 1) {
                    currentImageIndex++;
                    showImage(currentImageIndex, modal, imgElement);
                }
            }
        });

        // 事件全部绑完(且用的是委托,不怕换节点),再尝试把手账主题的
        // 矢量图标换上去。换图标在主题脚本那边也会做,这里只是"抢答"——
        // 谁先跑都无所谓,因为点击走委托,不会再丢。
        upgradeThemeIcons(modal);
    }

    /* 手账主题下,两处脚本都会给弹层换图标,谁先加载不确定。
       这里做一遍幂等替换:已经是 <svg> 的跳过,还是 <img> 的换掉。

       旧主题(默认样式)命中不了任何分支 —— 没有 XXT_ICON_MAP,直接返回,
       行为一字未改。 */
    function upgradeThemeIcons(modal) {
        if (!window.XXT_ICON_MAP) return;

        var spec = [
            { cls: 'image-viewer-close', icon: 'imageclose.png', fallback: 'x' },
            { cls: 'image-viewer-nav image-viewer-prev', icon: 'left.png', fallback: 'left' },
            { cls: 'image-viewer-nav image-viewer-next', icon: 'right.png', fallback: 'right' }
        ];

        spec.forEach(function (item) {
            var primary = item.cls.split(' ')[0];
            var el = modal.querySelector('.' + primary);
            if (!el) return;
            if (el.tagName.toLowerCase() === 'svg') return;   // 已升级,跳过

            var id = window.XXT_ICON_MAP[item.icon] ||
                     window.XXT_ICON_MAP[item.fallback];
            if (!id) return;

            var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('class', 'xxt-ic ' + item.cls);
            svg.setAttribute('data-icon', id.replace(/^i-/, ''));
            svg.setAttribute('aria-hidden', 'true');
            svg.setAttribute('focusable', 'false');

            var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
            use.setAttribute('href', '#' + id);
            use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + id);
            svg.appendChild(use);

            // 保留原 <img> 上的 title(无障碍 / 悬停提示)
            var title = el.getAttribute('title');
            if (title) svg.setAttribute('title', title);

            if (el.parentNode) {
                el.parentNode.replaceChild(svg, el);
            }
        });
    }

    // 显示图片
    // 只收 (index, modal, imgElement):导航按钮一律实时查询,
    // 因为主题脚本随时可能把它们换成 <svg>(见 init() 里的说明)。
    function showImage(index, modal, imgElement) {
        if (index < 0 || index >= images.length) return;

        currentImageIndex = index;
        imgElement.src = images[index].src;
        modal.classList.add('active');

        // 更新导航按钮状态。
        // 新主题下按钮已被换成 <svg>,所以状态用 class(is-disabled)表达,
        // 只有按钮仍是 <img> 时才回退到换图。
        var prevBtn = modal.querySelector('.image-viewer-prev');
        var nextBtn = modal.querySelector('.image-viewer-next');

        if (prevBtn && nextBtn) {
            var atFirst = currentImageIndex === 0;
            var atLast = currentImageIndex === images.length - 1;

            setNavState(prevBtn, atFirst, 'left.png', 'left_disable.png');
            setNavState(nextBtn, atLast, 'right.png', 'right_disable.png');
        }
    }

    function setNavState(btn, disabled, normalSrc, disabledSrc) {
        if (btn.tagName === 'IMG') {
            btn.src = disabled ? disabledSrc : normalSrc;
            btn.style.opacity = disabled ? '0.5' : '';
            btn.style.cursor = disabled ? 'not-allowed' : 'pointer';
            return;
        }
        // 矢量按钮:只切 class,样式由 CSS 接管
        if (disabled) {
            btn.classList.add('is-disabled');
        } else {
            btn.classList.remove('is-disabled');
        }
    }

    // 关闭模态框
    // closing 类先播退场动画,动画结束(或兜底超时)再真正隐藏。
    // 连点 / 快速 ESC 用 _closing 标记挡住,避免动画被反复打断。
    function closeModal(modal) {
        if (modal._closing) return;
        modal._closing = true;
        modal.classList.add('closing');

        var done = false;
        function finish() {
            if (done) return;
            done = true;
            if (modal._closeTimer) {
                clearTimeout(modal._closeTimer);
                modal._closeTimer = null;
            }
            modal.classList.remove('active', 'closing');
            modal._closing = false;
            currentImageIndex = -1;
        }

        modal.addEventListener('animationend', finish, { once: true });
        // 兜底:用户开了「减少动态效果」时动画会被禁用,这里保证一定收尾
        modal._closeTimer = setTimeout(finish, 320);
    }

    // DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

// ==================== 代码块包裹 + 复制按钮（IE 兼容） ====================
(function () {
    function initCodeCopy() {
        var pres = document.querySelectorAll('.article-content pre');
        for (var i = 0; i < pres.length; i++) {
            (function (pre) {
                // 跳过已被包裹的
                if (pre.parentNode.className === 'xxt-code-block') return;

                // 检测语言类型，设置标题
                var codeEl = pre.querySelector('code');
                var rawText = (codeEl ? (codeEl.innerText || codeEl.textContent) : (pre.innerText || pre.textContent)) || '';
                var langLabel = /^[ \t]*(import |from |def |class |if __name__)/m.test(rawText) ? 'Python' : '\u4ee3\u7801';

                // 创建外层容器
                var wrapper = document.createElement('div');
                wrapper.className = 'xxt-code-block';

                // 创建标题栏
                var title = document.createElement('div');
                title.className = 'xxt-code-title';
                title.appendChild(document.createTextNode(langLabel));

                // 创建复制按钮
                var copyBtn = document.createElement('div');
                copyBtn.className = 'xxt-copy-btn';
                copyBtn.title = '\u590d\u5236\u4ee3\u7801';

                // 将 <pre> 包裹进容器
                pre.parentNode.insertBefore(wrapper, pre);
                wrapper.appendChild(title);
                wrapper.appendChild(pre);
                wrapper.appendChild(copyBtn);

                // 绑定复制事件
                copyBtn.onclick = function (e) {
                    e.stopPropagation();
                    var codeText = pre.innerText || pre.textContent || '';

                    // IE 兼容
                    if (window.clipboardData && window.clipboardData.setData) {
                        window.clipboardData.setData('Text', codeText);
                    } else {
                        var ta = document.createElement('textarea');
                        ta.value = codeText;
                        ta.style.position = 'fixed';
                        ta.style.left = '-9999px';
                        ta.style.top = '-9999px';
                        document.body.appendChild(ta);
                        ta.select();
                        try { document.execCommand('copy'); } catch (err) {}
                        document.body.removeChild(ta);
                    }

                    // 反馈:原图标缩小消失 → 绿色对勾浮出 → 还原成复制按钮
                    // 用两段定时器串起来(IE 兼容,不用 class 动画的 animationend)
                    copyBtn.className = 'xxt-copy-btn xxt-copy-shrink';
                    clearTimeout(copyBtn._t1);
                    clearTimeout(copyBtn._t2);
                    copyBtn._t1 = setTimeout(function () {
                        copyBtn.className = 'xxt-copy-btn xxt-copy-check';
                        copyBtn._t2 = setTimeout(function () {
                            copyBtn.className = 'xxt-copy-btn xxt-copy-out';
                            copyBtn._t3 = setTimeout(function () {
                                copyBtn.className = 'xxt-copy-btn';
                            }, 200);
                        }, 900);
                    }, 180);
                };
            })(pres[i]);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCodeCopy);
    } else {
        initCodeCopy();
    }
})();
