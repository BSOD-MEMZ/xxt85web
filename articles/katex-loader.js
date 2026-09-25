/**
 * xxtsoft · 文章 LaTeX 渲染
 *
 * 用法:在文章页 `</body>` 前加一行
 *     <script src="katex-loader.js"></script>
 * 然后正文里就能直接写公式了:
 *     行内  $E = mc^2$        或  \(a^2+b^2=c^2\)
 *     独行  $$\int_0^1 x^2 dx$$  或  \[ ... \]
 *
 * 设计约束(和站点其他脚本一致):
 *   · 零外部请求 —— KaTeX 已落在 vendor/katex/,字体也在本地,不碰任何 CDN
 *   · 按需加载 —— 页面上没有公式就一个字节都不去取
 *   · 不改正文文字 —— 只把 $...$ 包起来的那一段替换成渲染结果
 *   · 主题无关 —— 只负责排版数学,颜色由 CSS 变量接管(见 CSS 里的 .katex 规则)
 *
 * 为什么不用 KaTeX 官方的 auto-render(虽然也下了一份):
 *   那个脚本会把整篇正文当纯文本扫,遇到代码块里的 `$` 也会当公式 —— 
 *   技术文章里 `$` 出现得太频繁了(命令行提示符、PHP 变量、正则)。
 *   所以这里自己走一遍 DOM,主动跳过 pre / code / script / style。
 */
