(function () {
    'use strict';

    var INTRO_KEY = 'cppsekai_intro';

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

        // 动画本身约 4.2s，留一点余量；跳过与自然结束走同一个出口
        setTimeout(finish, 4300);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' || e.keyCode === 27) finish();
        });
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
