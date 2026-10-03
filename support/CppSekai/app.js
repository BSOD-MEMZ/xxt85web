(function () {
    'use strict';

    var REPO = 'BSOD-MEMZ/CppSekai';
    var API = 'https://api.github.com/repos/' + REPO + '/releases/latest';
    var RELEASES = 'https://github.com/' + REPO + '/releases';
    var CACHE_KEY = 'cppsekai_latest_release';
    var CACHE_TTL = 3 * 60 * 60 * 1000;

    // 第三方 GitHub 加速前缀。格式统一为「前缀 + 源站完整 URL」，
    // 所以发新版本时这里不需要动 —— 新文件名会自动拼上。
    var MIRRORS = [
        { name: 'ghfast.top', prefix: 'https://ghfast.top/' },
        { name: 'ghproxy.net', prefix: 'https://ghproxy.net/' },
        { name: 'gh-proxy.com', prefix: 'https://gh-proxy.com/' },
        { name: 'ghproxy.cc', prefix: 'https://ghproxy.cc/' }
    ];

    var elVersion = document.getElementById('dlVersion');
    var elFacts = document.getElementById('dlFacts');
    var elPrimary = document.getElementById('dlPrimary');
    var elSource = document.getElementById('dlSource');
    var elMirrors = document.getElementById('mirrors');
    var elMirrorList = document.getElementById('mirrorList');
    var elHeroChips = document.querySelectorAll('[data-rel-ver]');

    function fmtSize(bytes) {
        if (!bytes) return '';
        var mb = bytes / 1048576;
        return (mb >= 1 ? mb.toFixed(1) : (bytes / 1024).toFixed(0) + ' KB').replace(/\.0$/, '') + ' MB';
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

    // 优先挑 zip 安装包；没有 zip 就退回第一个资产
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

    function render(release) {
        if (!release) return false;

        var tag = release.tag_name || release.name || '';
        var asset = pickAsset(release);
        var sourceUrl = asset && asset.browser_download_url
            ? asset.browser_download_url
            : (tag ? RELEASES + '/tag/' + tag : RELEASES);

        if (elVersion) elVersion.textContent = tag || '最新版';

        var facts = [];
        if (fmtDate(release.published_at)) facts.push('发布于 ' + fmtDate(release.published_at));
        if (asset && asset.name) {
            var label = asset.name;
            if (asset.size) label += ' · ' + fmtSize(asset.size);
            facts.push(label);
        }
        if (elFacts) {
            elFacts.textContent = facts.length ? facts.join(' · ') : '已获取最新发行版信息。';
        }

        if (elPrimary) {
            elPrimary.href = sourceUrl;
            elPrimary.textContent = asset && asset.size
                ? '从 GitHub 下载（' + fmtSize(asset.size) + '）'
                : '从 GitHub 下载';
        }
        if (elSource) elSource.href = tag ? RELEASES + '/tag/' + tag : RELEASES;

        for (var i = 0; i < elHeroChips.length; i++) {
            if (tag) elHeroChips[i].textContent = tag;
        }

        if (elMirrors && elMirrorList && asset && asset.browser_download_url) {
            elMirrorList.textContent = '';
            MIRRORS.forEach(function (m) {
                var a = document.createElement('a');
                a.className = 'mirror';
                a.href = m.prefix + asset.browser_download_url;
                a.rel = 'noopener';
                var name = document.createElement('span');
                name.textContent = m.name;
                var arrow = document.createElement('span');
                arrow.className = 'arrow';
                arrow.textContent = '↓';
                a.appendChild(name);
                a.appendChild(arrow);
                elMirrorList.appendChild(a);
            });
            elMirrors.hidden = false;
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
        if (elPrimary) {
            elPrimary.href = RELEASES;
            elPrimary.textContent = '前往 GitHub Releases';
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
                    var err = new Error('HTTP ' + res.status);
                    // 限流是按 IP 每小时 60 次算的，重试没有意义，等也等不来
                    if (res.status === 403 && res.headers && res.headers.get &&
                        res.headers.get('X-RateLimit-Remaining') === '0') {
                        err.rateLimited = true;
                    }
                    throw err;
                }
                return res.json();
            })
            .then(function (data) {
                if (timer) clearTimeout(timer);
                if (render(data)) writeCache(data);
            })
            .catch(function (err) {
                if (timer) clearTimeout(timer);
                if (err && err.rateLimited) {
                    fail(err);
                } else if (retriesLeft > 0) {
                    setTimeout(function () { attempt(retriesLeft - 1); }, 1500);
                } else {
                    fail(err);
                }
            });
    }

    function load() {
        var cached = readCache();
        if (cached && render(cached)) return;

        if (!window.fetch || !window.Promise) {
            fail();
            return;
        }
        attempt(1);
    }

    /* 导航栏滚动态 */
    var nav = document.getElementById('nav');
    function onScroll() {
        if (!nav) return;
        nav.classList.toggle('solid', window.scrollY > 12);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* 滚动入场 */
    function setupReveal() {
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce || !('IntersectionObserver' in window)) return;

        var els = document.querySelectorAll('.sec-head, .pillar, .feat, .shot, .req, .dl-panel, .strip p');
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

        // 首屏元素若已经在视口内，立刻显示，别让它们等滚动
        requestAnimationFrame(function () {
            Array.prototype.forEach.call(els, function (el) {
                if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
                    el.classList.add('in');
                    io.unobserve(el);
                }
            });
        });
    }

    load();
    setupReveal();
})();
