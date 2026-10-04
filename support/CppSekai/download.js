(function () {
    'use strict';

    var ARROW_SVG = '<svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3.4v10.3" /><path d="M5.5 9.4 10 13.9l4.5-4.5" /></svg>';

    // 前四个是第三方加速前缀：统一走「前缀 + 源站完整 URL」，发新版本这里不用动。
    // 最后一个是高校镜像站，走「前缀 + tag + 文件名」；等收录申请通过，把 ready 改成 true 就会自动出现。
    var MIRRORS = [
        { name: 'ghfast.top', note: '社区加速', type: 'prefix', base: 'https://ghfast.top/', ready: true },
        { name: 'gh-proxy.com', note: '社区加速', type: 'prefix', base: 'https://gh-proxy.com/', ready: true },
        { name: 'ghproxy.net', note: '社区加速', type: 'prefix', base: 'https://ghproxy.net/', ready: true },
        { name: 'ghproxy.cc', note: '社区加速', type: 'prefix', base: 'https://ghproxy.cc/', ready: true },
        {
            name: 'mirror.nju.edu.cn', note: '南京大学镜像站', type: 'release',
            base: 'https://mirror.nju.edu.cn/github-release/BSOD-MEMZ/CppSekai/', ready: false
        }
    ];

    function $(id) {
        return document.getElementById(id);
    }

    function set(sel, text) {
        var els = document.querySelectorAll(sel);
        for (var i = 0; i < els.length; i++) els[i].textContent = text;
    }

    var elFacts = document.querySelector('[data-rel-facts]');
    var elPrimary = $('dlPrimary');
    var elPrimarySub = $('dlPrimarySub');
    var elCopy = $('dlCopy');
    var elMirrorList = $('mirrorList');
    var elHashLine = $('hashLine');
    var elHashValue = $('hashValue');
    var elHashCopy = $('hashCopy');

    function mirrorUrl(m, asset, tag) {
        if (m.type === 'release') return m.base + tag + '/' + asset.name;
        return m.base + asset.browser_download_url;
    }

    function renderMirrors(asset, tag) {
        if (!elMirrorList || !asset || !asset.browser_download_url) return;

        elMirrorList.textContent = '';
        var shown = 0;

        MIRRORS.forEach(function (m) {
            if (!m.ready) return;

            var a = document.createElement('a');
            a.className = 'mirror';
            a.href = mirrorUrl(m, asset, tag);
            a.rel = 'noopener';

            var info = document.createElement('span');
            info.className = 'mirror-info';

            var nm = document.createElement('strong');
            nm.textContent = m.name;

            var nt = document.createElement('small');
            nt.textContent = m.note;

            info.appendChild(nm);
            info.appendChild(nt);

            var go = document.createElement('span');
            go.className = 'mirror-go';
            // 箭头也是 SVG，跟 HTML 里那颗保持一致
            go.innerHTML = ARROW_SVG;

            a.appendChild(info);
            a.appendChild(go);
            elMirrorList.appendChild(a);
            shown++;
        });

        if (!shown) {
            var p = document.createElement('p');
            p.className = 'mirror-loading';
            p.textContent = '暂时没有可用的中转线路，直接用上面的按钮从 GitHub 下载吧。';
            elMirrorList.appendChild(p);
        }
    }

    function render(release) {
        if (!release || !window.CppSekai) return false;

        var R = window.CppSekai;
        var tag = release.tag_name || release.name || '';
        var asset = R.pickAsset(release);
        var size = asset && asset.size ? R.fmtSize(asset.size) : '';
        var sourceUrl = asset && asset.browser_download_url
            ? asset.browser_download_url
            : (tag ? R.releasesUrl + '/tag/' + tag : R.releasesUrl);

        set('[data-rel-ver]', tag || '最新版');

        if (elFacts) {
            var facts = [];
            if (R.fmtDate(release.published_at)) facts.push('发布于 ' + R.fmtDate(release.published_at));
            if (asset && asset.name) facts.push(asset.name + (size ? ' · ' + size : ''));
            elFacts.textContent = facts.length ? facts.join(' · ') : '已获取最新发行版信息。';
        }

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
        return true;
    }

    function fail(err) {
        var card = document.querySelector('.ver-card');
        if (card) card.classList.add('is-fallback');

        if (elFacts) {
            elFacts.textContent = err && err.rateLimited
                ? 'GitHub 的接口这会儿对未登录请求限流了（每小时 60 次），过一阵刷新就好。'
                : '没能从 GitHub 取到版本信息（网络不通或接口临时出错）。';
        }
        set('[data-rel-ver]', '见 Releases');
        if (elPrimarySub) elPrimarySub.textContent = 'Windows 7 SP1+ · 免安装 · 去 Releases 页面挑一个';
        if (elPrimary) elPrimary.href = window.CppSekai ? window.CppSekai.releasesUrl : '';

        if (elMirrorList) {
            elMirrorList.textContent = '';
            var p = document.createElement('p');
            p.className = 'mirror-loading';
            p.textContent = '读不到版本信息，中转线路就先不列了 —— 直接去 Releases 页面选一个吧。';
            elMirrorList.appendChild(p);
        }
    }

    function setupCopy() {
        if (elCopy) {
            elCopy.addEventListener('click', function () {
                window.CppSekai.copyText(elCopy.getAttribute('data-url'), elCopy, '已复制');
            });
        }
        if (elHashCopy) {
            elHashCopy.addEventListener('click', function () {
                window.CppSekai.copyText(elHashCopy.getAttribute('data-hash'), elHashCopy, '已复制');
            });
        }
    }

    if (!window.CppSekai) return;

    window.CppSekai.setupReveal();
    setupCopy();

    window.CppSekai.loadRelease(function (err, release) {
        if (err || !release) {
            fail(err);
            return;
        }
        render(release);
    });
})();
