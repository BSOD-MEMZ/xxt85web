(function () {
    'use strict';

    var REPO = 'BSOD-MEMZ/CppSekai';
    var API = 'https://api.github.com/repos/' + REPO + '/releases/latest';
    var RELEASES = 'https://github.com/' + REPO + '/releases';
    var CACHE_KEY = 'cppsekai_latest_release';
    var INTRO_KEY = 'cppsekai_intro';
    var CACHE_TTL = 3 * 60 * 60 * 1000;

    // 前四个是第三方加速前缀：统一走「前缀 + 源站完整 URL」，所以发新版本这里不用动。
    // 最后一个是高校镜像站，走「前缀 + tag + 文件名」；等它的收录申请通过，把 ready 改成 true 就会自动出现。
    var MIRRORS = [
        { name: 'ghfast.top', note: '社区加速', type: 'prefix', base: 'https://ghfast.top/', ready: true },
        { name: 'gh-proxy.com', note: '社区加速', type: 'prefix', base: 'https://gh-proxy.com/', ready: true },
        { name: 'ghproxy.net', note: '社区加速', type: 'prefix', base: 'https://ghproxy.net/', ready: true },
        { name: 'ghproxy.cc', note: '社区加速', type: 'prefix', base: 'https://ghproxy.cc/', ready: true },
        {
            name: 'mirror.nju.edu.cn', note: '南京大学镜像站', type: 'release',
            base: 'https://mirror.nju.edu.cn/github-release/' + REPO + '/', ready: false
        }
    ];

    var elVersion = document.getElementById('dlVersion');
    var elFacts = document.getElementById('dlFacts');
    var elPrimary = document.getElementById('dlPrimary');
    var elPrimarySub = document.getElementById('dlPrimarySub');
    var elCopy = document.getElementById('dlCopy');
    var elMirrors = document.getElementById('mirrors');
    var elMirrorList = document.getElementById('mirrorList');
    var elHashLine = document.getElementById('hashLine');
    var elHashValue = document.getElementById('hashValue');
    var elHashCopy = document.getElementById('hashCopy');
    var elClVersion = document.getElementById('clVersion');
    var elClDate = document.getElementById('clDate');
    var elClBody = document.getElementById('clBody');
    var elHeroChips = document.querySelectorAll('[data-rel-ver]');

    function fmtSize(bytes) {
        if (!bytes) return '';
        var mb = bytes / 1048576;
        if (mb >= 1) return (Math.round(mb * 10) / 10) + ' MB';
        return Math.round(bytes / 1024) + ' KB';
    }

    function fmtDate(iso) {
        if (!iso) return '';
        var d = new Date(iso);
        if (isNaN(d)) return '';
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
            '-' + String(d.getDate()).padStart(2, '0');
    }

    function readCache() {
        try {
            var raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            var o = JSON.parse(raw);
            if (!o || !o.savedAt || Date.now() - o.savedAt > CACHE_TTL) return null;
            return o.release || null;
        } catch (e) {
            return null;
        }
    }

    function writeCache(release) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), release: release }));
        } catch (e) { /* 隐私模式下写不进去也无所谓 */ }
    }

    function pickAsset(release) {
        var assets = (release && release.assets) || [];
        if (!assets.length) return null;
        var zip = null;
        for (var i = 0; i < assets.length; i++) {
            var a = assets[i];
            if (!a || !a.name) continue;
            if (/\.zip$/i.test(a.name) && (!zip || (a.download_count || 0) >= (zip.download_count || 0))) {
                zip = a;
            }
        }
        return zip || assets[0];
    }

    function mirrorUrl(m, asset, tag) {
        if (m.type === 'release') return m.base + tag + '/' + asset.name;
        return m.base + asset.browser_download_url;
    }

    function renderChangelog(release, tag) {
        if (elClVersion) elClVersion.textContent = tag || '—';
        if (elClDate) {
            var d = fmtDate(release.published_at);
            elClDate.textContent = d ? '发布于 ' + d : '';
        }
        if (!elClBody) return;

        var md = String(release.body || '');
        elClBody.textContent = '';

        if (!md.trim()) {
            var empty = document.createElement('p');
            empty.className = 'cl-loading';
            empty.textContent = '这次发布没有写说明。';
            elClBody.appendChild(empty);
            return;
        }

        // 只认「空行分段 + 短横线列表」这两种写法，全部走 textContent，不做 HTML 解析
        var frag = document.createDocumentFragment();
        var ul = null;
        md.replace(/\r\n/g, '\n').split('\n').forEach(function (raw) {
            var line = raw.replace(/[\u2028\u2029]/g, '').trim();
            if (!line) {
                ul = null;
                return;
            }
            if (/^[-*]\s+/.test(line)) {
                if (!ul) {
                    ul = document.createElement('ul');
                    frag.appendChild(ul);
                }
                var li = document.createElement('li');
                li.textContent = line.replace(/^[-*]\s+/, '');
                ul.appendChild(li);
            } else {
                ul = null;
                var p = document.createElement('p');
                p.textContent = line;
                frag.appendChild(p);
            }
        });
        elClBody.appendChild(frag);
    }

    function renderMirrors(asset, tag) {
        if (!elMirrors || !elMirrorList || !asset || !asset.browser_download_url) return;

        elMirrorList.textContent = '';
        var shown = 0;

        MIRRORS.forEach(function (m) {
            if (!m.ready) return;

            var a = document.createElement('a');
            a.className = 'mirror';
            a.href = mirrorUrl(m, asset, tag);
            a.rel = 'noopener';

            var top = document.createElement('span');
            top.className = 'mirror-top';

            var nm = document.createElement('span');
            nm.className = 'mirror-name';
            nm.textContent = m.name;

            var ar = document.createElement('span');
            ar.className = 'arrow';
            ar.textContent = '↓';

            top.appendChild(nm);
            top.appendChild(ar);

            var nt = document.createElement('span');
            nt.className = 'mirror-note';
            nt.textContent = m.note;

            a.appendChild(top);
            a.appendChild(nt);
            elMirrorList.appendChild(a);
            shown++;
        });

        elMirrors.hidden = shown === 0;
    }

    function render(release) {
        if (!release) return false;

        var tag = release.tag_name || release.name || '';
        var asset = pickAsset(release);
        var sourceUrl = asset && asset.browser_download_url
            ? asset.browser_download_url
            : (tag ? RELEASES + '/tag/' + tag : RELEASES);
        var size = asset && asset.size ? fmtSize(asset.size) : '';

        if (elVersion) elVersion.textContent = tag || '最新版';

        var facts = [];
        if (fmtDate(release.published_at)) facts.push('发布于 ' + fmtDate(release.published_at));
        if (asset && asset.name) facts.push(asset.name + (size ? ' · ' + size : ''));
        if (elFacts) elFacts.textContent = facts.length ? facts.join(' · ') : '已获取最新发行版信息。';

        if (elPrimary) elPrimary.href = sourceUrl;
        if (elPrimarySub) {
            elPrimarySub.textContent = ['Windows 7 SP1+', '免安装', size].filter(Boolean).join(' · ');
        }

        if (elCopy) {
            elCopy.hidden = false;
            elCopy.setAttribute('data-url', sourceUrl);
        }

        var hash = asset && asset.digest ? String(asset.digest).replace(/^sha256:/i, '') : '';
        if (elHashLine && elHashValue && hash) {
            elHashValue.textContent = hash;
            elHashValue.title = hash;
            elHashLine.hidden = false;
            if (elHashCopy) elHashCopy.setAttribute('data-hash', hash);
        }

        renderMirrors(asset, tag);
        renderChangelog(release, tag);

        for (var i = 0; i < elHeroChips.length; i++) {
            if (tag) elHeroChips[i].textContent = tag;
        }

        return true;
    }

    function fail(err) {
        if (elFacts) {
            elFacts.textContent = err && err.rateLimited
                ? 'GitHub 的接口这会儿对未登录请求限流了（每小时 60 次），过一阵刷新就好 —— 也可以直接点下面的按钮去 Releases 页面挑。'
                : '没能从 GitHub 取到版本信息（网络不通或接口临时出错），直接点下面的按钮去 Releases 页面选一个就好。';
        }
        if (elVersion) elVersion.textContent = '见 Releases';
        if (elPrimary) elPrimary.href = RELEASES;
        if (elPrimarySub) elPrimarySub.textContent = 'Windows 7 SP1+ · 免安装 · 去 Releases 页面挑一个';
        if (elClVersion) elClVersion.textContent = '见 Releases';
        if (elClDate) elClDate.textContent = '';
        if (elClBody) {
            elClBody.textContent = '';
            var p = document.createElement('p');
            p.className = 'cl-loading';
            p.textContent = '这边没读到发行说明，点下面的链接去 GitHub 上看吧。';
            elClBody.appendChild(p);
        }
    }

    function attempt(retriesLeft) {
        var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 9000) : null;

        fetch(API, {
            headers: { Accept: 'application/vnd.github+json' },
            signal: ctrl ? ctrl.signal : undefined
        })
            .then(function (res) {
                if (!res.ok) {
                    var e = new Error('HTTP ' + res.status);
                    // 限流是按 IP 每小时 60 次算的，重试没有意义
                    if (res.status === 403 && res.headers && res.headers.get &&
                        res.headers.get('X-RateLimit-Remaining') === '0') {
                        e.rateLimited = true;
                    }
                    throw e;
                }
                return res.json();
            })
            .then(function (data) {
                if (timer) clearTimeout(timer);
                if (render(data)) writeCache(data);
            })
            .catch(function (e) {
                if (timer) clearTimeout(timer);
                if (e && e.rateLimited) {
                    fail(e);
                } else if (retriesLeft > 0) {
                    setTimeout(function () { attempt(retriesLeft - 1); }, 1500);
                } else {
                    fail(e);
                }
            });
    }

    function loadRelease() {
        var cached = readCache();
        if (cached && render(cached)) return;

        if (!window.fetch || !window.Promise) {
            fail();
            return;
        }
        attempt(1);
    }

    function copyText(text, btn, label) {
        if (!text || !btn) return;
        var original = btn.textContent;

        function done() {
            btn.textContent = label || '已复制';
            setTimeout(function () { btn.textContent = original; }, 1700);
        }

        function fallback() {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.top = '-1000px';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); done(); } catch (e) { }
            document.body.removeChild(ta);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done).catch(fallback);
        } else {
            fallback();
        }
    }

    function setupCopyButtons() {
        if (elCopy) {
            elCopy.addEventListener('click', function () {
                copyText(elCopy.getAttribute('data-url'), elCopy, '已复制');
            });
        }
        if (elHashCopy) {
            elHashCopy.addEventListener('click', function () {
                copyText(elHashCopy.getAttribute('data-hash'), elHashCopy, '已复制');
            });
        }
    }

    function setupIntro() {
        var intro = document.getElementById('intro');
        if (!intro) return;
        if (document.documentElement.classList.contains('intro-done')) return;

        var finished = false;
        function finish() {
            if (finished) return;
            finished = true;
            document.documentElement.classList.add('intro-done');
            try { localStorage.setItem(INTRO_KEY, 'seen'); } catch (e) { }
        }

        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            finish();
            return;
        }

        var skip = document.getElementById('introSkip');
        if (skip) skip.addEventListener('click', finish);

        // 动画本身约 2.4s，留一点余量；跳过与自然结束走同一个出口
        setTimeout(finish, 2600);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' || e.keyCode === 27) finish();
        });
    }

    function setupNav() {
        var nav = document.getElementById('nav');
        if (!nav) return;
        function onScroll() {
            nav.classList.toggle('solid', window.scrollY > 12);
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    function setupReveal() {
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce || !('IntersectionObserver' in window)) return;

        var els = document.querySelectorAll('.sec-head, .pillar, .feat, .shot, .req, .dl-panel, .cl-panel, .strip p');
        if (!els.length) return;

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

        Array.prototype.forEach.call(els, function (el) {
            el.classList.add('reveal');
            io.observe(el);
        });

        requestAnimationFrame(function () {
            Array.prototype.forEach.call(els, function (el) {
                if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
                    el.classList.add('in');
                    io.unobserve(el);
                }
            });
        });
    }

    setupIntro();
    setupCopyButtons();
    setupNav();
    loadRelease();
    setupReveal();
})();
