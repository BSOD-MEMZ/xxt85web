/**
 * xxtsoft 文章页 · 名词解释
 *
 * 干什么：把正文里出现的技术/音游术语标出来（默认主题是黄色荧光，
 *         手账主题是紫色虚下划线），点一下在旁边弹一张小卡片，写清
 *         这个词是什么，需要时给一条「继续探索」的链接。
 *
 * 怎么加载：由 article-theme-loader.js 在 localStorage['glossary_enabled']
 *           不是 'false' 时自动引入 glossary.css 与本文 —— 想关掉的用户
 *           连这两个请求都不会发出（与 Umami 开关同一种做法）。
 *
 * 不做什么：不碰排版、不改正文文本、不发任何外部请求。
 * 每个术语在一篇文章里只标**第一次**出现，读长文时不会满屏都是高亮。
 */
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
       1. 术语表
       -------------------------------------------------------------
       t = 术语原文（英文不分大小写匹配）
       d = 解释，一两句话，别写成百科条目
       link = 可选，{ href, text }。href 相对 articles/ 解析
       ============================================================= */
    var TERMS = [
        {
            t: '太鼓控制器',
            d: '《太鼓之达人》的家用鼓形外设：一面小鼓配两根鼓棒，分别敲「咚」和「咔」。便宜的型号其实是塑料壳里塞几个按钮，敲下去的手感跟街机差一大截。'
        },
        {
            t: '太鼓',
            d: '《太鼓之达人》（Taiko no Tatsujin），万代南梦宫的老牌音游：两个鼓面加鼓边，用鼓棒跟着谱面敲。街机版是一面真鼓，家用版可以拿手柄或专用控制器打。',
            link: { href: 'an_old_music_game.html', text: '看看站长写的老音游' }
        },
        {
            t: '音游',
            d: '音乐游戏的统称：谱面按节奏给出音符，玩家在判定线或判定圈上把它打准。街机、手游、键盘、鼓、触屏都算。'
        },
        {
            t: '街机',
            d: '摆在街机厅里的商用游戏机 —— 带专用控制器、投币或刷卡启动，一套机台动辄几万块。它和坐在电脑前玩的最大区别是手感：真鼓、真按键、真踏板。'
        },
        {
            t: '舞萌',
            d: 'maimai 的中文名，SEGA 的圆环式音游：按键围成一圈，还要配合画圆和拍击操作。因为机台长得像滚筒洗衣机，圈内干脆叫它「洗衣机」。',
            link: { href: 'an_old_music_game.html', text: '相关阅读：老音游' }
        },
        {
            t: '中二节奏',
            d: 'CHUNITHM 的常见中文译名，SEGA 的触屏音游：机台是一整块长条触摸板，音符从上方滑下来用手接，判定极严，难度曲线出名地陡。',
            link: { href: 'an_old_music_game.html', text: '相关阅读：老音游' }
        },
        {
            t: 'pjsk',
            d: '《世界计划 多彩舞台！feat. 初音未来》，SEGA 与 Colorful Palette 合作的初音未来题材音游。国内玩家常按罗马字缩写叫它 pjsk。',
            link: { href: 'cppsekai.html', text: '站长做的 pjsk 模拟器' }
        },
        {
            t: '滚奏',
            d: '鼓类演奏手法：鼓棒连续、快速地交替敲击，形成一串连贯的鼓点。音游谱面里通常表现为密集连打，靠的是手腕抖而不是用力砸。'
        },
        {
            t: 'NUC',
            d: 'Intel Next Unit of Computing，巴掌大的迷你主机：一整台电脑塞进 0.5 升的盒子里，省电、安静、便宜，学校机房和电视背后经常能见到。',
            link: { href: 'https://www.intel.cn/content/www/cn/zh/products/details/nuc.html', text: 'Intel 官方介绍' }
        },
        {
            t: '电教',
            d: '电教委员，班上管多媒体设备的那个人：希沃一体机、投影、音箱、班牌，乃至教室的网络，出问题先找他。'
        },
        {
            t: '希沃',
            d: 'seewo（希沃），国内中小学最常见的教学一体机品牌。本质是一块带触摸的 Windows 大屏，所以能装别的软件，也因此成了教室里的「游戏机」。',
            link: { href: 'cppsekai.html', text: '把 pjsk 装进教室' }
        },
        {
            t: '驿站',
            d: '快递驿站，也就是包裹代收点：快递员把件放下、发取件码，收件人凭码自取。学校、小区门口的驿站经常成了「转运站」。'
        },
        {
            t: 'ping',
            d: '网络诊断命令：向目标发一个小探测包，看它回不回、来回花多少毫秒。日常说「ping 一下」，意思就是探一探对方还在不在。'
        },
        {
            t: '丢包',
            d: '数据包丢失：发出去的包没到对面。网络上表现为卡顿、声音断续，游戏里表现为瞬移。文中「都不想丢包」是拿它做了个双关。'
        },
        {
            t: 'FFmpeg',
            d: '开源的命令行音视频处理工具：剪、拼、转码、抽帧、压制全靠它，几乎每个视频网站背后都有。参数难记，但一旦会用就再也离不开。',
            link: { href: 'https://ffmpeg.org/', text: 'FFmpeg 官网' }
        },
        {
            t: '4K60帧',
            d: '分辨率和帧率一起说：4K 指 3840×2160 像素，60 帧指每秒 60 张画面。两样一起上，素材体积和编码压力都是普通 1080p 的好几倍，剪起来很吃机器。'
        },
        {
            t: 'Vocaloid',
            d: '雅马哈的歌声合成技术：输入歌词和旋律，再调参数，就能让虚拟歌手「唱」出来。初音未来就是它最有名的产物。',
            link: { href: 'vocaloidmattersinschool.html', text: '校园里的博歌乐' }
        },
        {
            t: '术力口',
            d: '「ボカロ」（VOCALOID 的日文简称）的中文谐音，圈内自嘲式叫法。说「术力口」的时候，语气一般已经带上了调侃。'
        },
        {
            t: 'ClassIsland',
            d: '开源的桌面课表软件：把课程表、倒计时、天气挂在教室电脑桌面上，国内中学用得很多。站长给它写过样式注入插件。',
            link: { href: 'classislandinjector.html', text: '样式注入插件' }
        },
        {
            t: 'Git',
            d: '版本控制工具：每次改动留一个快照（commit），随时能回退、能分支、能合并。写代码的人用它当「存档点」。',
            link: { href: 'fuckgit.html', text: '站长和 Git 的恩怨' }
        }
    ];

    /* 术语按长度降序排，「太鼓控制器」就永远赢过「太鼓」 */
    TERMS.sort(function (a, b) {
        return b.t.length - a.t.length;
    });

    var isAsciiTerm = {};
    for (var ti = 0; ti < TERMS.length; ti++) {
        isAsciiTerm[TERMS[ti].t] = /[A-Za-z0-9]/.test(TERMS[ti].t);
    }

    /* =============================================================
       2. 主题判定
       -------------------------------------------------------------
       文章页的主题是运行时换掉 <link> 的 href，没有 class 可挂，
       所以直接读样式表地址；读不到再退回 localStorage['theme']。
       ============================================================= */
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

    /* =============================================================
       3. 找出该标注的文本节点
       -------------------------------------------------------------
       跳过：链接（嵌套点击会打架）、代码、标题、已有标注、各种控件。
       ============================================================= */
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

    /* =============================================================
       4. 浮窗
       ============================================================= */
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
        el.appendChild(desc);
        el.appendChild(more);
        document.body.appendChild(el);

        closeBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            close(true);
        });

        tip = el;
        tipParts = { name: name, desc: desc, more: more, moreText: moreText, closeBtn: closeBtn };

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
            /* 排队的这一帧里用户可能已经点掉了浮窗 */
            if (!tip || tip.hidden || !activeTermEl) return;
            place(activeTermEl);
        });
    }

    function place(anchor) {
        var rect = anchor.getBoundingClientRect();
        var vw = document.documentElement.clientWidth;
        var vh = document.documentElement.clientHeight;

        /* 词被滚出视口就收起来，别留一张卡片飘在别处 */
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

    /* =============================================================
       5. 标注
       ============================================================= */
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
