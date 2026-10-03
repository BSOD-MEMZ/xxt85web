/* 两页共用：发行版数据 + 滚动入场。
   数据缓存写在 localStorage —— 未认证的 GitHub 接口每小时只有 60 次额度。 */

(function () {
    'use strict';

    var REPO = 'BSOD-MEMZ/CppSekai';
    var API = 'https://api.github.com/repos/' + REPO + '/releases/latest';
    var CACHE_KEY = 'cppsekai_latest_release';
    var CACHE_TTL = 3 * 60 * 60 * 1000;

    /* ---------- 数据 ---------- */

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

    function attempt(left, cb) {
        var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 9000) : null;

        fetch(API, {
            headers: { Accept: 'application/vnd.github+json' },
            signal: ctrl ? ctrl.signal : undefined
        })
            .then(function (res) {
                if (!res.ok) {
                    var err = new Error('HTTP ' + res.status);
                    // 限流按 IP 每小时 60 次算，重试没有意义
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
                writeCache(data);
                cb(null, data);
            })
            .catch(function (err) {
                if (timer) clearTimeout(timer);
                if (err && err.rateLimited) {
                    cb(err);
                } else if (left > 0) {
                    setTimeout(function () { attempt(left - 1, cb); }, 1500);
                } else {
                    cb(err);
                }
            });
    }

    function loadRelease(cb) {
        var cached = readCache();
        if (cached) {
            cb(null, cached);
            return;
        }
        if (!window.fetch) {
            cb(new Error('no fetch'));
            return;
        }
        attempt(1, cb);
    }


    /* ---------- 滚动入场 ---------- */

    function setupReveal() {
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce || !('IntersectionObserver' in window)) return;

        var sel = '.chapter-head, .chapter-grid, .shot, .figure-item, .ver-card, .plat, .sec, .dl-spec, .hero-figure';
        var els = document.querySelectorAll(sel);
        if (!els.length) return;

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -7% 0px', threshold: 0.05 });

        Array.prototype.forEach.call(els, function (el) {
            el.classList.add('reveal');
            io.observe(el);
        });

        requestAnimationFrame(function () {
            Array.prototype.forEach.call(els, function (el) {
                if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
                    el.classList.add('in');
                    io.unobserve(el);
                }
            });
        });
    }

    /* ---------- 剪贴板 ---------- */

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

    window.CppSekai = {
        repo: REPO,
        releasesUrl: 'https://github.com/' + REPO + '/releases',
        loadRelease: loadRelease,
        fmtSize: fmtSize,
        fmtDate: fmtDate,
        pickAsset: pickAsset,
        copyText: copyText,
        setupReveal: setupReveal
    };
})();
