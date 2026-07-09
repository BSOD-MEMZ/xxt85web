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
            /* 对话框 — 无动画，无发光边框 */
            '.uac-dialog{',
            'width:430px;max-width:92vw;margin:0;outline:none;',
            'border:1px solid #7da2ce;',
            'box-shadow:0 0 15px rgba(0,0,0,0.4);',
            'border-radius:4px;background:#FFFFFF',
            '}',
            /* 标题栏 — 与 Vista 对话框一致，紧凑 */
            '.uac-titlebar{',
            'display:flex;align-items:center;justify-content:space-between;',
            'padding:4px 8px;',
            'background:linear-gradient(to bottom,#98B4D0 0%,#B9D1EA 100%);',
            'color:#000;font-weight:normal;',
            'border-bottom:1px solid #8BA6C4;border-radius:4px 4px 0 0',
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
            '.uac-content{padding:0}',
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
        alert('请在首页点击「控制面板」，取消勾选「启用UAC安全提示」即可关闭此通知。');
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
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', show);
    } else {
        show();
    }

})();
