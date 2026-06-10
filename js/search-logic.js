/**
 * xxtsoft 搜索逻辑
 * 依赖 js/search-data.js 提供 xxtSearchData
 */
(function () {
    'use strict';

    if (typeof xxtSearchData === 'undefined') return;

    var data = xxtSearchData;

    // DOM refs
    var searchInput = document.getElementById('searchInput');
    var searchButton = document.getElementById('searchButton');
    var articleList = document.getElementById('articleList');
    var programList = document.getElementById('programList');
    var mediaList = document.getElementById('mediaList');
    var catArticle = document.getElementById('catArticle');
    var catProgram = document.getElementById('catProgram');
    var catMedia = document.getElementById('catMedia');
    var noResults = document.getElementById('noResults');
    var resultCount = document.getElementById('resultCount');
    var catBtns = document.querySelectorAll('#categoryFilters .cat-btn');

    var currentCat = 'all';
    var currentTerm = '';

    // ---- URL param ----
    var urlParams = new URLSearchParams(window.location.search);
    var paramS = urlParams.get('s');
    if (paramS) {
        currentTerm = decodeURIComponent(paramS).trim();
        searchInput.value = currentTerm;
    }

    // ---- Category buttons ----
    for (var i = 0; i < catBtns.length; i++) {
        catBtns[i].addEventListener('click', function () {
            for (var j = 0; j < catBtns.length; j++) {
                catBtns[j].classList.remove('active');
            }
            this.classList.add('active');
            currentCat = this.getAttribute('data-cat');
            doSearch();
        });
    }

    // ---- Search trigger ----
    searchButton.addEventListener('click', function () {
        currentTerm = searchInput.value.trim();
        updateUrl();
        doSearch();
    });

    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            currentTerm = searchInput.value.trim();
            updateUrl();
            doSearch();
        }
    });

    function updateUrl() {
        var newUrl = window.location.pathname;
        if (currentTerm) {
            newUrl += '?s=' + encodeURIComponent(currentTerm);
        }
        window.history.replaceState(null, '', newUrl);
    }

    // ---- Search logic ----
    function doSearch() {
        var term = currentTerm.toLowerCase();

        function filterAndHighlight(list, term) {
            if (!term) {
                return list.map(function (item) {
                    return { title: item.title, url: item.url, raw: item.title };
                });
            }
            var filtered = [];
            for (var i = 0; i < list.length; i++) {
                if (list[i].title.toLowerCase().indexOf(term) !== -1) {
                    var regex = new RegExp(escapeRegex(term), 'gi');
                    var highlighted = list[i].title.replace(regex, function (match) {
                        return '<span class="highlight">' + match + '</span>';
                    });
                    filtered.push({ title: highlighted, url: list[i].url, raw: list[i].title });
                }
            }
            return filtered;
        }

        function escapeRegex(str) {
            return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        var arts = (currentCat === 'all' || currentCat === 'article')
            ? filterAndHighlight(data.article, term) : [];
        var progs = (currentCat === 'all' || currentCat === 'program')
            ? filterAndHighlight(data.program, term) : [];
        var meds = (currentCat === 'all' || currentCat === 'media')
            ? filterAndHighlight(data.media, term) : [];

        renderList(articleList, arts);
        renderList(programList, progs);
        renderList(mediaList, meds);

        catArticle.style.display =
            (currentCat === 'all' || currentCat === 'article') ? '' : 'none';
        catProgram.style.display =
            (currentCat === 'all' || currentCat === 'program') ? '' : 'none';
        catMedia.style.display =
            (currentCat === 'all' || currentCat === 'media') ? '' : 'none';

        var total = arts.length + progs.length + meds.length;
        noResults.style.display = (total === 0 && term) ? '' : 'none';

        if (term) {
            resultCount.innerHTML = '找到 <b>' + total + '</b> 条结果';
        } else {
            resultCount.innerHTML = '共 <b>' +
                (data.article.length + data.program.length + data.media.length) +
                '</b> 条内容，输入关键词开始搜索';
        }
    }

    function renderList(container, items) {
        container.innerHTML = '';
        for (var i = 0; i < items.length; i++) {
            var li = document.createElement('li');
            var isExternal = items[i].url.indexOf('http') === 0;
            li.innerHTML =
                '<a href="' + items[i].url + '"' +
                (isExternal ? ' target="_blank" rel="noopener"' : '') + '>' +
                items[i].title +
                (isExternal
                    ? ' <img src="images/icons/start.png" alt="" width="14" height="14" style="vertical-align:middle;">'
                    : '') +
                '</a>';
            container.appendChild(li);
        }
    }

    // ---- Inject button styles (Vista classic style) ----
    var style = document.createElement('style');
    style.textContent = [
        '#categoryFilters { display: flex; flex-wrap: wrap; gap: 4px; }',
        '.cat-btn {',
        '  padding: 1px 12px;',
        '  font-size: 12px;',
        '  font-family: "Segoe UI","Microsoft YaHei UI",sans-serif;',
        '  background: linear-gradient(to bottom, #fefefe 0%, #E5EAF5 30%, #D4DBED 31%, #E1E6F6 100%);',
        '  border: 1px solid #8b8b8b;',
        '  border-radius: 3px;',
        '  color: #000;',
        '  cursor: pointer;',
        '}',
        '.cat-btn:hover { background: #a7a7a7; }',
        '.cat-btn.active {',
        '  background: linear-gradient(to bottom, #4A77A9 0%, #225E9E 50%, #164686 51%, #2F7AB3 100%);',
        '  border-color: #99B1CE;',
        '  color: #FFFFFF;',
        '}',
        '.cat-btn img { vertical-align: middle; margin-right: 3px; }',
        '.result-category h3 { margin-top: 16px; }',
        '.result-category h3 img { vertical-align: middle; margin-right: 4px; }'
    ].join('\n');
    document.head.appendChild(style);

    // ---- Init ----
    doSearch();
})();
