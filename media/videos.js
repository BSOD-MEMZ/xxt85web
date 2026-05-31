/**
 * xxtsoft 媒体库 — 视频元数据中心
 * 添加新视频只需在此文件中新增一条记录即可
 */
var XSOFT_VIDEOS = [
  {
    id: 1,
    title: "你会在世界终焉吃掉哈基米（あなたは世界の終わりにはちみを食べるのだ）",
    type: "video",
    src: "file/你会在世界终焉吃掉哈基米.mp4",
    poster: "cover/videoCover-你会在世界终焉吃掉哈基米(あなたは世界の終わりにはちみを食べるのだ).30985816140.jpg",
    duration: "02:21",
    author: "@AbCd",
    date: "7/12/25",
    mediaType: "MP4 视频",
    description: "耄耋蜘蛛：BV15s5LzpEyR 像素小马：转换自 ChatGPT 似鸣：棍哥 新人接触调音的第一次尝试，过程中或许有点苛求完美，踩了很多坑，效率也是非常低下，一个星期才出来，只能说相当生涩，毕竟也是第一次，凑合听吧，也希望可以稍微支持一下。",
    downloads: [
      { label: "下载原片（1080P 60Hz）", url: "https://111pan.cn/f/DlJtR/%E4%BD%A0%E4%BC%9A%E5%9C%A8%E4%B8%96%E7%95%8C%E7%BB%88%E7%84%89%E5%90%83%E6%8E%89%E5%93%88%E5%9F%BA%E7%B1%B3.mp4", icon: "assets/downvideo.png" },
      { label: "在哔哩哔哩上观看", url: "https://www.bilibili.com/video/BV1y6u5z9EMZ/", icon: "assets/bilibili.png" }
    ]
  },
  {
    id: 2,
    title: "world.execute(me); 但是全Win32控件",
    type: "video",
    src: "file/World.Execute(Me);  但是全win32控件.mp4",
    poster: "cover/videoCover-world.execute(me);__但是全Win32控件.31014912874.jpg",
    duration: "03:28",
    author: "@xxt8582753",
    date: "7/13/25",
    mediaType: "MP4 视频",
    description: "链接https://www.123912.com/s/LQJuVv-rLcNd 一定要读压缩包里的readme.txt！！！ 时间仓促，做的不是很好，见谅 如果大家喜欢这种类型的下次有空多做点",
    downloads: [
      { label: "下载原片（1080P 60Hz）", url: "https://111pan.cn/f/dxPhj/world.execute%28me%29;%20%20%E4%BD%86%E6%98%AF%E5%85%A8Win32%E6%8E%A7%E4%BB%B6.mp4", icon: "assets/downvideo.png" },
      { label: "在哔哩哔哩上观看", url: "https://www.bilibili.com/video/BV1CAuAznEJS/", icon: "assets/bilibili.png" }
    ]
  },
  {
    id: 3,
    title: "欸，我不是窗口吗？——胭脂，但是Windows",
    type: "video",
    src: "file/胭脂,但是 Windows(欸,我不是窗口吗 ).mp4",
    poster: "cover/enji_but_win.jpg",
    duration: "02:47",
    author: "@AbCd",
    date: "7/23/25",
    mediaType: "MP4 视频",
    description: "本家：BV1ucGzzuEhw @蛋包饭咖喱饭 特别感谢 @BSOD-MEMZ 的灵感和帮助 使用 Python 3.13 + PySide6 制作 耗时一周，花了不少心思，毕竟谁家好人一上来就拿 PyQt 整这玩意 源代码/下载：https://github.com/hxabcd/enji_but_pyqt",
    downloads: [
      { label: "下载原片（1080P 60Hz）（暂无）", url: "", icon: "assets/downvideo.png" },
      { label: "在哔哩哔哩上观看", url: "https://www.bilibili.com/video/BV18R8wzEEgR/", icon: "assets/bilibili.png" }
    ]
  },
  {
    id: 4,
    title: "world.execute(me); 但是Scratch",
    type: "video",
    src: "file/World.Execute(Me); 但是scratch.mp4",
    poster: "cover/world.execute(me)_但是scratch.jpg",
    duration: "01:02",
    author: "@阿巴巴ab3",
    date: "7/30/25",
    mediaType: "MP4 视频",
    description: "并不是完成品，做了一周实在做不下去了发上来看看反响",
    downloads: [],
    downloadNote: "当前没有更高清的版本"
  },
  {
    id: 5,
    title: "Flash测试",
    type: "flash",
    src: "file/test.swf",
    width: 550,
    height: 400,
    duration: "-",
    author: "@xxt8582753",
    date: "9/6/25",
    mediaType: "Flash",
    description: "仅供测试"
  },
  {
    id: 6,
    title: "如何在Win 7以及更高版本上使用NetMeeting 3.0.1",
    type: "flash",
    src: "file/vbar2.swf",
    width: 550,
    height: 400,
    duration: "-",
    author: "@WindowsVistaSP",
    date: "9/6/25",
    mediaType: "Flash",
    description: "这个视频介绍了如何在Win 7以及更高版本上使用NetMeeting 3.0.1，安装包下载链接：http://www.winvistasp.top/download/nm30.exe，补丁包下载链接：http://www.winvistasp.top/download/cracks.zip"
  },
  {
    id: 7,
    title: "maimaiでらっくす × ナンファン ミードー スゴー ちほー - 栄光と夢想（舞萌DX × 株洲市南方中学联动区域 - 光荣与梦想）Lv.15",
    type: "video",
    src: "file/Nfzx.mp4",
    poster: "cover/Nfzx.JPG",
    duration: "01:18",
    author: "@xxt8582753",
    date: "9/7/25",
    mediaType: "MP4 视频",
    description: "纯属虚构，仅供娱乐，视频中的片假名是我直接按读音翻译的，若有错误请指出。其实我觉得中考和解潘盒子或白xx一样，前面的史歌大歌都打完了，结果发现后面还有高中这个15（？",
    downloads: [
      { label: "下载原片（1080P 30Hz）", url: "https://www.123912.com/s/LQJuVv-dweNd", icon: "assets/downvideo.png" }
    ]
  },
  {
    id: 8,
    title: "对蛋仔派对市场颓势以及创作者大会脱离群众的锐评",
    type: "video",
    src: "file/dzpd.mp4",
    poster: "cover/dzpd.jpg",
    duration: "05:30",
    author: "@20年冬",
    date: "9/20/25",
    mediaType: "MP4 视频",
    description: "由于视频是在晚上睡不着时临时起意进行录制，且情绪较为上头，很难保证没有主观性内容，观点仅供参考，顺便在简介里补充一下我个人在视频里未提到的想法，粉丝是蛋仔派对ugc生态里的重要一环，创作者大会邀请制举办无疑是一个重大的脱离群众错误",
    downloads: [
      { label: "下载原片（1080P 30Hz）", url: "https://www.123912.com/s/LQJuVv-1neNd", icon: "assets/downvideo.png" }
    ]
  },
  {
    id: 9,
    title: "竞选全国最烂机况！",
    type: "video",
    src: "file/awmc.mp4",
    poster: "cover/awmc.jpg",
    duration: "05:30",
    author: "@xxt8582753",
    date: "9/30/25",
    mediaType: "MP4 视频",
    description: "majplay这招太狠了。",
    downloads: [
      { label: "下载原片（1080P 30Hz）", url: "https://www.123912.com/s/LQJuVv-1neNd", icon: "assets/downvideo.png" }
    ]
  },
  {
    id: 10,
    title: "Mission Impossible : The Long Dark Basement - 碟中谍9：永夜堡垒",
    type: "video",
    src: "file/imf9.mp4",
    poster: "cover/imf9.jpg",
    duration: "03:49",
    author: "@xxt8582753 @Kingstar @AbCd @Cookie",
    date: "2/9/26",
    mediaType: "MP4 视频",
    description: '<p>注意：这不是官方影片，几个人瞎拍的，仅供娱乐。</p><p>感谢 @AbCd @Cookie 参与录制</p><p><b>前情提要：</b>建议观看 <a href="../articles/webuildnas.html">垃圾佬在学校里开网吧惨遭制裁</a> 和 <a href="../articles/wefuckedsalt.html">我和AbCd白嫖了一台12代i5电脑！</a> 以加深对本片的体会。</p><p>Kingstar（xxt8582753 的同学）常常用班级电脑给他女朋友发消息，这次，他想完成一些"Impossible Mission"：逃离寝室，晚上在我们组 NAS 的办公室远程桌面连接到 207 继续聊天，并连接到 404-2 的高性能电脑上玩游戏。</p><p>我们学校戒备森严，很难从寝室逃出来，并且违纪成本极高，但我们做到了。</p><p></p><p>考虑到视频中日志部分拍摄模糊不易辨认，以下是文字版，并加入一些注释：</p><h2>IMF MISSION II  code: long dark basement</h2><p><strong>任务简述：</strong><br>夜不归寝，在507待一晚，为了和Breeze聊天</p><p><strong>任务流程：</strong></p><ul><li>下午回寝拿毛毯，置点507，同时为晚间潜伏做准备，xxt会拍点照片</li><li>22:00 下晚自习先前往宿舍查寝（Kingstar 是寝室长），在小郭（宿管）处刷脸，此时AbCd将空调启动，引爆教学楼（我们把班级公用电话的铃声换了，那种老人机音量很大，拨打过去可以有效引开查教学楼的保安）</li><li>22:30 随高三人群离开宿舍，在宿舍门口与professional photographer xxt 汇合</li><li>急速进军507，xxt会录像</li><li>到达507，xxt离开，播放《东南苦行山》</li><li>安全时开启电脑，在合适时间入睡</li><li>6:00 提前设好的闹钟启动，俊达萌会叫醒我</li><li>清理现场，撤离，返回教室</li><li>7号中午将毛毯带回寝室，任务完成</li></ul><p><strong>任务目标：</strong></p><ul><li>★★ 与Breeze取得直接联系  √</li><li>★★ 拍摄视频  √</li><li>★ 确保安全  √</li></ul><p><strong>装备清单：</strong></p><p>关于507：毛毯 √ 床 √ 一包纸巾 √ 牙刷、杯子、牙膏 √</p><p>重要：耳机 √ xxt的MP4 √ 活页本 √ 数据线 √ 鼠标 √</p><p>备用：AbCd的手机 □ 胶带 √ 备用电池 √ 国军帽子 □</p><p>上帝保佑我们 </p><p><strong>行动日志：</strong></p><ul><li>2026.2.6 12:35 回寝取毯子、纸巾和洗漱用品</li><li>2026.2.6 13:20 床铺准备完毕</li><li>2026.2.6 13:36 一切就绪，404-2掉线，撤离507</li><li>2026.2.6 13:45 404-2开机，IP地址变为为10.0.4.78</li><li>2026.2.6 22:20 查完寝，但小郭不在，遇见刘JH</li><li>2026.2.6 22:36 与xxt汇合，准备出发！</li><li>2026.2.6 22:42 遭遇恐怖保安，谎称走读逃过一劫</li><li>2026.2.6 22:50 安全入驻507</li><li>2026.2.7 1:32 睡觉</li><li>2026.2.7 3:30 Breeze发来消息</li><li>2026.2.7 5:51 起床，收拾好东西于5:59撤离</li><li>2026.2.7 6:00 未知实体活动于厕所，还开了灯</li><li>2026.2.7 6:40 一切完毕</li><li>2026.2.7 6:48 得知小郭昨夜晚上到处找我</li><li>2026.2.7 10:30 刘JH告诉我昨晚宿管都在找我</li><li>2026.2.7 12:12 于507取得毛毯</li><li>2026.2.7 13:10 找到小郭，跟他说我去刘JH寝了，似乎已安全，下午生物课观察</li><li>2026.2.7 16:34 还有16min放学，SZ（我们班主任）压根没来找我！安稳了 Sound and dandy</li></ul>',
    downloads: [],
    downloadNote: "目前暂无更高清的源文件"
  }
];
