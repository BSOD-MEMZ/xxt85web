/**
 * xxtsoft · 首次访问的风格选择引导
 * ---------------------------------------------------------------------------
 * 由 js/theme-loader.js 在 DOM 就绪后按需加载(仅首页、且用户尚未选择过)。
 * 强制弹出:在地址后加 ?theme-picker=1
 *
 * 设计要点:
 * - 对话框外壳复用站点已有的 .window / .vista-dialog 样式,
 *   所以点击骨架切换主题时,对话框自身会跟着变成对应风格的样式,
 *   用户看到的是"整个页面当场换掉",而不只是一张图。
 * - 内部布局用内联样式表写死(不依赖任何主题 CSS),两套主题下都正常。
 * - 关闭 = 撤销预览、恢复原主题,下次仍会提示;
 *   勾选"不再提醒"或点"确定"之后才不再弹出。
 */
(function () {
    'use strict';

    if (window.__xxtThemePickerLoaded) return;
    window.__xxtThemePickerLoaded = true;

    var SELF = (document.currentScript && document.currentScript.src) || '';
    var ROOT = SELF.replace(/\/js\/[^\/?#]+.*$/, '/');

    var KEY_THEME = 'theme';
    var KEY_PICKED = 'xxt-theme-picked';
    var KEY_NEVER = 'xxt-theme-never';

    var THEME_VISTA = 'style.css';
    var THEME_STICKER = 'modern-sticker.css';

    var isForce = /[?&]theme-picker=1/.test(window.location.search);

    function read(key) {
        try {
            return localStorage.getItem(key);
        } catch (err) {
            return null;
        }
    }

    function write(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (err) {
            /* 隐私模式:忽略 */
        }
    }

    // 只在首页出现(首页有 #articleList),且用户没做过选择
    if (!document.getElementById('articleList') && !isForce) return;
    if (!isForce && (read(KEY_PICKED) === '1' || read(KEY_NEVER) === '1')) return;

    /* -----------------------------------------------------------------
       两份主页骨架,用内联 SVG 画;各自用固定配色表达风格差异
       ----------------------------------------------------------------- */
    var WIRE_VISTA =
        '<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg">' +
        '<rect width="200" height="140" fill="#DCE6F2"/>' +
        '<rect width="200" height="17" fill="#3B6EA5"/>' +
        '<circle cx="9" cy="8.5" r="3.4" fill="#FFFFFF" opacity=".85"/>' +
        '<rect x="150" y="4.5" width="42" height="8" rx="2" fill="#FFFFFF" opacity=".45"/>' +
        '<rect y="17" width="200" height="12" fill="#E5EAF5"/>' +
        '<rect x="6" y="21" width="15" height="4" rx="1" fill="#93A2BD"/>' +
        '<rect x="25" y="21" width="15" height="4" rx="1" fill="#93A2BD"/>' +
        '<rect x="44" y="21" width="15" height="4" rx="1" fill="#93A2BD"/>' +
        '<rect x="8" y="36" width="120" height="96" fill="#FFFFFF" stroke="#8FA9C9"/>' +
        '<rect x="8" y="36" width="120" height="13" fill="#5B8DBE"/>' +
        '<rect x="15" y="40.5" width="34" height="4" rx="1" fill="#FFFFFF" opacity=".8"/>' +
        '<rect x="15" y="58" width="104" height="5" rx="1" fill="#C7D5E6"/>' +
        '<rect x="15" y="70" width="92" height="5" rx="1" fill="#C7D5E6"/>' +
        '<rect x="15" y="82" width="98" height="5" rx="1" fill="#C7D5E6"/>' +
        '<rect x="15" y="94" width="76" height="5" rx="1" fill="#C7D5E6"/>' +
        '<rect x="136" y="36" width="56" height="42" fill="#FFFFFF" stroke="#8FA9C9"/>' +
        '<rect x="136" y="36" width="56" height="11" fill="#5B8DBE"/>' +
        '<rect x="141" y="53" width="46" height="4" rx="1" fill="#C7D5E6"/>' +
        '<rect x="141" y="63" width="38" height="4" rx="1" fill="#C7D5E6"/>' +
        '<rect x="136" y="84" width="56" height="48" fill="#FFFFFF" stroke="#8FA9C9"/>' +
        '<rect x="136" y="84" width="56" height="11" fill="#5B8DBE"/>' +
        '<rect x="141" y="101" width="46" height="4" rx="1" fill="#C7D5E6"/>' +
        '<rect x="141" y="111" width="34" height="4" rx="1" fill="#C7D5E6"/>' +
        '</svg>';

    var WIRE_STICKER =
        '<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg">' +
        '<rect width="200" height="140" fill="#FFFCF3"/>' +
        '<circle cx="30" cy="24" r="34" fill="#FF7A8A" opacity=".14"/>' +
        '<circle cx="176" cy="112" r="38" fill="#3FC7BE" opacity=".14"/>' +
        '<circle cx="150" cy="18" r="26" fill="#FFD21F" opacity=".16"/>' +
        '<rect y="0" width="200" height="22" fill="#FBF5E4"/>' +
        '<circle cx="12" cy="11" r="4" fill="#FF7A8A"/>' +
        '<rect x="21" y="8" width="34" height="6" rx="3" fill="#3D3A38" opacity=".62"/>' +
        '<rect x="76" y="9" width="14" height="4" rx="2" fill="#968D7C"/>' +
        '<rect x="95" y="9" width="14" height="4" rx="2" fill="#968D7C"/>' +
        '<rect x="114" y="9" width="14" height="4" rx="2" fill="#968D7C"/>' +
        '<rect x="146" y="6" width="46" height="11" rx="5.5" fill="#FFFFFF" stroke="#DCCFAE"/>' +
        '<circle cx="186" cy="11.5" r="3.6" fill="#3FC7BE"/>' +
        '<rect x="8" y="32" width="88" height="46" rx="6" fill="#FFFFFF" stroke="#DCCFAE"/>' +
        '<rect x="16" y="27" width="26" height="8" rx="1" fill="#FFD21F" transform="rotate(-3 29 31)"/>' +
        '<rect x="16" y="45" width="60" height="5" rx="2" fill="#3D3A38" opacity=".5"/>' +
        '<rect x="16" y="56" width="70" height="4" rx="2" fill="#B4AE9E"/>' +
        '<rect x="16" y="65" width="46" height="4" rx="2" fill="#B4AE9E"/>' +
        '<rect x="104" y="32" width="88" height="46" rx="6" fill="#FFFFFF" stroke="#DCCFAE"/>' +
        '<rect x="112" y="27" width="26" height="8" rx="1" fill="#3FC7BE" transform="rotate(2.5 125 31)"/>' +
        '<rect x="112" y="45" width="52" height="5" rx="2" fill="#3D3A38" opacity=".5"/>' +
        '<rect x="112" y="56" width="64" height="4" rx="2" fill="#B4AE9E"/>' +
        '<rect x="112" y="65" width="40" height="4" rx="2" fill="#B4AE9E"/>' +
        '<rect x="8" y="86" width="88" height="46" rx="6" fill="#FFFFFF" stroke="#DCCFAE"/>' +
        '<rect x="16" y="81" width="26" height="8" rx="1" fill="#FF7A8A" transform="rotate(-2 29 85)"/>' +
        '<rect x="16" y="99" width="58" height="5" rx="2" fill="#3D3A38" opacity=".5"/>' +
        '<rect x="16" y="110" width="66" height="4" rx="2" fill="#B4AE9E"/>' +
        '<rect x="104" y="86" width="88" height="46" rx="6" fill="#FFFFFF" stroke="#DCCFAE"/>' +
        '<rect x="112" y="81" width="26" height="8" rx="1" fill="#B08BE8" transform="rotate(3 125 85)"/>' +
        '<rect x="112" y="99" width="50" height="5" rx="2" fill="#3D3A38" opacity=".5"/>' +
        '<rect x="112" y="110" width="60" height="4" rx="2" fill="#B4AE9E"/>' +
        '</svg>';

    /* -----------------------------------------------------------------
       内部样式(与主题无关,两套主题下都正常)
       ----------------------------------------------------------------- */
    var CSS = [
        '.xxt-picker-overlay{position:fixed;inset:0;z-index:20000;display:flex;',
        'align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.45);',
        'font-family:"Microsoft YaHei UI","Microsoft YaHei",sans-serif;}',
        '.xxt-picker{width:min(720px,100%);max-height:88vh;overflow:auto;position:relative;}',
        '.xxt-picker-lead{margin:0 0 14px;font-size:13px;line-height:1.75;color:#3D3A38;}',
        '.xxt-picker-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;}',
        '.xxt-picker-card{display:block;width:100%;padding:10px;background:#FFFFFF;',
        'border:2px solid #DCD6C8;border-radius:9px;cursor:pointer;text-align:left;',
        'transition:border-color .15s ease,transform .15s ease,box-shadow .15s ease;}',
        '.xxt-picker-card:hover{transform:translateY(-2px);box-shadow:0 6px 16px -8px rgba(0,0,0,.25);}',
        '.xxt-picker-card.is-active{border-color:#3FC7BE;box-shadow:0 0 0 3px rgba(63,199,190,.25);}',
        '.xxt-picker-card svg{display:block;width:100%;height:auto;border-radius:5px;}',
        '.xxt-picker-name{display:block;margin-top:9px;font-size:13px;font-weight:500;color:#3D3A38;}',
        '.xxt-picker-note{display:block;font-size:11px;color:#8C8578;margin-top:2px;}',
        '.xxt-picker-foot{display:flex;align-items:center;justify-content:space-between;',
        'gap:12px;flex-wrap:wrap;padding-top:14px;border-top:1px solid #E5E0D5;}',
        '.xxt-picker-never{display:inline-flex;align-items:center;gap:7px;font-size:13px;',
        'color:#3D3A38;cursor:pointer;}',
        '.xxt-picker-acts{display:flex;gap:8px;}',
        '.xxt-picker-btn{font-family:inherit;font-size:13px;padding:7px 20px;cursor:pointer;',
        'border:1px solid #C9C2B0;border-radius:5px;background:#F5F2E8;color:#3D3A38;}',
        '.xxt-picker-btn:hover{background:#FFFFFF;}',
        '.xxt-picker-btn-primary{background:#3FC7BE;border-color:#2AA79F;color:#FFFFFF;}',
        '.xxt-picker-btn-primary:hover{background:#37B8AF;}',
        '@media (max-width:560px){.xxt-picker-grid{grid-template-columns:1fr;}}'
    ].join('');

    function injectCss() {
        if (document.getElementById('xxt-picker-css')) return;
        var style = document.createElement('style');
        style.id = 'xxt-picker-css';
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    /* -----------------------------------------------------------------
       主题预览
       ----------------------------------------------------------------- */
    var originalTheme = (function () {
        var t = read(KEY_THEME);
        return t || THEME_VISTA;
    })();
    var chosenTheme = originalTheme;

    function previewTheme(file) {
        var link = document.getElementById('themeCss');
        if (link) link.href = file;

        // 预览到带配套脚本的主题时,把脚本也拉起来,否则只能看到半套效果
        var paired = /^(modern[a-z0-9-]*)\.css$/i.exec(file);
        if (paired && !window.__xxtStickerThemeLoaded) {
            var s = document.createElement('script');
            s.src = ROOT + 'js/' + paired[1] + '.js';
            s.defer = true;
            document.head.appendChild(s);
        }
    }

    /* -----------------------------------------------------------------
       构建对话框
       ----------------------------------------------------------------- */
    function build() {
        injectCss();

        var overlay = document.createElement('div');
        overlay.className = 'xxt-picker-overlay';

        // 外壳沿用站点自己的窗口样式,所以会随主题一起变
        var dialog = document.createElement('div');
        dialog.className = 'window vista-dialog xxt-picker';

        var titlebar = document.createElement('div');
        titlebar.className = 'window-titlebar settings-titlebar';
        titlebar.appendChild(document.createTextNode('选一个你喜欢的风格'));
        var closeImg = document.createElement('img');
        closeImg.src = 'images/icons/close.png';
        closeImg.className = 'vista-close-btn xxt-picker-close';
        closeImg.alt = '关闭';
        closeImg.title = '关闭';
        titlebar.appendChild(closeImg);

        var content = document.createElement('div');
        content.className = 'window-content';

        var lead = document.createElement('p');
        lead.className = 'xxt-picker-lead';
        lead.textContent = '点一下下面任意一张,整个页面会立刻变成那个样子。两种风格以后都能在「个性化」里随时切换。';

        var grid = document.createElement('div');
        grid.className = 'xxt-picker-grid';

        function makeCard(themeFile, svg, name, note) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'xxt-picker-card';
            btn.setAttribute('data-theme', themeFile);
            btn.innerHTML = svg +
                '<span class="xxt-picker-name">' + name + '</span>' +
                '<span class="xxt-picker-note">' + note + '</span>';
            btn.addEventListener('click', function () {
                chosenTheme = themeFile;
                previewTheme(themeFile);
                markActive();
            });
            return btn;
        }

        var cardVista = makeCard(THEME_VISTA, WIRE_VISTA, '经典 Vista', '沿用现在这套拟物窗口');
        var cardSticker = makeCard(THEME_STICKER, WIRE_STICKER, '手账贴纸', '卡片网格 · 更宽松的排版');

        grid.appendChild(cardVista);
        grid.appendChild(cardSticker);

        var foot = document.createElement('div');
        foot.className = 'xxt-picker-foot';

        var never = document.createElement('label');
        never.className = 'xxt-picker-never';
        var neverBox = document.createElement('input');
        neverBox.type = 'checkbox';
        never.appendChild(neverBox);
        never.appendChild(document.createTextNode('不再提醒'));

        var acts = document.createElement('div');
        acts.className = 'xxt-picker-acts';

        var btnCancel = document.createElement('button');
        btnCancel.type = 'button';
        btnCancel.className = 'xxt-picker-btn';
        btnCancel.textContent = '关闭';

        var btnOk = document.createElement('button');
        btnOk.type = 'button';
        btnOk.className = 'xxt-picker-btn xxt-picker-btn-primary';
        btnOk.textContent = '确定';

        acts.appendChild(btnCancel);
        acts.appendChild(btnOk);
        foot.appendChild(never);
        foot.appendChild(acts);

        content.appendChild(lead);
        content.appendChild(grid);
        content.appendChild(foot);

        dialog.appendChild(titlebar);
        dialog.appendChild(content);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        function markActive() {
            var cards = grid.querySelectorAll('.xxt-picker-card');
            for (var i = 0; i < cards.length; i++) {
                var on = cards[i].getAttribute('data-theme') === chosenTheme;
                cards[i].classList.toggle('is-active', on);
            }
        }

        function destroy() {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }

        // 确定:保留预览到的主题,记为已选择
        btnOk.addEventListener('click', function () {
            write(KEY_THEME, chosenTheme);
            write(KEY_PICKED, '1');
            destroy();
        });

        // 关闭:撤销预览,恢复进来时的主题;勾了"不再提醒"才永久停用
        btnCancel.addEventListener('click', function () {
            if (chosenTheme !== originalTheme) previewTheme(originalTheme);
            if (neverBox.checked) write(KEY_NEVER, '1');
            destroy();
        });

        closeImg.addEventListener('click', btnCancel.click ? function () {
            btnCancel.click();
        } : function () {
            destroy();
        });

        markActive();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', build);
    } else {
        build();
    }
})();
