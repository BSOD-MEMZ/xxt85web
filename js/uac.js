(function () {
    'use strict';

    if (localStorage.getItem('uac_enabled') === 'false') return;
    if (window.__uac_shown) return;
    window.__uac_shown = true;
    var bannerText = window.UAC_BANNER || '';
    var bodyMessage = window.UAC_MESSAGE || '';

    var s = document.currentScript;
    if (s) {
        if (s.getAttribute('data-uac-banner')) bannerText = s.getAttribute('data-uac-banner');
        if (s.getAttribute('data-uac-message')) bodyMessage = s.getAttribute('data-uac-message');
    }

    if (!bannerText) bannerText = 'Windows 需要您的许可才能继续';
    if (!bodyMessage) bodyMessage = '如果已启动此操作，请继续。';

    // ── 路径 ──
    function rootPath() {
        if (window.__uac_rp) return window.__uac_rp;
        var ss = document.getElementsByTagName('script');
        for (var i = ss.length - 1; i >= 0; i--) {
            if (ss[i].src && ss[i].src.indexOf('uac.js') !== -1) {
                window.__uac_rp = ss[i].src.replace(/\/js\/uac\.js.*$/, '/');
                return window.__uac_rp;
            }
        }
        return (window.__uac_rp = '');
    }

    var RP = rootPath();

    // ── 主题判定 ──
    // 必须在这里就判出来,下面注入样式要用。
    // 兼容读不到 localStorage 的情况(隐私模式)→ 当作默认主题。
    var IS_STICKER = false;
    try {
        IS_STICKER = (localStorage.getItem('theme') || '').indexOf('modern-sticker') > -1;
    } catch (e) {
        IS_STICKER = false;
    }

    // ── 播放音效 ──
    function playSound(file) {
        try {
            var a = new Audio(RP + file);
            a.volume = 0.8;
            a.play().catch(function(){});
        } catch(e) {}
    }

    // ── 注入样式 ──
    (function () {
        var id = 'uac-injected-styles';
        if (document.getElementById(id)) return;
        var st = document.createElement('style');
        st.id = id;
        st.textContent = [
            'body.uac-active{overflow:hidden}',
            '.uac-overlay{',
            'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;',
            'background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center',
            '}',
            /* 对话框 — Vista Aero 框线 */
            '.uac-dialog{',
            'position:relative;',
            'width:430px;max-width:92vw;margin:0;outline:none;',
            'border:none;border-radius:0;background:none',
            '}',
            /* 左框线 */
            '.uac-dialog::before{',
            'content:"";position:absolute;left:0;top:29px;bottom:6px;width:8px;',
            'background:url(' + RP + 'images/frameleft.png) center/8px 100% no-repeat;',
            'pointer-events:none;z-index:1',
            '}',
            /* 右框线 */
            '.uac-dialog::after{',
            'content:"";position:absolute;right:0;top:29px;bottom:6px;width:8px;',
            'background:url(' + RP + 'images/frameright.png) center/8px 100% no-repeat;',
            'pointer-events:none;z-index:1',
            '}',
            /* 标题栏 — Vista Aero 框线 */
            '.uac-titlebar{',
            'height:29px;display:flex;align-items:center;justify-content:space-between;',
            'border-style:solid;border-width:0 6px;',
            'border-image:url(' + RP + 'images/framecaption.png) 0 6 fill stretch;',
            'color:#000;font-weight:normal;padding:0 4px',
            '}',
            '.uac-title-text{',
            'font-size:12px;color:#000000;',
            'font-family:"Segoe UI","Microsoft YaHei UI",sans-serif',
            '}',
            '.uac-close-btn{',
            'flex-shrink:0;width:28px;height:17px;cursor:pointer;transition:filter .2s',
            '}',
            '.uac-close-btn:hover{filter:brightness(1.2)}',
            /* 内容区 */
            '.uac-content{position:relative;padding:0 0 6px 0;background:#FFFFFF}',
            /* 下框线 */
            '.uac-content::before{',
            'content:"";position:absolute;bottom:0;left:0;right:0;height:6px;',
            'border-style:solid;border-width:0 2px 2px 2px;',
            'border-image:url(' + RP + 'images/framebuttom.png) 0 2 2 2 fill stretch;',
            'pointer-events:none;z-index:0',
            '}',
            /* Banner — 在内容区顶部 */
            '.uac-banner{',
            'display:flex;align-items:center;gap:10px;padding:8px 12px;',
            'background:linear-gradient(to right,#045082,#327582);color:#fff',
            '}',
            '.uac-banner-icon{width:32px;height:32px;flex-shrink:0}',
            '.uac-banner-text{font-size:16px;line-height:1.5;',
            'font-family:"Segoe UI","Microsoft YaHei UI",sans-serif}',
            /* 消息 + 发布者区 */
            '.uac-body{padding:12px 16px}',
            '.uac-message{font-size:12px;color:#000;line-height:1.6;margin:0 0 10px;',
            'font-family:"Segoe UI","Microsoft YaHei UI",sans-serif}',
            '.uac-publisher{font-size:11px;color:#888;margin-bottom:16px;',
            'font-family:"Segoe UI","Microsoft YaHei UI",sans-serif}',
            /* 按钮 */
            '.uac-buttons{display:flex;justify-content:space-between;align-items:center;',
            'padding:8px 16px;background:#F0F0F0}',
            '.uac-buttons-right{display:flex;gap:8px}',
            '.uac-link{font-size:11px;color:#0066CC;text-decoration:none;cursor:pointer;',
            'font-family:"Segoe UI","Microsoft YaHei UI",sans-serif}',
            '.uac-link:hover{text-decoration:underline}',
            '.uac-btn{min-width:75px;padding:4px 18px;font-size:12px;',
            'font-family:"Segoe UI","Microsoft YaHei UI",sans-serif;',
            'background:linear-gradient(to bottom,#f2f2f2,#ebebeb 50%,#ddd 51%,#cfcfcf);',
            'border:1px solid #707070;border-radius:3px;cursor:pointer;color:#000}',
            '.uac-btn:hover{border-color:#3c7fb1;',
            'background:linear-gradient(to bottom,#e9f5ff,#d8eaff 50%,#c4e0ff 51%,#b3d5ff)}',
            '@media(max-width:480px){',
            '.uac-dialog{width:94vw;max-width:94vw}',
            '.uac-body{padding:12px 14px}',
            '.uac-banner{padding:8px 10px}',
            '.uac-banner-text{font-size:16px}',
            '.uac-buttons{padding:8px 10px}',
            '.uac-btn{min-width:60px;padding:4px 12px}',
            '}'
        ].join('\n');
        document.head.appendChild(st);
    })();

    // ── 手账主题覆盖 ──
    // 顶层页的 UAC 样式写在 modern-sticker.css 里,但**文章页根本不加载那份 CSS**
    // (文章页走 articles/modern-sticker-article.css,里面没有任何 .uac-* 规则),
    // 于是文章页上的 UAC 会掉回上面那套 Vista 基线。
    //
    // 修法:让 uac.js 自己带上这份覆盖。它后注入、特异性也更高,所以
    // 顶层页 + 文章页都能拿到同一套手账外观,且不依赖 CSS 加载顺序。
    (function () {
        if (!IS_STICKER) return;
        var id = 'uac-sticker-styles';
        if (document.getElementById(id)) return;

        var st = document.createElement('style');
        st.id = id;
        st.textContent = [
            /* 遮罩:暖色纸感,柔和一点 */
            '.uac-overlay{background:rgba(61,58,56,.4);padding:20px}',
            /* 对话框:圆角纸卡 + 多层阴影,盖掉 Vista 框线 */
            '.uac-dialog{',
            'width:min(540px,100%);',
            'background:#FFFDF8;',
            'border:1px solid #E4DCCE;',
            'border-radius:18px;',
            'box-shadow:0 18px 40px -12px rgba(61,58,56,.38),',
            '0 4px 12px -4px rgba(61,58,56,.18);',
            'overflow:hidden;',
            'animation:uacModalIn 320ms cubic-bezier(.34,1.4,.64,1)',
            '}',
            /* 干掉 Vista 的左右 / 上下框线伪元素 */
            '.uac-dialog::before,.uac-dialog::after{display:none}',
            '@keyframes uacModalIn{',
            'from{opacity:0;transform:translateY(18px) rotate(-.6deg)}',
            'to{opacity:1;transform:translateY(0) rotate(0deg)}',
            '}',
            /* 标题栏:不再用 framecaption 贴图 */
            '.uac-titlebar{',
            'height:auto;display:flex;align-items:center;gap:8px;',
            'padding:11px 15px 9px;',
            'border:none;border-bottom:1px dashed #DED4C2;',
            'border-radius:0;background:#F7F1E6;',
            'font-family:"Microsoft YaHei",msyh,sans-serif',
            '}',
            '.uac-titlebar::before{',
            'content:"";flex:none;width:9px;height:9px;',
            'background:#E0A030;border-radius:2px;transform:rotate(45deg)',
            '}',
            '.uac-title-text{font-size:14px;font-weight:500;color:#3D3A38}',
            /* 关闭键:macOS 交通灯圆点(矢量化成功后由 JS 换成 svg) */
            '.uac-close-btn{',
            'margin-left:auto;width:22px;height:22px;flex-shrink:0;padding:0;',
            'border-radius:50%;cursor:pointer;',
            'transition:transform 160ms cubic-bezier(.34,1.56,.64,1)',
            '}',
            '.uac-close-btn:hover{transform:scale(1.1)}',
            '.uac-close-btn:active{transform:scale(.94)}',
            /* 内容区:去掉 Vista 下框线 */
            '.uac-content{padding:15px 16px 16px;background:#FFFDF8}',
            '.uac-content::before{display:none}',
            /* Banner:淡黄便签 + 左上角胶带 */
            '.uac-banner{',
            'position:relative;display:flex;align-items:center;gap:11px;',
            'background:#FFFBEA;border:1px solid #EFE0AE;border-radius:12px;',
            'padding:12px 14px;margin-bottom:13px;',
            /* ⚠️ color 必须写。上面那套 Vista 基线里是 `.uac-banner{...color:#fff}`
               (深蓝渐变配白字),而这个覆盖块只改了底色、没动 color ——
               于是 color 仍然是 #fff,盾牌图标(矢量化后的 <svg class="xxt-ic">,
               走 fill:currentColor)继承了它 → **白图标压在淡黄便签上,几乎看不见**。
               用深琥珀:与便签的暖色同族,对 #FFFBEA 的对比度约 3.8:1
               (比 --c-amber #D08A00 的 2.8:1 稳,图标类元素 3:1 以上才够看)。 */
            'color:#B07400;',
            '}',
            '.uac-banner::before{',
            'content:"";position:absolute;top:-7px;left:16px;width:46px;height:15px;',
            'background:rgba(255,210,31,.58);border-radius:2px;',
            'transform:rotate(-3deg);',
            'box-shadow:0 1px 2px rgba(61,58,56,.12);pointer-events:none',
            '}',
            '.uac-banner-icon{width:32px;height:32px;flex:none}',
            '.uac-banner-text{font-size:13px;font-weight:500;color:#6B5200;line-height:1.5}',
            /* 正文 */
            '.uac-body{padding:0;font-size:13px;color:#6B6259;line-height:1.7;margin-bottom:15px}',
            '.uac-message{margin:0 0 8px;color:#6B6259;font-size:13px;',
            'font-family:"Microsoft YaHei",msyh,sans-serif}',
            '.uac-link{color:#2F6E8E;border-bottom:1px solid rgba(47,110,142,.28);',
            'text-decoration:none;font-size:13px}',
            '.uac-link:hover{border-bottom-color:currentColor;text-decoration:none}',
            /* 按钮区:右对齐的纸片按钮 */
            '.uac-buttons{',
            'display:flex;justify-content:flex-end;gap:8px;',
            'padding:0;background:none',
            '}',
            '.uac-buttons-right{display:flex;gap:8px}',
            '.uac-btn{',
            'min-width:0;padding:7px 18px;',
            'font-family:"Microsoft YaHei",msyh,sans-serif;font-size:13px;color:#3D3A38;',
            'background:#F7F1E6;border:1px solid #E4DCCE;border-radius:9px;',
            'box-shadow:0 1px 0 rgba(61,58,56,.10);cursor:pointer;',
            'transition:transform 160ms ease,box-shadow 160ms ease,background-color 160ms ease',
            '}',
            '.uac-btn:hover{',
            'background:#FFFDF8;transform:translateY(-1px);',
            'box-shadow:0 3px 8px -2px rgba(61,58,56,.2);',
            'border-color:#E4DCCE',
            '}',
            '.uac-btn:active{transform:translateY(1px);box-shadow:none}',
            /* 「继续」= 主操作,填青色 + 右下角一枚圆角五角星
               底纹取自主题 :root 的 --xxt-star-tile(顶层页读 modern-sticker.css,
               文章页读 articles/modern-sticker-article.css,两份同名同值)。
               ⚠️ 这里必须是 no-repeat:当年是平铺的,后来改成"角上一枚"时
                  只改了 CSS 那份、漏了这一处,于是 UAC 里还在铺满星星 ——
                  两处都得是 no-repeat。 */
            '.uac-buttons-right .uac-btn:first-child{',
            'color:#FFFFFF;',
            'background:#0E9E92;',
            'background-image:var(--xxt-star-tile);',
            'background-repeat:no-repeat;',
            'background-size:var(--xxt-star-size);',
            'background-position:var(--xxt-star-pos);',
            'border-color:#0E9E92;',
            'box-shadow:0 2px 6px -2px rgba(14,158,146,.55)',
            '}',
            /* ⚠️ hover 只能写 background-color。上面 .uac-btn:hover 用的是简写,
               这里若也写简写,底纹会被重置成 none */
            '.uac-buttons-right .uac-btn:first-child:hover{',
            'background-color:#0C8C82;border-color:#0C8C82;',
            'box-shadow:0 4px 12px -3px rgba(14,158,146,.6)',
            '}',
            '@media(max-width:480px){',
            '.uac-dialog{width:94vw;max-width:94vw}',
            '.uac-body{padding:0}',
            '.uac-banner{padding:10px 12px}',
            '.uac-banner-text{font-size:13px}',
            '.uac-buttons{padding:0}',
            '.uac-btn{padding:7px 13px}',
            '}'
        ].join('\n');
        document.head.appendChild(st);
    })();

    // ── 构建 DOM ──
    var overlay = document.createElement('div');
    overlay.className = 'uac-overlay';

    var dialog = document.createElement('div');
    dialog.className = 'uac-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');

    // 标题栏
    var titlebar = document.createElement('div');
    titlebar.className = 'uac-titlebar';
    var titleSpan = document.createElement('span');
    titleSpan.className = 'uac-title-text';
    titleSpan.textContent = '用户帐户控制';
    var closeBtn = document.createElement('img');
    closeBtn.src = RP + 'images/Window_CloseButton.png';
    closeBtn.className = 'uac-close-btn';
    closeBtn.alt = '关闭';
    titlebar.appendChild(titleSpan);
    titlebar.appendChild(closeBtn);

    // 手账主题下把关闭按钮换成矢量交通灯圆点。
    // 精灵表是异步加载的(主站首页的 modern-sticker.js / 文章页的
    // modern-sticker-article.js 负责),拿不到就保持 PNG,不影响关闭功能。
    var uacSpriteTried = false;
    var closeBtnUpgraded = false;

    function ensureUacSprite(cb) {
        if (window.XXT_ICON_SPRITE) { cb(); return; }
        if (uacSpriteTried) return;
        uacSpriteTried = true;
        var s = document.createElement('script');
        s.src = RP + 'js/modern-sticker-icons.js';
        s.onload = cb;
        s.onerror = function () { /* 保持 PNG */ };
        document.head.appendChild(s);
    }

    function upgradeCloseBtn() {
        if (closeBtnUpgraded) return;

        ensureUacSprite(function () {
            if (closeBtnUpgraded || !window.XXT_ICON_SPRITE) return;

            if (!document.getElementById('xxt-icon-sprite')) {
                var holder = document.createElement('div');
                holder.id = 'xxt-icon-sprite';
                holder.setAttribute('aria-hidden', 'true');
                holder.innerHTML = window.XXT_ICON_SPRITE;
                document.body.insertBefore(holder, document.body.firstChild);
            }

            var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('class', 'xxt-ic');
            svg.setAttribute('data-icon', 'close-dot');
            svg.setAttribute('aria-hidden', 'true');
            svg.setAttribute('focusable', 'false');
            var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
            use.setAttribute('href', '#i-close-dot');
            svg.appendChild(use);

            closeBtnUpgraded = true;
            closeBtn.parentNode.replaceChild(svg, closeBtn);
            svg.style.cursor = 'pointer';
            svg.style.flex = 'none';
            svg.addEventListener('click', function (e) { e.preventDefault(); onNo(); });
        });
    }

    // 内容区
    var content = document.createElement('div');
    content.className = 'uac-content';

    // Banner
    var banner = document.createElement('div');
    banner.className = 'uac-banner';
    var bannerIcon = document.createElement('img');
    bannerIcon.src = RP + 'images/icons/uac.png';
    bannerIcon.alt = '';
    bannerIcon.width = 32;
    bannerIcon.height = 32;
    bannerIcon.className = 'uac-banner-icon';
    var bannerSpan = document.createElement('span');
    bannerSpan.className = 'uac-banner-text';
    bannerSpan.textContent = bannerText;
    banner.appendChild(bannerIcon);
    banner.appendChild(bannerSpan);

    // Body（消息）
    var body = document.createElement('div');
    body.className = 'uac-body';

    var msgP = document.createElement('p');
    msgP.className = 'uac-message';
    msgP.innerHTML = bodyMessage;

    body.appendChild(msgP);

    // 按钮区
    var btns = document.createElement('div');
    btns.className = 'uac-buttons';

    var btnsLeft = document.createElement('div');
    var changeLink = document.createElement('a');
    changeLink.className = 'uac-link';
    changeLink.textContent = '更改这些通知的出现时间';
    changeLink.href = 'javascript:void(0)';
    changeLink.addEventListener('click', function(e) {
        e.preventDefault();
        alert('请在首页点击控制面板，取消勾选用户账户控制即可关闭此通知。');
    });
    btnsLeft.appendChild(changeLink);

    var btnsRight = document.createElement('div');
    btnsRight.className = 'uac-buttons-right';
    var btnYes = document.createElement('button');
    btnYes.className = 'uac-btn';
    btnYes.textContent = '继续(C)';
    var btnNo = document.createElement('button');
    btnNo.className = 'uac-btn';
    btnNo.textContent = '取消';
    btnsRight.appendChild(btnYes);
    btnsRight.appendChild(btnNo);

    btns.appendChild(btnsLeft);
    btns.appendChild(btnsRight);

    content.appendChild(banner);
    content.appendChild(body);
    content.appendChild(btns);

    dialog.appendChild(titlebar);
    dialog.appendChild(content);
    overlay.appendChild(dialog);

    function hideUAC() {
        document.body.classList.remove('uac-active');
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        document.removeEventListener('keydown', onKeyDown);
    }

    function onYes() {
        window.__uac_confirmed = true;
        hideUAC();
    }

    function onNo() {
        window.location.href = RP + 'index.html';
    }

    btnYes.addEventListener('click', function(e){e.preventDefault();onYes();});
    btnNo.addEventListener('click', function(e){e.preventDefault();onNo();});
    closeBtn.addEventListener('click', function(e){e.preventDefault();onNo();});

    function onKeyDown(e) {
        if (e.key === 'Escape' || e.keyCode === 27) { e.preventDefault(); onNo(); }
        if (e.key === 'c' || e.key === 'C' || e.keyCode === 67) { e.preventDefault(); onYes(); }
    }

    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            playSound('media/assets/ding.wav');
        }
    });

    function show() {
        document.body.appendChild(overlay);
        document.body.classList.add('uac-active');
        document.addEventListener('keydown', onKeyDown);
        playSound('media/assets/uac.wav');
        dialog.tabIndex = -1;
        dialog.focus();

        /* 只在手账主题下做矢量化改造:默认主题保持原样 */
        try {
            var theme = localStorage.getItem('theme') || '';
            if (theme.indexOf('modern-sticker') > -1) {
                upgradeCloseBtn();
                // 精灵表是异步加载的 —— 大约 1s 后再试一次
                setTimeout(upgradeCloseBtn, 900);
            }
        } catch (err) {
            /* 隐私模式下读不到 localStorage,保持 PNG */
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', show);
    } else {
        show();
    }

})();
