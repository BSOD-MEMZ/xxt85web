/**
 * support/chomowan · 图表绘制脚本(故事线 gitgraph + 成员能力雷达图)
 * ---------------------------------------------------------------------------
 * 从 index.html 的两段内联 <script> 抽出来的。抽出来是因为:
 *   1. 这两张图的"样式"**不在 CSS 里** —— 全部是 canvas 的绘制指令
 *      (fillStyle / strokeStyle / 字体 / 圆角),CSS 完全够不到画布内部。
 *      要跟着主题换外观,就得改绘制代码,挤在 HTML 里改很别扭;
 *   2. 两张图得共用同一套配色,分成两个 IIFE 就只能靠 window 传值。
 *
 * ⚠️ 铁律:默认主题(style.css / xpstyle.css)下必须**和以前一模一样**。
 *    VISTA 那组色值是从原代码里原样搬下来的,一个都没改;手账主题才走 STICKER,
 *    而且颜色全部取自主题 CSS 的 :root 令牌 —— 以后主题调色,图表自动跟着走。
 *
 * 主题判定读的是 #themeCss 的 href:theme-loader.js 在 <head> 里就把 href 改好了,
 * 本脚本在 body 末尾执行,读到的一定是当前真正生效的主题。
 */
(function () {
    'use strict';

    var themeLink = document.getElementById('themeCss');
    var IS_STICKER = !!themeLink && /modern-sticker/.test(themeLink.getAttribute('href') || '');

    /* 读主题令牌(--ink / --c-blue …),取不到就退回同值的字面量 */
    function tok(name, fallback) {
        try {
            var v = getComputedStyle(document.documentElement).getPropertyValue(name);
            v = (v || '').trim();
            return v || fallback;
        } catch (e) {
            return fallback;
        }
    }

    /* ---------- 默认主题:原样保留的 Aero 玻璃配色 ---------- */
    var VISTA = {
        family: '"Microsoft YaHei","Segoe UI",sans-serif',        /* 中文优先(维度标签) */
        familyLatin: '"Segoe UI","Microsoft YaHei",sans-serif',    /* 拉丁优先(日期/标题/链接) */

        spoke: 'rgba(60,95,150,0.35)', spokeW: 1,
        ringOuter: 'rgba(65,105,165,0.9)', ringOuterW: 1.7,
        ringInner: 'rgba(90,130,185,0.55)',
        pin: 'rgba(65,105,165,0.85)', pinR: 2.4,

        vertex: 'glass',          /* 顶点画玻璃小球 */
        polyGradient: true, polyA0: 0.40, polyA1: 0.10, polyBoost: 0.12,
        polyW: 2.3, polyGlow: 15,
        labelInk: '#123a66',

        laneMain: '#2F6FD6',
        laneSpare: ['#3E9B4F', '#E08A1E', '#8E5BD6', '#2FA3A3'],
        laneW: 2.4, laneAlpha: 0.9, laneGlow: 6, laneDash: null,

        chipStyle: 'solid', chipAlpha: 0.92, chipText: '#FFFFFF',
        dateInk: '#7a8ba6', titleInk: '#123a66', descInk: '#5a708c', linkInk: '#1a5cc8',
        linkUnderline: 'solid',

        memberColors: ['#2F6FD6', '#3E9B4F', '#E08A1E']
    };

    /* ---------- 手账主题:纸 + 彩色注记,全部走主题令牌 ---------- */
    var STICKER = {
        family: tok('--font', '"Microsoft YaHei UI","Microsoft YaHei",sans-serif'),

        /* 辐条/网格用纸上的淡线,代替原来那套蓝灰。
           刻意比 --rule 再深一档:纯 --rule 在奶油纸上几乎看不见,
           会变成"图没画完"的样子;用 --rule-2 / --rule-dash 才是铅笔草稿的浓度 */
        spoke: tok('--rule-2', '#DCCFAE'), spokeW: 1.2,
        ringOuter: tok('--rule-dash', '#D3C6A2'), ringOuterW: 1.6,
        ringInner: tok('--rule-2', '#DCCFAE'),
        pin: tok('--rule-dash', '#D3C6A2'), pinR: 2.4,

        vertex: 'dot',            /* 顶点换成纸上一点:白圈 + 实心圆点 */
        polyGradient: false, polyA0: 0.20, polyA1: 0.20, polyBoost: 0.12,
        polyW: 2.2, polyGlow: 0,  /* 去掉辉光:纸面不该发光 */
        labelInk: tok('--ink-2', '#6B655C'),

        laneMain: tok('--c-blue', '#1478C4'),
        laneSpare: [
            tok('--c-teal', '#0E9E92'),
            tok('--c-violet', '#7A45D6'),
            tok('--c-amber', '#D08A00'),
            tok('--c-rose', '#E0416E')
        ],
        laneW: 2.4, laneAlpha: 1, laneGlow: 0, laneDash: [5, 4],

        /* 分支标签从"实心彩底白字"换成纸片:白底 + 彩色描边 + 彩色文字,
           和主题里的 .cat-btn / .xxt-card-tag 一个路子 */
        chipStyle: 'paper', chipAlpha: 1, chipText: null,
        dateInk: tok('--ink-3', '#968D7C'),
        titleInk: tok('--ink', '#3D3A38'),
        descInk: tok('--ink-2', '#6B655C'),
        linkInk: '#2F6E8E',        /* 主题里 a { color } 用的就是这个值 */
        linkUnderline: 'soft',

        memberColors: [
            tok('--c-blue', '#1478C4'),
            tok('--c-green', '#2F9E3F'),
            tok('--c-amber', '#D08A00')
        ]
    };

    var PAL = IS_STICKER ? STICKER : VISTA;

    STICKER.familyLatin = STICKER.family;

    function hexRgb(hex) {
        var n = parseInt(hex.slice(1), 16);
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }

    function rgba(hex, a) {
        var c = hexRgb(hex);
        return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')';
    }

    function font(px, weight, latin) {
        return (weight ? weight + ' ' : '') + px + 'px ' +
            (latin ? PAL.familyLatin : PAL.family);
    }

    /* 顶点画法,两张图共用。默认主题 = Aero 玻璃球;手账主题 = 白圈 + 实心点 */
    function makeVertex(ctx) {
        return function (x, y, color, rad) {
            if (PAL.vertex === 'glass') {
                var c = hexRgb(color);
                var g = ctx.createRadialGradient(x - rad * 0.35, y - rad * 0.45, rad * 0.15, x, y, rad);
                g.addColorStop(0, 'rgba(255,255,255,0.98)');
                g.addColorStop(0.4, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',0.95)');
                g.addColorStop(1, 'rgba(' + Math.floor(c.r * 0.5) + ',' + Math.floor(c.g * 0.5) + ',' + Math.floor(c.b * 0.5) + ',0.95)');
                ctx.beginPath();
                ctx.arc(x, y, rad, 0, Math.PI * 2);
                ctx.fillStyle = g;
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x - rad * 0.3, y - rad * 0.35, rad * 0.3, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,0.85)';
                ctx.fill();
                return;
            }
            /* 纸上一颗圆点:外白圈 + 内实心 */
            ctx.beginPath();
            ctx.arc(x, y, rad, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x, y, Math.max(rad - 1.8, 1), 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        };
    }

    /* =======================================================================
       1. 成员能力雷达图
       ======================================================================= */
    (function () {
        var dims = ['魔丸程度', '学习成绩', '编程能力', '老师信任', '精神状态', '游戏实力'];
        var members = [
            { name: 'kingstar',   color: PAL.memberColors[0], vals: [5, 5, 1, 3, 5, 4] },
            { name: 'AbCd',       color: PAL.memberColors[1], vals: [3, 4, 5, 4, 3, 4] },
            { name: 'xxt8582753', color: PAL.memberColors[2], vals: [4, 2, 3, 3, 5, 3] }
        ];
        /* 等级取值:S=5 A=4 B=3 C=2 D=1 */

        /* ===== 图例 ===== */
        var leg = document.getElementById('mowanRadarLegend');
        if (leg) {
            var html = '';
            for (var m = 0; m < members.length; m++) {
                var mb = members[m];
                html += '<span class="chip"><i class="swatch" style="background:' + mb.color + '"></i><b>@' + mb.name + '</b></span>';
            }
            leg.innerHTML = html;
        }

        var canvas = document.getElementById('mowanRadar');
        if (!canvas || !canvas.getContext) { return; }

        /* ===== 高分屏适配 ===== */
        var dpr = window.devicePixelRatio || 1;
        var W = 620, H = 480;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        var ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        var cx = 310, cy = 268, R = 148, N = dims.length;
        var vertex = makeVertex(ctx);

        function dir(i) {
            var a = (i * 360 / N) * Math.PI / 180;
            return { x: Math.sin(a), y: -Math.cos(a) };
        }

        function pos(i, r) {
            var d = dir(i);
            return { x: cx + d.x * r, y: cy + d.y * r };
        }

        var active = -1; /* -1 = 显示全部;>=0 = 仅显示对应成员 */

        function draw() {
            ctx.clearRect(0, 0, W, H);

        /* ===== 刻度辐条 ===== */
        ctx.save();
        ctx.strokeStyle = PAL.spoke;
        ctx.lineWidth = PAL.spokeW;
        for (var i = 0; i < N; i++) {
            var e = pos(i, R);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(e.x, e.y);
            ctx.stroke();
        }
        ctx.restore();

        /* ===== 五圈等级网格（外→内 S/A/B/C/D，内圈虚线更显"老图纸"味） ===== */
        for (var lv = 1; lv <= 5; lv++) {
            var rr = R * lv / 5;
            ctx.beginPath();
            for (i = 0; i < N; i++) {
                var p = pos(i, rr);
                if (i === 0) { ctx.moveTo(p.x, p.y); } else { ctx.lineTo(p.x, p.y); }
            }
            ctx.closePath();
            ctx.save();
            if (lv === 5) {
                ctx.strokeStyle = PAL.ringOuter;
                ctx.lineWidth = PAL.ringOuterW;
            } else {
                ctx.strokeStyle = PAL.ringInner;
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
            }
            ctx.stroke();
            ctx.restore();
        }
        /* 外圈顶点定位销 */
        for (i = 0; i < N; i++) {
            var pin = pos(i, R);
            ctx.beginPath();
            ctx.arc(pin.x, pin.y, PAL.pinR, 0, Math.PI * 2);
            ctx.fillStyle = PAL.pin;
            ctx.fill();
        }

        /* ===== 成员多边形（active 时不绘制其他成员） ===== */
        for (var mi = 0; mi < members.length; mi++) {
            if (active >= 0 && mi !== active) { continue; }
            var mb = members[mi];
            ctx.beginPath();
            for (i = 0; i < N; i++) {
                var vp = pos(i, R * mb.vals[i] / 5);
                if (i === 0) { ctx.moveTo(vp.x, vp.y); } else { ctx.lineTo(vp.x, vp.y); }
            }
            ctx.closePath();

            ctx.save();
            var boost = (active >= 0) ? PAL.polyBoost : 0;
            if (PAL.polyGradient) {
                var c2 = hexRgb(mb.color);
                var fg = ctx.createLinearGradient(0, cy - R, 0, cy + R);
                fg.addColorStop(0, 'rgba(' + c2.r + ',' + c2.g + ',' + c2.b + ',' + (PAL.polyA0 + boost) + ')');
                fg.addColorStop(1, 'rgba(' + c2.r + ',' + c2.g + ',' + c2.b + ',' + (PAL.polyA1 + boost) + ')');
                ctx.fillStyle = fg;
            } else {
                /* 手账主题:平涂,靠描边和顶点定形,不铺渐变 */
                ctx.fillStyle = rgba(mb.color, PAL.polyA0 + boost);
            }
            ctx.fill();

            if (PAL.polyGlow) {
                ctx.shadowColor = mb.color;
                ctx.shadowBlur = PAL.polyGlow;
            }
            ctx.strokeStyle = mb.color;
            ctx.lineWidth = PAL.polyW;
            ctx.globalAlpha = 0.95;
            ctx.stroke();
            ctx.shadowBlur = 0;

            /* 顶点 */
            for (i = 0; i < N; i++) {
                var bv = pos(i, R * mb.vals[i] / 5);
                vertex(bv.x, bv.y, mb.color, 5.5);
            }
            ctx.restore();
        }

        /* ===== 维度标签 ===== */
        ctx.save();
        ctx.font = font(12, null, false);
        ctx.fillStyle = PAL.labelInk;
        ctx.textBaseline = 'middle';
        for (i = 0; i < N; i++) {
            var d = dir(i);
            var q = pos(i, R + 22);
            var tx = q.x, ta = 'center';
            if (d.x > 0.12) { ta = 'left'; tx += 7; }
            else if (d.x < -0.12) { ta = 'right'; tx -= 7; }
            ctx.textAlign = ta;
            ctx.fillText(dims[i], tx, q.y);
        }
        ctx.restore();
        } /* draw() 结束 */

        /* ===== 交互：点中某人只看 TA，点空白恢复全部 ===== */
        function polyPts(mb) {
            var pts = [];
            for (var i = 0; i < N; i++) { pts.push(pos(i, R * mb.vals[i] / 5)); }
            return pts;
        }

        function pointInPoly(px, py, pts) {
            var inside = false;
            for (var i = 0, j = N - 1; i < N; j = i++) {
                var xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y;
                if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) { inside = !inside; }
            }
            return inside;
        }

        function setActive(idx) {
            active = idx;
            draw();
            if (leg) {
                var chips = leg.children;
                for (var k = 0; k < chips.length; k++) {
                    chips[k].className = 'chip' + (k === idx ? ' chip-active' : '');
                }
            }
        }

        /* 图例 chip 点击：只看某人（再次点击同一个取消） */
        if (leg) {
            var chips = leg.children;
            for (var ci = 0; ci < chips.length; ci++) {
                (function (idx) {
                    chips[ci].addEventListener('click', function () {
                        setActive(idx === active ? -1 : idx);
                    });
                })(ci);
            }
        }

        function canvasPoint(ev) {
            var rect = canvas.getBoundingClientRect();
            return {
                x: (ev.clientX - rect.left) * (W / rect.width),
                y: (ev.clientY - rect.top) * (H / rect.height)
            };
        }

        /* 画布点击：点中某人多边形只看 TA；点空白恢复全部 */
        canvas.addEventListener('click', function (ev) {
            var pt = canvasPoint(ev);
            for (var mi = members.length - 1; mi >= 0; mi--) {
                if (pointInPoly(pt.x, pt.y, polyPts(members[mi]))) { setActive(mi); return; }
            }
            setActive(-1);
        });

        /* 悬停指针提示 */
        canvas.addEventListener('mousemove', function (ev) {
            var pt = canvasPoint(ev);
            var hit = false;
            for (var mi = members.length - 1; mi >= 0; mi--) {
                if (pointInPoly(pt.x, pt.y, polyPts(members[mi]))) { hit = true; break; }
            }
            canvas.style.cursor = hit ? 'pointer' : 'default';
        });

        draw();
    })();

    /* =======================================================================
       2. 主线剧情图(沿时间轴的 gitgraph)
       ======================================================================= */
    (function () {
        var story = [
            { date: '2025.12', branch: 'main',   title: '殖民学校电脑搞开发', link: '../../articles/wefuckedsalt.html', linkText: '我和AbCd白嫖了一台12代i5电脑！' },
            { date: '2025.12', branch: 'main',   title: '校内违规使用电子产品教学', link: '../../articles/fucknfzx.html', linkText: '校园电子产品生存指南' },
            { date: '2026.1', branch: 'main',   title: '在学校里组NAS', link: '../../articles/webuildnas.html', linkText: '垃圾佬在学校里开网吧惨遭制裁' },
            { date: '2026.2', branch: 'main',   title: '直接睡在机房里', link: 'https://xxtsoft.top/media/player.html?id=10', linkText: 'Mission Impossible : The Long Dark Basement - 碟中谍9：永夜堡垒' },
            { date: '2026.4', branch: 'main',   title: '严厉谴责学校的电子产品大扫荡', link: '../../articles/robberofnfzx.html', linkText: '南方中学的居民和强盗' },
            { date: '2026.5', branch: 'main',   title: '远程控制电脑遭到反噬', link: '../../articles/wefuckedsalt.html', linkText: '我和AbCd白嫖了一台12代i5电脑！' },
            { date: '2026.6', branch: 'main',   title: '失去信任，决定斗争到底', link: '../../articles/wefuckedsalt.html', linkText: '我和AbCd白嫖了一台12代i5电脑！' },
            { date: '2026.7', branch: 'main',   title: '被年级组组长猜疑', link: '../../articles/unsleepnight.html', linkText: '不眠之夜' },
            { date: '2026.8', branch: 'main',   title: '在学校里打音游', link: '../../articles/taiko.html', linkText: '填补株洲市音游教育的空白！南方中学“咚咚雷音祭”计划！' },
        ];

        var canvas = document.getElementById('storyGraph');
        if (!canvas || !canvas.getContext) { return; }

        var dpr = window.devicePixelRatio || 1;
        var W = 620, rowH = 80, topPad = 36, bottomPad = 24;
        var H = topPad + (story.length - 1) * rowH + bottomPad;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        var ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        var laneX0 = 64, laneGap = 52;
        var lanes = {}, laneCount = 0;
        var branchColor = { main: PAL.laneMain };
        var vertex = makeVertex(ctx);

        function laneOf(name) {
            if (!(name in lanes)) {
                lanes[name] = laneCount++;
                if (!(name in branchColor)) {
                    branchColor[name] = PAL.laneSpare[(laneCount - 2) % PAL.laneSpare.length];
                }
            }
            return lanes[name];
        }

        /* 直线 / gitgraph 的 S 形分叉合并曲线 */
        function branchLine(x1, y1, x2, y2, color, dashed) {
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = PAL.laneW;
            ctx.globalAlpha = PAL.laneAlpha;
            /* 手账主题:支线走铅笔虚线,主线实线,一眼看得出主干 */
            if (dashed && PAL.laneDash) { ctx.setLineDash(PAL.laneDash); }
            if (PAL.laneGlow) {
                ctx.shadowColor = color;
                ctx.shadowBlur = PAL.laneGlow;
            }
            ctx.beginPath();
            if (Math.abs(x1 - x2) < 0.5) {
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
            } else {
                var dx = x2 - x1, dy = y2 - y1;
                ctx.moveTo(x1, y1);
                ctx.bezierCurveTo(x1 + dx * 0.6, y1, x2, y2 - dy * 0.6, x2, y2);
            }
            ctx.stroke();
            ctx.restore();
        }

        /* 分支标签:默认主题是实心彩底白字的手感,手账主题是一张纸片贴纸 */
        function pill(x, y, w, h, r, color, text) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
            if (PAL.chipStyle === 'paper') {
                ctx.fillStyle = 'rgba(255,255,255,0.94)';
                ctx.fill();
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.fillStyle = color;
            } else {
                ctx.fillStyle = color;
                ctx.globalAlpha = PAL.chipAlpha;
                ctx.fill();
                ctx.globalAlpha = 1;
                ctx.fillStyle = PAL.chipText;
            }
            ctx.font = font(10, 'bold', true);
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            ctx.fillText(text, x + 7, y + h / 2 + 0.5);
            ctx.restore();
        }

        function wrapText(text, x, y, maxW, lineH) {
            if (!text) { return y - lineH; }
            var line = '', yy = y;
            for (var i = 0; i < text.length; i++) {
                var test = line + text.charAt(i);
                if (ctx.measureText(test).width > maxW && line) {
                    ctx.fillText(line, x, yy);
                    line = text.charAt(i);
                    yy += lineH;
                } else {
                    line = test;
                }
            }
            if (line) { ctx.fillText(line, x, yy); }
            return yy;
        }

        /* 预计算每行的轨道与坐标 */
        var rows = [];
        for (var i = 0; i < story.length; i++) {
            var b = story[i].branch || 'main';
            laneOf(b);
            rows.push({ branch: b, color: branchColor[b], x: laneX0 + lanes[b] * laneGap, y: topPad + i * rowH });
        }

        /* 连线（先线后点）：同支线连竖线，换支线画分叉/合并曲线，主线跨支线段落自动补竖线 */
        var lastRow = {};
        for (i = 0; i < rows.length; i++) {
            var r = rows[i];
            var dashed = r.branch !== 'main';
            var last = lastRow[r.branch];
            if (last !== undefined && !(last === i - 1 && rows[last].x !== r.x)) {
                branchLine(rows[last].x, rows[last].y, r.x, r.y, r.color, dashed);
            }
            if (i > 0 && rows[i - 1].branch !== r.branch) {
                branchLine(rows[i - 1].x, rows[i - 1].y, r.x, r.y, r.color, dashed);
            }
            lastRow[r.branch] = i;
        }

        /* 节点 */
        for (i = 0; i < rows.length; i++) {
            vertex(rows[i].x, rows[i].y, rows[i].color, rows[i].branch === 'main' ? 7.5 : 6.5);
        }

        /* 分支标签 + 日期 + 标题 + 描述 */
        for (i = 0; i < rows.length; i++) {
            var r = rows[i];
            var st = story[i];
            var tx = r.x + 22;
            var maxW = W - tx - 16;
            ctx.font = font(10, 'bold', true);
            var tw = ctx.measureText(r.branch).width + 14;
            pill(tx, r.y - 31, tw, 15, 7.5, r.color, r.branch);
            ctx.font = font(11, null, true);
            ctx.fillStyle = PAL.dateInk;
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(st.date, tx + tw + 8, r.y - 19);
            ctx.font = font(13, 'bold', false);
            ctx.fillStyle = PAL.titleInk;
            ctx.fillText(st.title, tx, r.y - 3);
            var descEnd = r.y - 1;
            if (st.desc) {
                ctx.font = font(12, null, false);
                ctx.fillStyle = PAL.descInk;
                descEnd = wrapText(st.desc, tx, r.y + 15, maxW, 16);
            }
            /* 链接文字（下划线，节点可点击） */
            if (st.link) {
                var linkY = st.desc ? descEnd + 18 : r.y + 15;
                ctx.font = font(12, null, true);
                ctx.fillStyle = PAL.linkInk;
                var linkStr = st.linkText || '查看详情 »';
                ctx.fillText(linkStr, tx, linkY);
                var uw = ctx.measureText(linkStr).width;
                if (PAL.linkUnderline === 'soft') {
                    /* 手账主题:细淡的一条线,对应主题里 a { border-bottom: 1px solid rgba(...,.28) } */
                    ctx.save();
                    ctx.globalAlpha = 0.34;
                    ctx.fillRect(tx, linkY + 2.5, uw, 1);
                    ctx.restore();
                } else {
                    ctx.fillRect(tx, linkY + 2, uw, 1);
                }
                r.link = st.link;
            }
        }

        /* 链接交互：悬停变指针，点击节点打开 link（当前页跳转） */
        function storyPoint(ev) {
            var rect = canvas.getBoundingClientRect();
            return {
                x: (ev.clientX - rect.left) * (W / rect.width),
                y: (ev.clientY - rect.top) * (H / rect.height)
            };
        }
        function hitStoryRow(pt) {
            for (var i = 0; i < rows.length; i++) {
                var r = rows[i];
                if (r.link && pt.x > r.x - 14 && pt.x < W && pt.y > r.y - 36 && pt.y < r.y + 44) { return r; }
            }
            return null;
        }
        canvas.addEventListener('mousemove', function (ev) {
            canvas.style.cursor = hitStoryRow(storyPoint(ev)) ? 'pointer' : 'default';
        });
        canvas.addEventListener('click', function (ev) {
            var r = hitStoryRow(storyPoint(ev));
            if (r) { window.location.href = r.link; }
        });
    })();
})();
