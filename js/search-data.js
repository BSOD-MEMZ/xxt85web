/**
 * xxtsoft 搜索数据库
 * 文章列表从 window.xxtArticleData（定义在 js/index.js 顶部）动态生成
 * 媒体列表从 media/videos.js 的 XSOFT_VIDEOS 动态生成
 * 新增文章只需在 js/index.js 的 xxtArticleData 中添加条目即可
 * 新增视频只需在 media/videos.js 中添加条目即可
 * 程序列表仍需在此手动维护
 */
var xxtSearchData = (function () {
    var articleData = window.xxtArticleData || {};

    // ==================== 从共享数据动态生成文章列表 ====================
    var articleList = [];

    for (var key in articleData) {
        if (!articleData.hasOwnProperty(key)) continue;
        var data = articleData[key];
        if (!data.url) continue;
        // 跳过未发布的文章（日期含"正在编辑"）
        if (data.date && data.date.indexOf('正在编辑') !== -1) continue;

        articleList.push({ title: data.title, url: data.url });
    }

    // ==================== 程序列表（手动维护） ====================
    var programList = [
        { title: "world.excute(me);，但是全Win32控件", url: "https://www.123912.com/s/LQJuVv-rLcNd" },
        { title: "EggyUI 2.0 For Win7（镜像）", url: "https://www.123pan.com/s/LQJuVv-gb7Nd" },
        { title: "EggyUI 2.0 安装程序", url: "https://www.123pan.com/s/LQJuVv-Yu7Nd.html" },
        { title: "EggyUI 1.0 Win11 镜像", url: "https://www.123pan.com/s/LQJuVv-7P7Nd.html" },
        { title: "Fun 2 Rhyme", url: "https://www.123pan.com/s/LQJuVv-pV7Nd" },
        { title: "ACDSaw 1.0", url: "https://www.123pan.com/s/LQJuVv-JfbNd" },
        { title: "我抄你妈（游戏）", url: "https://www.123865.com/s/LQJuVv-TUbNd" },
        { title: "WinDOS", url: "https://www.123pan.com/s/LQJuVv-KquNd" },
        { title: "ED数据结构排序算法模拟软件", url: "https://www.123pan.com/s/LQJuVv-JgbNd" },
        { title: "Longhorn Tools Plus 2.0", url: "https://www.123pan.com/s/LQJuVv-XJKNd.html" },
        { title: "WinUX", url: "https://www.123pan.com/s/LQJuVv-BWSNd" },
        { title: "了不起的PPT", url: "https://www.123pan.com/s/LQJuVv-oAuNd.html" },
        { title: "Untitled（PPT设计）", url: "https://www.123pan.com/s/LQJuVv-RYeNd.html" },
        { title: "Windows Beta Download 3.0（PPT）", url: "https://www.123912.com/s/LQJuVv-mweNd" },
        { title: "Windows Beta Download 2.0（PPT）", url: "https://www.123912.com/s/LQJuVv-1weNd" },
        { title: "win8.1模拟器5.0（PPT）", url: "https://www.123912.com/s/LQJuVv-4weNd" },
        { title: "win8.1模拟器3.0Plus（PPT）", url: "https://www.123912.com/s/LQJuVv-xweNd" },
        { title: "THE 114514 GAME2（PPT）", url: "https://www.123912.com/s/LQJuVv-pweNd" }
    ];

    // ==================== 媒体列表（从 media/videos.js 动态生成） ====================
    var mediaList = [];
    if (typeof XSOFT_VIDEOS !== 'undefined' && XSOFT_VIDEOS) {
        for (var i = 0; i < XSOFT_VIDEOS.length; i++) {
            var v = XSOFT_VIDEOS[i];
            if (v.hidden) continue; // 已删除的视频不进入搜索
            mediaList.push({ title: v.title, url: 'media/player.html?id=' + v.id });
        }
    }

    return {
        article: articleList,
        program: programList,
        media: mediaList
    };
})();
