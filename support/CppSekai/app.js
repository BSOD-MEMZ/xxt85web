(function () {
    'use strict';

    var INTRO_KEY = 'cppsekai_intro';

    // 进站开屏 —— 结构、时间轴、收尾方式全部照搬 pjsk 1.5 周年页：
    // 时长不写死在这里，而是读 .c-loading 在 intro.css 里的 animation-duration / -delay，
    // 这样以后调 CSS 里的节奏，JS 不用跟着改。
    function setupIntro() {
        var root = document.querySelector('.js-loading');
        if (!root) {
            document.body.classList.remove('is-loading');
            return;
        }

        // 收尾：把三段演出内容拆掉，整块淡出后移除
        function finish() {
            var parts = ['c-loading__text', 'c-loading__tree', 'c-loading__energy'];
            for (var i = 0; i < parts.length; i++) {
                var el = root.querySelector('.' + parts[i]);
                if (el) el.remove();
            }
            root.style.transition = 'opacity 1.2s ease';
            root.style.opacity = '0';
            setTimeout(function () { root.remove(); }, 1200);
        }

        function start() {
            // 先把 is-loading 摘掉，动画才会从头开始跑
            document.body.classList.remove('is-loading');

            var skip = root.querySelector('.js-skip-button');
            var reduce = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            // 系统限制动效，或本次会话已经放过 —— 直接收场
            if (reduce || document.documentElement.classList.contains('intro-seen')) {
                if (skip) skip.style.display = 'none';
                document.body.classList.add('--loaded');
                finish();
                return;
            }

            try { sessionStorage.setItem(INTRO_KEY, 'seen'); } catch (e) { }

            var cs = window.getComputedStyle(root);
            var dur = (parseFloat(cs.animationDuration) || 2.1) * 1000;
            var delay = (parseFloat(cs.animationDelay) || 10.45) * 1000;
            var total = dur + delay;

            // 树快淡出前先把页面滚回顶部
            var t1 = setTimeout(function () {
                window.scrollTo(0, 0);
                document.body.classList.add('--f-loaded');
            }, Math.max(0, delay - 600));

            var t2 = setTimeout(function () {
                document.body.classList.add('--loaded');
                root.remove();
            }, total);

            function skipNow() {
                clearTimeout(t1);
                clearTimeout(t2);
                document.body.classList.add('--loaded');
                finish();
            }

            if (skip) skip.addEventListener('click', skipNow);
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' || e.keyCode === 27) skipNow();
            });
        }

        if (document.readyState === 'complete') start();
        else window.addEventListener('load', start);
    }

    function set(sel, text) {
        var els = document.querySelectorAll(sel);
        for (var i = 0; i < els.length; i++) els[i].textContent = text;
    }

    function fillRelease() {
        if (!window.CppSekai) return;

        window.CppSekai.loadRelease(function (err, release) {
            if (err || !release) {
                set('[data-rel-ver]', '见 Releases');
                set('[data-rel-date]', '—');
                set('[data-rel-size]', '—');
                return;
            }

            var R = window.CppSekai;
            var tag = release.tag_name || release.name || '';
            var asset = R.pickAsset(release);

            set('[data-rel-ver]', tag || '最新版');
            set('[data-rel-date]', R.fmtDate(release.published_at) || '—');
            set('[data-rel-size]', asset && asset.size ? R.fmtSize(asset.size) : '—');
        });
    }

    setupIntro();

    if (window.CppSekai) {
        window.CppSekai.setupNav();
        window.CppSekai.setupReveal();
    }

    fillRelease();
})();
