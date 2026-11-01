(function () {
    'use strict';

    var STORAGE_KEY = 'glossary_enabled';

    function disabled() {
        try {
            return localStorage.getItem(STORAGE_KEY) === 'false';
        } catch (err) {
            return false;
        }
    }

    if (disabled()) return;

    /* =============================================================
       1. 词条表
       -------------------------------------------------------------
       两种模式，靠字段区分，不靠开关：
         · 术语模式（默认）—— 技术用语，只写 t / d，卡片上只有词名与释义
         · 词典模式 —— 加 kind: 'dict'，再给 read（罗马音或音标）与 pos
           （词性），卡片上多出一行读音 + 词性标签

       t    = 词条原文（英文不分大小写匹配）
       d    = 释义。除非这个词本身是梗、或另有隐含意思怕人 get 不到，
              一律用书面语，不写「圈内干脆叫它…」这种口语
       link = 可选，{ href, text }
       ============================================================= */
    var TERMS = [
        {
            t: '中二节奏',
            kind: 'dict',
            read: 'CHUNITHM',
            pos: '专有名词',
            d: 'SEGA 触屏音游 CHUNITHM 的中文译名。',
            link: { href: 'https://mzh.moegirl.org.cn/CHUNITHM', text: '探索此词条' }
        },
        {
            t: 'pjsk',
            kind: 'dict',
            read: 'puroseka',
            pos: '缩写',
            d: '指 《世界计划 缤纷舞台！ feat. 初音未来》。该名称在日本玩家中简称「プロセカ」，罗马字作 puroseka。',
            link: { href: 'https://mzh.moegirl.org.cn/%E4%B8%96%E7%95%8C%E8%AE%A1%E5%88%92_%E7%BC%A4%E7%BA%B7%E8%88%9E%E5%8F%B0%EF%BC%81_feat._%E5%88%9D%E9%9F%B3%E6%9C%AA%E6%9D%A5', text: '探索此词条' }
        },
        {
            t: 'ping',
            kind: 'dict',
            read: '/pɪŋ/',
            pos: '动词',
            d: '网络诊断命令，通常被用于确认因特网上的一台主机是否可达。'
        },
        {
            t: 'FFmpeg',
            kind: 'dict',
            read: 'F-F-M-peg',
            pos: '专有名词',
            d: '开源计算机程序，提供视频采集、格式转换、流媒体传输等功能。该程序内置音视频编解码技术，支持GPU加速处理，可实现视频截图、水印添加及设备录制等操作。'
        },
        {
            t: 'Vocaloid',
            kind: 'dict',
            read: '/ˈvoʊkəlɔɪd/',
            pos: '专有名词',
            d: 'VOCALOID（ボーカロイド）是电子音乐制作语音合成软件。在软件中输入音调和歌词，就可以合成出原为人类声音的歌声。'
        },
        {
            t: '术力口',
            d: '指雅马哈旗下软件VOCALOID，用于为虚拟歌手调音。因其片假名写为“ボーカロイド”，前三个假名“ボカロ”和汉字“术力口”相似而得此称呼。'
        },
        {
            t: 'ClassIsland',
            d: '开源的桌面课表软件。'
        },
        {
            t: 'Git',
            kind: 'dict',
            read: '/ɡɪt/',
            pos: '专有名词',
            d: '开源的分布式版本控制系统，该系统通过高效管理项目版本历史，支持从微型到超大规模项目的协作开发。允许开发者在本地克隆完整代码库并独立提交修改，无需依赖中央服务器。典型功能包括分支创建与管理、本地版本提交、多分支合并及冲突智能解决，支持生成补丁并与团队异步协作。'
        },
        {
            t: 'こんにちは',
            kind: 'dict',
            read: 'konnichiwa',
            pos: '寒暄语',
            d: '日语中的问候语，用于白天（约上午十时至日落前）与人见面时打招呼，相当于汉语的「你好」。'
        },
        {
            t: 'バスターズ',
            kind: 'dict',
            read: 'basutāzu',
            pos: '名词',
            d: '英语 buster 的日语片假名音译及其复数形式，意为「讨伐者」「破坏者」，多用于游戏、特摄作品中的团队名。'
        },
        {
            t: 'Available Fish',
            d: '「闲鱼」的逐字英译。闲鱼是阿里巴巴旗下的二手交易平台，文中以此戏仿生硬的中式英语。'
        },
        {
            t: 'DONDERFUL',
            d: '由拟声词「ドン」（鼓声）与 Wonderful 拼合而成的自造词，文中作感叹语使用，兼有赞美与吐槽的意味。'
        }
    ];

    TERMS.sort(function (a, b) {
        return b.t.length - a.t.length;
    });

    var isAsciiTerm = {};
    for (var ti = 0; ti < TERMS.length; ti++) {
        isAsciiTerm[TERMS[ti].t] = /[A-Za-z0-9]/.test(TERMS[ti].t);
    }

    function detectTheme() {
        var links = document.querySelectorAll('link[rel="stylesheet"]');
        for (var i = 0; i < links.length; i++) {
            var href = links[i].getAttribute('href') || '';
            if (/modern-sticker-article\.css$/.test(href)) return 'sticker';
        }
        try {
            if ((localStorage.getItem('theme') || '').indexOf('modern-sticker') > -1) return 'sticker';
        } catch (err) { /* 隐私模式下读不到，按默认主题走 */ }
        return 'default';
    }

    document.documentElement.setAttribute('data-glossary-theme', detectTheme());
    var SKIP_TAGS = /^(A|CODE|PRE|KBD|SAMP|SCRIPT|STYLE|TEXTAREA|BUTTON|H1|H2|H3|H4|H5|H6)$/;

    function collectTextNodes(root) {
        var out = [];
        if (!root || !document.createTreeWalker) return out;

        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: function (node) {
                if (!node.nodeValue || !/\S/.test(node.nodeValue)) {
                    return NodeFilter.FILTER_REJECT;
                }
                for (var p = node.parentNode; p && p !== root; p = p.parentNode) {
                    if (p.nodeType !== 1) continue;
                    if (SKIP_TAGS.test(p.nodeName)) return NodeFilter.FILTER_REJECT;
                    if (p.classList && (p.classList.contains('xxt-term') ||
                        p.classList.contains('xxt-code-block'))) {
                        return NodeFilter.FILTER_REJECT;
                    }
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        });

        var node;
        while ((node = walker.nextNode())) out.push(node);
        return out;
    }

    /* 在纯文本里找一次命中。英文术语要求前后不贴着字母数字，
       否则 "Git" 会命中 "digital"、"ping" 会命中 "mapping"。 */
    function findHit(text, lower, term, ascii) {
        var needle = ascii ? term.toLowerCase() : term;
        var hay = ascii ? lower : text;
        var from = 0;
        while (true) {
            var idx = hay.indexOf(needle, from);
            if (idx < 0) return -1;
            if (!ascii) return idx;
            var before = idx > 0 ? text.charAt(idx - 1) : '';
            var after = text.charAt(idx + term.length);
            if (!/[A-Za-z0-9_]/.test(before) && !/[A-Za-z0-9_]/.test(after)) return idx;
            from = idx + 1;
        }
    }

    var tip = null;
    var tipParts = null;
    var activeTermEl = null;
    var rafId = 0;

    function buildTip() {
        var el = document.createElement('div');
        el.id = 'xxt-gloss';
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-label', '名词解释');
        el.hidden = true;

        var closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'xxt-gloss-x';
        closeBtn.setAttribute('aria-label', '关闭名词解释');
        closeBtn.textContent = '×';

        var name = document.createElement('div');
        name.className = 'xxt-gloss-name';

        /* 词典模式那一行:读音 + 词性。术语模式的词条没有这两项,整行藏起来 */
        var meta = document.createElement('div');
        meta.className = 'xxt-gloss-meta';
        meta.hidden = true;

        var read = document.createElement('span');
        read.className = 'xxt-gloss-read';

        var pos = document.createElement('span');
        pos.className = 'xxt-gloss-pos';

        meta.appendChild(read);
        meta.appendChild(pos);

        var desc = document.createElement('p');
        desc.className = 'xxt-gloss-desc';

        var more = document.createElement('a');
        more.className = 'xxt-gloss-more';
        more.setAttribute('target', '_blank');
        more.setAttribute('rel', 'noopener noreferrer');
        var moreText = document.createElement('span');
        var arrow = document.createElement('span');
        arrow.className = 'xxt-gloss-arrow';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '→';
        more.appendChild(moreText);
        more.appendChild(arrow);

        el.appendChild(closeBtn);
        el.appendChild(name);
        el.appendChild(meta);
        el.appendChild(desc);
        el.appendChild(more);
        document.body.appendChild(el);

        closeBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            close(true);
        });

        tip = el;
        tipParts = {
            name: name,
            meta: meta,
            read: read,
            pos: pos,
            desc: desc,
            more: more,
            moreText: moreText,
            closeBtn: closeBtn
        };

        document.addEventListener('click', function (e) {
            if (!tip || tip.hidden) return;
            if (tip.contains(e.target)) return;
            close(false);
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' || e.key === 'Esc') close(true);
        });

        window.addEventListener('scroll', scheduleReposition, true);
        window.addEventListener('resize', scheduleReposition);
    }

    function scheduleReposition() {
        if (!tip || tip.hidden || !activeTermEl) return;
        if (rafId) return;
        rafId = window.requestAnimationFrame(function () {
            rafId = 0;
            if (!tip || tip.hidden || !activeTermEl) return;
            place(activeTermEl);
        });
    }

    function place(anchor) {
        var rect = anchor.getBoundingClientRect();
        var vw = document.documentElement.clientWidth;
        var vh = document.documentElement.clientHeight;
        if (rect.bottom < 0 || rect.top > vh) {
            close(false);
            return;
        }

        var w = tip.offsetWidth;
        var h = tip.offsetHeight;
        var gap = 12;
        var above = false;
        var top = rect.bottom + gap;

        if (top + h > vh - 10 && rect.top - gap - h > 10) {
            above = true;
            top = rect.top - gap - h;
        }
        top = Math.max(10, Math.min(top, vh - h - 10));

        var left = rect.left + rect.width / 2 - w / 2;
        left = Math.max(10, Math.min(left, vw - w - 10));

        tip.style.left = Math.round(left) + 'px';
        tip.style.top = Math.round(top) + 'px';
        tip.classList.toggle('is-above', above);

        var arrowX = Math.round(rect.left + rect.width / 2 - left);
        arrowX = Math.max(16, Math.min(arrowX, w - 16));
        tip.style.setProperty('--gx', arrowX + 'px');
    }

    function open(termEl, term) {
        if (!tip) buildTip();

        if (activeTermEl && activeTermEl !== termEl) {
            activeTermEl.classList.remove('is-open');
            activeTermEl.setAttribute('aria-expanded', 'false');
        }

        tipParts.name.textContent = term.t;
        tipParts.desc.textContent = term.d;

        /* 有 read / pos 的按词典条目渲染,其余仍是术语条目 */
        tip.setAttribute('data-mode', term.kind === 'dict' ? 'dict' : 'term');
        tipParts.read.textContent = term.read || '';
        tipParts.read.hidden = !term.read;
        tipParts.pos.textContent = term.pos || '';
        tipParts.pos.hidden = !term.pos;
        tipParts.meta.hidden = !(term.read || term.pos);

        if (term.link && term.link.href) {
            tipParts.more.href = term.link.href;
            tipParts.moreText.textContent = term.link.text || '继续探索';
            tipParts.more.hidden = false;
        } else {
            tipParts.more.removeAttribute('href');
            tipParts.more.hidden = true;
        }

        tip.hidden = false;
        tip.classList.remove('is-above');
        place(termEl);

        activeTermEl = termEl;
        termEl.classList.add('is-open');
        termEl.setAttribute('aria-expanded', 'true');

        try {
            tipParts.closeBtn.focus({ preventScroll: true });
        } catch (err) {
            tipParts.closeBtn.focus();
        }
    }

    function close(restoreFocus) {
        if (!tip || tip.hidden) return;
        tip.hidden = true;

        var prev = activeTermEl;
        activeTermEl = null;
        if (prev) {
            prev.classList.remove('is-open');
            prev.setAttribute('aria-expanded', 'false');
        }
        if (restoreFocus && prev) {
            try {
                prev.focus({ preventScroll: true });
            } catch (err) { /* 老浏览器不支持参数，放弃置焦 */ }
        }
    }

    function toggle(termEl, term) {
        if (activeTermEl === termEl && tip && !tip.hidden) {
            close(true);
            return;
        }
        open(termEl, term);
    }

    function makeTermEl(text, term) {
        var el = document.createElement('span');
        el.className = 'xxt-term';
        el.setAttribute('data-gloss', term.t);
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-haspopup', 'true');
        el.setAttribute('aria-expanded', 'false');
        el.textContent = text;

        el.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            toggle(el, term);
        });

        el.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                e.stopPropagation();
                toggle(el, term);
            }
        });

        return el;
    }

    function annotate(container) {
        var nodes = collectTextNodes(container);
        if (!nodes.length) return 0;

        /* 每个节点切成若干片段；片段带 term 的就是要包起来的命中 */
        var segments = [];
        for (var i = 0; i < nodes.length; i++) {
            segments.push([{ text: nodes[i].nodeValue, term: null }]);
        }

        var hitCount = 0;

        for (var t = 0; t < TERMS.length; t++) {
            var term = TERMS[t];
            var ascii = isAsciiTerm[term.t];
            var done = false;

            for (var n = 0; n < segments.length && !done; n++) {
                var segs = segments[n];
                for (var s = 0; s < segs.length; s++) {
                    var seg = segs[s];
                    if (seg.term || !seg.text) continue;

                    var idx = findHit(seg.text, seg.text.toLowerCase(), term.t, ascii);
                    if (idx < 0) continue;

                    var parts = [];
                    if (idx > 0) parts.push({ text: seg.text.slice(0, idx) });
                    parts.push({ text: seg.text.substr(idx, term.t.length), term: term });
                    var rest = seg.text.slice(idx + term.t.length);
                    if (rest) parts.push({ text: rest });

                    segments[n] = segs.slice(0, s).concat(parts, segs.slice(s + 1));
                    hitCount++;
                    done = true;
                    break;
                }
            }
        }

        if (!hitCount) return 0;

        for (var k = 0; k < nodes.length; k++) {
            var list = segments[k];
            var hasTerm = false;
            for (var q = 0; q < list.length; q++) {
                if (list[q].term) { hasTerm = true; break; }
            }
            if (!hasTerm) continue;

            var node = nodes[k];
            var frag = document.createDocumentFragment();
            for (var p = 0; p < list.length; p++) {
                var piece = list[p];
                frag.appendChild(piece.term
                    ? makeTermEl(piece.text, piece.term)
                    : document.createTextNode(piece.text));
            }
            if (node.parentNode) node.parentNode.replaceChild(frag, node);
        }

        return hitCount;
    }

    function run() {
        var containers = document.querySelectorAll('.article-content');
        for (var i = 0; i < containers.length; i++) {
            var box = containers[i];
            if (box.getAttribute('data-gloss-ready') === '1') continue;
            if (annotate(box)) box.setAttribute('data-gloss-ready', '1');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
