(function () {
    'use strict';

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

            // 只有系统开了「减少动态效果」才跳过 —— 平时每次都播
            if (reduce) {
                if (skip) skip.style.display = 'none';
                document.body.classList.add('--loaded');
                finish();
                return;
            }

            var cs = window.getComputedStyle(root);
            var dur = (parseFloat(cs.animationDuration) || 2.1) * 1000;
            var delay = (parseFloat(cs.animationDelay) || 10.45) * 1000;
            var total = dur + delay;

            // 树快淡出前先把页面滚回顶部
            var t1 = setTimeout(function () {
                window.scrollTo(0, 0);
                document.body.classList.add('--f-loaded');
                document.body.classList.add('--loaded');
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


    // 首页那句「「教室」变___」：团体的 SEKAI 一个接一个滑上来。
    // 末尾补一份首项，滑到克隆项后再瞬移回开头，看不出接缝。
    function setupSekaiRoll() {
        var track = document.getElementById('sekaiTrack');
        if (!track || !track.children.length) return;

        if (window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        var items = track.children;
        var total = items.length;
        if (total < 2) return;

        track.appendChild(items[0].cloneNode(true));

        var i = 0;
        setInterval(function () {
            var h = items[0].offsetHeight;
            if (!h) return;
            i += 1;
            track.style.transform = 'translateY(' + (-i * h) + 'px)';

            if (i === total) {
                setTimeout(function () {
                    track.style.transition = 'none';
                    track.style.transform = 'translateY(0)';
                    i = 0;
                    void track.offsetHeight;
                    setTimeout(function () { track.style.transition = ''; }, 60);
                }, 660);
            }
        }, 2400);
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
    setupSekaiRoll();

    if (window.CppSekai) {
        window.CppSekai.setupReveal();
    }

    fillRelease();
})();
