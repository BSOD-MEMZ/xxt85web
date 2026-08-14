/**
 * xxtsoft 媒体库 — 列表动态渲染
 * 所有视频数据统一维护在 media/videos.js 的 XSOFT_VIDEOS 中
 * 本文件负责把数据渲染到 medias.html（列表 / 统计 / 分类筛选）
 * 添加新视频只需编辑 media/videos.js，无需再改动页面或本文件
 */
(function () {
    var currentTag = 'all';

    // 分类配置（展示用）：tag 值 -> 显示名称和图标
    var TAG_CONFIG = {
        'all':  { name: '全部', icon: 'images/icons/loves.png' },
        '科技': { name: '科技', icon: 'images/icons/tech.png' },
        '游戏': { name: '游戏', icon: 'images/icons/game.png' },
        '生活': { name: '生活', icon: 'images/icons/live.png' },
        '鬼畜': { name: '鬼畜', icon: 'images/icons/about.png' },
        '动画': { name: '动画', icon: 'images/icons/animation.png' },
        '影视': { name: '影视', icon: 'images/icons/movie.png' },
        '知识': { name: '知识', icon: 'images/icons/learn.png' },
        '资讯': { name: '资讯', icon: 'images/icons/articles.png' },
        '其它': { name: '其它', icon: 'images/icons/add.png' }
    };

    function $(id) { return document.getElementById(id); }

    // 侧边栏筛选链接样式
    if (!document.getElementById('xxt-media-stats-css')) {
        var style = document.createElement('style');
        style.id = 'xxt-media-stats-css';
        style.textContent = [
            '#mediaStats a { color: #000; text-decoration: none; display: block; }',
            '#mediaStats a:hover { text-decoration: underline; }',
            '#mediaStats a.active { color: #003399; font-weight: bold; }'
        ].join('\n');
        document.head.appendChild(style);
    }

    // HTML 转义，防止标题等特殊字符破坏结构
    function esc(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // 去掉 HTML 标签得到纯文本（列表里的描述按纯文本展示）
    function plainText(html) {
        var d = document.createElement('div');
        d.innerHTML = html || '';
        return (d.textContent || '').trim();
    }

    // 截断描述文本
    function truncate(str, len) {
        str = (str || '').replace(/\s+/g, ' ').trim();
        if (str.length > len) return str.slice(0, len) + '...';
        return str;
    }

    // 数据中的路径（cover/ file/ assets/）相对 media/ 目录，
    // 渲染到根目录的 medias.html 时补上 media/ 前缀
    function mediaPath(p) {
        p = String(p || '');
        if (p.indexOf('assets/') === 0 || p.indexOf('cover/') === 0 || p.indexOf('file/') === 0) {
            return 'media/' + p;
        }
        return p;
    }

    // 下载图标：数据里存的是 media/assets/xxx.png，根目录页面统一使用 images/icons/xxx.png
    function dlIcon(icon) {
        if (!icon) return 'images/icons/downvideo.png';
        return 'images/icons/' + icon.split('/').pop();
    }

    // 侧边栏统计（分类计数从视频 tags 动态统计，隐藏视频不计入）
    function renderStats(allVideos) {
        var el = $('mediaStats');
        if (!el) return;

        var visible = [];
        for (var i = 0; i < allVideos.length; i++) {
            if (!allVideos[i].hidden) visible.push(allVideos[i]);
        }

        var videoCount = 0;
        var flashCount = 0;
        var tagCount = {};
        for (var k = 0; k < visible.length; k++) {
            if (visible[k].type === 'flash') flashCount++;
            else videoCount++;
            var tags = visible[k].tags || [];
            for (var j = 0; j < tags.length; j++) {
                tagCount[tags[j]] = (tagCount[tags[j]] || 0) + 1;
            }
        }

        var html = '';
        // 全部
        html += '<li><a href="medias.html"' + (currentTag === 'all' ? ' class="active"' : '') + '><img src="images/icons/loves.png" alt="" width="16" height="16" /> 全部（' + visible.length + '）</a></li>';
        // 分类（只显示有内容的分类）
        for (var tag in TAG_CONFIG) {
            if (tag === 'all') continue;
            if (!tagCount[tag]) continue;
            html += '<li><a href="medias.html?tag=' + encodeURIComponent(tag) + '"' + (currentTag === tag ? ' class="active"' : '') + '><img src="' + TAG_CONFIG[tag].icon + '" alt="" width="16" height="16" /> ' + TAG_CONFIG[tag].name + '（' + tagCount[tag] + '）</a></li>';
        }
        html += '<li><br></li>';
        // 媒体类型
        html += '<li><a href="medias.html?type=video"' + (currentTag === 'video' ? ' class="active"' : '') + '><img src="images/icons/downvideo.png" alt="" width="16" height="16" /> 音视频（' + videoCount + '）</a></li>';
        html += '<li><a href="medias.html?type=flash"' + (currentTag === 'flash' ? ' class="active"' : '') + '><img src="images/icons/flash.png" alt="" width="16" height="16" /> Flash（' + flashCount + '）</a></li>';

        el.innerHTML = html;
    }

    // 构建单个视频条目
    function buildItem(video) {
        var isFlash = video.type === 'flash';
        var duration = isFlash ? '--:--' : (video.duration || '--:--');
        var iconClass = isFlash ? 'flash-play-icon' : 'play-icon';

        var html = '';
        html += '<div class="video-item">';
        html += '<a href="media/player.html?id=' + video.id + '">';
        html += '<div class="video-thumb">';
        if (video.poster) {
            html += '<img src="' + mediaPath(video.poster) + '" alt="xxtsoft · ' + esc(video.title) + '" loading="lazy" onerror="this.style.display=\'none\';">';
        }
        html += '<div class="' + iconClass + '"></div>';
        html += '<div class="video-duration">' + esc(duration) + '</div>';
        html += '</div>';
        html += '<div class="video-info">';
        html += '<h3 class="video-title">' + esc(video.title) + '</h3>';
        html += '<div class="video-author">作者：' + esc(video.author || '') + ' 发布时间：' + esc(video.date || '') + ' 类型：' + esc(video.mediaType || '') + '</div>';
        html += '<div class="video-desc">' + esc(truncate(plainText(video.description), 120)) + '</div>';

        // 无原片提示
        if (video.downloadNote) {
            html += '<a><img src="images/icons/downvideo.png" alt="" width="16" height="16" /> <del>' + esc(video.downloadNote) + '</del></a>';
        }
        // 下载链接（url 为空表示暂无，用删除线展示）
        if (video.downloads && video.downloads.length) {
            for (var j = 0; j < video.downloads.length; j++) {
                var d = video.downloads[j];
                if (d.url) {
                    html += '<a href="' + esc(d.url) + '"><img src="' + dlIcon(d.icon) + '" alt="" width="16" height="16" /> ' + esc(d.label) + '</a>';
                } else {
                    html += '<a><img src="' + dlIcon(d.icon) + '" alt="" width="16" height="16" /> <del>' + esc(d.label) + '</del></a>';
                }
            }
        }
        html += '</div>';
        html += '</a>';
        html += '</div>';
        return html;
    }

    // 视频是否匹配当前筛选（隐藏视频一律不展示）
    function matchesFilter(video) {
        if (video.hidden) return false;
        if (currentTag === 'all') return true;
        if (currentTag === 'video') return video.type !== 'flash';
        if (currentTag === 'flash') return video.type === 'flash';
        var tags = video.tags || [];
        return tags.indexOf(currentTag) !== -1;
    }

    // 渲染列表
    function render() {
        var listEl = $('videoList');
        if (!listEl) return;

        var allVideos = (window.XSOFT_VIDEOS || []).slice();
        // 最新的排在最前面（与页面原有顺序一致）
        allVideos.sort(function (a, b) { return b.id - a.id; });

        // 过滤（隐藏视频 + 分类/类型筛选）
        var videos = [];
        for (var i = 0; i < allVideos.length; i++) {
            if (matchesFilter(allVideos[i])) videos.push(allVideos[i]);
        }

        // 统计基于所有未隐藏的视频
        renderStats(allVideos);

        // 所有视频一页全部显示
        var html = '';
        for (var j = 0; j < videos.length; j++) {
            html += buildItem(videos[j]);
        }
        listEl.innerHTML = html;
    }

    // 支持 ?tag=分类 / ?type=video|flash
    var params = new URLSearchParams(window.location.search);
    if (params.get('tag')) currentTag = params.get('tag');
    else if (params.get('type')) currentTag = params.get('type');

    render();
})();