(function () {
    'use strict';

    var BASE = (function () {
        // 由本脚本自身的 src 推路径。
        // 本脚本在 articles/ 下,而 KaTeX 落在站点根的 vendor/katex/ ——
        // 所以从自己的 URL 里砍掉 "articles/katex-loader.js",
        // 得到站点根,再拼 vendor/katex/。(曾经这里直接返回 articles/,
        // 结果去取 articles/katex.min.js 404,公式一直渲染不出来。)
        var ss = document.getElementsByTagName('script');
        for (var i = ss.length - 1; i >= 0; i--) {
            if (ss[i].src && ss[i].src.indexOf('katex-loader.js') !== -1) {
                return ss[i].src.replace(/articles\/katex-loader\.js.*$/, '') +
                    'vendor/katex/';
            }
        }
        // 兜底:如果没匹配到 articles/ 前缀(比如被内联或换了目录),
        // 回退成"相对本文件"的 ../vendor/katex/
        return '../vendor/katex/';
    })();

    /* 定界符。顺序有讲究:$$ 必须在 $ 前面,否则 $$ 会被当成两个 $ 处理 */
    var DELIMS = [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false },
        { left: '$', right: '$', display: false }
    ];

    /* 这些标签的文本一律不碰:代码、脚本、样式,以及已经渲染过的公式 */
    var SKIP = {
        PRE: 1, CODE: 1, SCRIPT: 1, STYLE: 1, TEXTAREA: 1,
        KBD: 1, SAMP: 1, NOSCRIPT: 1
    };

    var loaded = false;
    var loadCallbacks = [];

    function loadKaTeX(done) {
        if (loaded) { done(); return; }
        loadCallbacks.push(done);
        if (loadCallbacks.length > 1) return;   // 已在加载中

        var css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = BASE + 'katex.min.css';
        document.head.appendChild(css);

        var s = document.createElement('script');
        s.src = BASE + 'katex.min.js';
        s.onload = function () {
            loaded = true;
            var cbs = loadCallbacks;
            loadCallbacks = [];
            cbs.forEach(function (cb) { cb(); });
        };
        s.onerror = function () {
            /* 加载失败就保持原文,不影响阅读 */
            loadCallbacks = [];
        };
        document.head.appendChild(s);
    }

    /* 页面上到底有没有公式?没有就完全不加载 KaTeX */
    function hasMath(root) {
        var text = root.textContent || '';
        if (text.indexOf('$') === -1 && text.indexOf('\\(') === -1 &&
            text.indexOf('\\[') === -1) {
            return false;
        }

        // 粗略再筛一次:把代码块里的 $ 排掉后再看
        var probe = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: function (node) {
                var p = node.parentNode;
                while (p && p !== root) {
                    if (SKIP[p.nodeType === 1 ? p.nodeName : '']) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    p = p.parentNode;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        });

        var n;
        while ((n = probe.nextNode())) {
            var t = n.nodeValue || '';
            if (t.indexOf('$') !== -1 || t.indexOf('\\(') !== -1 ||
                t.indexOf('\\[') !== -1) {
                return true;
            }
        }
        return false;
    }

    /* 在一段纯文本里找公式,切成长度不固定的片段数组 */
    function splitTex(text) {
        var parts = [];
        var i = 0;
        var buf = '';

        function flush() {
            if (buf) { parts.push({ type: 'text', value: buf }); buf = ''; }
        }

        while (i < text.length) {
            var matched = null;

            for (var d = 0; d < DELIMS.length; d++) {
                var dl = DELIMS[d];
                if (text.substr(i, dl.left.length) !== dl.left) continue;

                // 转义的定界符(\$)不当公式起始
                if (dl.left === '$' && i > 0 && text[i - 1] === '\\') continue;

                var end = text.indexOf(dl.right, i + dl.left.length);
                if (end === -1) continue;

                // $$...$$ 中间不允许是空串
                if (end === i + dl.left.length) continue;

                matched = { dl: dl, start: i, end: end };
                break;
            }

            if (matched) {
                flush();
                var body = text.slice(
                    matched.start + matched.dl.left.length,
                    matched.end
                );
                parts.push({
                    type: 'math',
                    value: body,
                    display: matched.dl.display
                });
                i = matched.end + matched.dl.right.length;
                continue;
            }

            buf += text[i];
            i++;
        }

        flush();
        return parts;
    }

    function renderOne(tex, display) {
        try {
            return katex.renderToString(tex, {
                displayMode: display,
                throwOnError: false,       // 语法错误时原样显示,不炸掉整篇文章
                errorColor: '#C0392B',
                strict: false,
                trust: false,
                macros: {}
            });
        } catch (e) {
            return null;
        }
    }

    /* 把一段文字节点换成「文字 + 公式节点」的碎片 */
    function processTextNode(node) {
        var text = node.nodeValue;
        if (!text || (text.indexOf('$') === -1 &&
                      text.indexOf('\\(') === -1 &&
                      text.indexOf('\\[') === -1)) {
            return;
        }

        var parts = splitTex(text);
        if (parts.length === 1 && parts[0].type === 'text') return;

        var frag = document.createDocumentFragment();
        var hasMath = false;

        parts.forEach(function (p) {
            if (p.type === 'text') {
                frag.appendChild(document.createTextNode(p.value));
                return;
            }

            var html = renderOne(p.value, p.display);
            if (!html) {
                // 渲染不了就原样写回去,别丢内容
                frag.appendChild(document.createTextNode(
                    (p.display ? '$$' : '$') + p.value + (p.display ? '$$' : '$')
                ));
                return;
            }

            hasMath = true;
            var span = document.createElement('span');
            span.className = p.display
                ? 'xxt-math xxt-math-display'
                : 'xxt-math xxt-math-inline';
            span.innerHTML = html;
            frag.appendChild(span);
        });

        if (!hasMath) return;
        if (node.parentNode) {
            node.parentNode.replaceChild(frag, node);
        }
    }

    function walk(root) {
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: function (node) {
                if (!node.nodeValue || !node.nodeValue.trim()) {
                    return NodeFilter.FILTER_REJECT;
                }
                var p = node.parentNode;
                while (p && p !== root) {
                    if (p.nodeType === 1) {
                        if (SKIP[p.nodeName]) return NodeFilter.FILTER_REJECT;
                        // 已渲染过的公式不要再进去
                        if (p.classList &&
                            p.classList.contains('xxt-math')) {
                            return NodeFilter.FILTER_REJECT;
                        }
                    }
                    p = p.parentNode;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        });

        // 先把节点收齐再改 DOM,边遍历边改会漏
        var nodes = [];
        var n;
        while ((n = walker.nextNode())) nodes.push(n);
        nodes.forEach(processTextNode);
    }

    function run() {
        var root = document.querySelector('.article-content') || document.body;
        if (!hasMath(root)) return;

        loadKaTeX(function () {
            if (typeof katex === 'undefined') return;
            walk(root);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
