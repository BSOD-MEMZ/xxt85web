/**
 * xxtsoft 首页脚本
 * 包含：设置面板、背景切换、文章预览、留言本等
 */
(function () {
  'use strict';

  // ==================== 设置对话框 ====================
  function initSettings() {
    var dialog = document.getElementById('settingsDialog');
    var overlay = document.getElementById('dialogOverlay');
    var openBtn = document.getElementById('openSettings');
    var closeBtn = document.getElementById('closeSettings');
    var saveBtn = document.getElementById('saveSettings');
    var clearBtn = document.getElementById('clearCookies');
    var umamiToggle = document.getElementById('umamiToggle');
    var previewToggle = document.getElementById('previewToggle');
    var live2dToggle = document.getElementById('live2dToggle');
    var filterDisturbingToggle = document.getElementById('filterDisturbingToggle');

    if (!dialog || !openBtn) return;

    function loadSettings() {
      var umamiEnabled = localStorage.getItem('umami_enabled') !== "false";
      var previewEnabled = localStorage.getItem('preview_enabled') !== "false";
      var live2dEnabled = localStorage.getItem('live2d_enabled') !== "false";
      var filterEnabled = localStorage.getItem('filter_disturbing') === "true";
      if (umamiToggle) umamiToggle.checked = umamiEnabled;
      if (previewToggle) previewToggle.checked = previewEnabled;
      if (live2dToggle) live2dToggle.checked = live2dEnabled;
      if (filterDisturbingToggle) filterDisturbingToggle.checked = filterEnabled;
    }

    function hideDialog() {
      dialog.style.display = 'none';
      if (overlay) overlay.style.display = 'none';
    }

    openBtn.addEventListener('click', function (e) {
      e.preventDefault();
      loadSettings();
      dialog.style.display = 'block';
      if (overlay) overlay.style.display = 'block';
    });

    if (closeBtn) closeBtn.addEventListener('click', hideDialog);
    if (overlay) overlay.addEventListener('click', hideDialog);

    // 清除 Cookie / localStorage
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (confirm('确定要清除本站所有本地数据吗？这将重置背景、设置偏好等，并刷新页面。')) {
          localStorage.clear();
          location.reload();
        }
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        if (umamiToggle) {
          localStorage.setItem('umami_enabled', umamiToggle.checked);
        }
        if (previewToggle) {
          localStorage.setItem('preview_enabled', previewToggle.checked);
        }
        if (live2dToggle) {
          localStorage.setItem('live2d_enabled', live2dToggle.checked);
        }
        if (filterDisturbingToggle) {
          localStorage.setItem('filter_disturbing', filterDisturbingToggle.checked);
        }
        hideDialog();
      });
    }

    loadSettings();
  }

  // ==================== 背景切换 ====================
  function initBackground() {
    var backgrounds = [
      'background.webp',
      'background/background_1.webp',
      'background/background_2.webp',
      'background/background_3.webp',
      'background/background_4.webp'
    ];

    var currentBgIndex = localStorage.getItem('bgIndex');
    currentBgIndex = currentBgIndex !== null ? parseInt(currentBgIndex) : 0;

    window.applyBackground = function (index) {
      document.body.style.backgroundImage = "url('" + backgrounds[index] + "')";
    };

    applyBackground(currentBgIndex);

    var changeBtn = document.getElementById('changeBackground');
    if (changeBtn) {
      changeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        currentBgIndex = (currentBgIndex + 1) % backgrounds.length;
        applyBackground(currentBgIndex);
        localStorage.setItem('bgIndex', currentBgIndex);
      });
    }
  }

  // ==================== Banner 关闭按钮 ====================
  var siteBanner = document.getElementById('siteBanner');
  var closeBannerBtn = document.getElementById('closeBanner');
  if (siteBanner && closeBannerBtn) {
    if (localStorage.getItem('banner_closed') === 'true') {
      siteBanner.style.display = 'none';
    }
    closeBannerBtn.addEventListener('click', function () {
      siteBanner.style.display = 'none';
      localStorage.setItem('banner_closed', 'true');
    });
  }

  // ==================== 留言本选择对话框 ====================
  var guestbookDialog = document.getElementById('guestbookDialog');
  var guestbookOverlay = document.getElementById('dialogOverlay');
  var closeGuestbookBtn = document.getElementById('closeGuestbookDialog');

  window.showGuestbookDialog = function () {
    guestbookDialog.style.display = 'block';
    guestbookOverlay.style.display = 'block';
  };

  function hideGuestbookDialog() {
    guestbookDialog.style.display = 'none';
    guestbookOverlay.style.display = 'none';
  }

  window.goGiscus = function () {
    window.location.href = "guestbook.html";
  };

  window.goSmartGB = function () {
    alert("本留言本非xxtsoft提供，点击确定后将跳转到第三方留言本。请注意文明发言，勿相信任何广告!");
    window.location.href = "http://users3.smartgb.com/g/g.php?a=s&i=g36-39291-be";
  };

  if (closeGuestbookBtn) closeGuestbookBtn.addEventListener('click', hideGuestbookDialog);
  if (guestbookOverlay) {
    guestbookOverlay.addEventListener('click', function(e) {
      // 只在使用留言本对话框时关闭
      if (guestbookDialog.style.display === 'block') {
        hideGuestbookDialog();
      }
    });
  }

  // ==================== 看板娘动态加载 ====================
  function initLive2D() {
    var enabled = localStorage.getItem('live2d_enabled') !== "false";
    if (!enabled) return;

    // 动态创建 script 标签加载看板娘
    var script = document.createElement('script');
    script.src = 'https://xxtsoft.top/live2d-widget/dist/autoload.js';
    script.async = true;
    document.head.appendChild(script);
  }

  function initWidget() {
    var KEY = "hide_newsite_widget";
    if (localStorage.getItem(KEY) === "1") return;

    var widget = document.getElementById("newsite-widget");
    if (!widget) return;

    widget.style.display = "block";

    var checkbox = document.getElementById("hideNewSiteWidget");
    if (checkbox) {
      checkbox.addEventListener("change", function () {
        if (this.checked) {
          localStorage.setItem(KEY, "1");
          widget.style.display = "none";
        }
      });
    }
  }

  // ==================== 新站挂件 ====================
  function initArticlePreviews() {
    var previewEnabled = localStorage.getItem('preview_enabled') !== "false";
    var filterEnabled = localStorage.getItem('filter_disturbing') === "true";
    var articleData = {
      "vibelikehuman.html": {
        title: "如何让AI写的程序看起来不像AI写的",
        author: "xxt8582753",
        desc: "AI编程已经成为趋势，但很多人抗拒AI生成的应用。本文将分享一些实用技巧，帮助你让AI生成的程序更像人类开发的，提升用户接受度。",
      },
      "competition.html": {
        title: "我！们！进！省！赛！啦！",
        author: "xxt8582753",
        desc: "在经历了层层选拔之后，我们终于成功进入了省赛！你知道为什么我要用“我们”一词吗？",
        img: ""
      },
      "superfactory.html": {
        title: "SuperFactory 格式转换器 开放测试！",
        author: "xxt8582753",
        desc: "SuperFactory 是一个万能的格式转换器，无论是媒体转换还是文档处理都能轻松应对，还具有下载视频，文件修复等功能。而我开发 SuperFactory 的初衷仅仅是觉得现有工具都不好用，或者都要钱。",
        img: "images/previews/superfactory.jpg"
      },
      "4thanniversary.html": {
        title: "🎉 xxtsoft 四周年纪念",
        author: "xxt8582753",
        desc: "四载春秋，感谢一路有你！回顾我们在这四年里经历的点点滴滴，展望未来的无限可能。<br>一定要用最新版浏览器访问哦！",
        img: ""
      },
      "scrcpy.html": {
        title: "用Scrcpy巧救误启动模拟辅助显示设备的安卓设备",
        author: "xxt8582753",
        desc: "误触安卓模拟辅助显示设备选项，可以使用Scrcpy OTG模式+ADB修复",
        img: "images/previews/fuckoverlay.jpg"
      },
      "robberofnfzx.html": {
        title: "南方中学的居民和强盗",
        author: "xxt8582753",
        desc: "有一天，几个来自年级组的强盗闯进了班级。一个强盗洗劫手机，另一个强盗在搜MP4。似乎得胜之后，便可以动手行窃了。他们对班级进行了大规模的劫掠，赃物由几个胜利者均分...",
        img: "",
        disturbing: true
      },
      "boring.html": {
        title: "无聊时可以干什么",
        author: "xxt8582753",
        desc: "最近上晚自习时我同桌总跟我抱怨写完作业后没事干好无聊，那我们可以干什么呢？<br>另外，我正在尝试一种新的写作风格，希望大家给我点建议。",
        img: ""
      },
      "nanfangfm.html": {
        title: "提前开学脸都给你丢光！学校里的“黑广播”",
        author: "xxt8582753",
        desc: "提前开学的乐子学校理应得到制裁！",
        img: "images/previews/vncto404.jpg",
        disturbing: true
      },
      "qqlistener.html": {
        title: "QQListener 的技术实现",
        author: "xxt8582753",
        desc: "深入探讨 QQ 消息监听的底层原理与 Python 实现细节。",
        img: "images/previews/qqlistener.png"
      },
      "efluentwidget.html": {
        title: "一种基于 Electron 的 WinUI3 实现方式（？",
        author: "xxt8582753",
        desc: "尝试用 Web 技术复刻 Windows 11 质感的 UI 界面",
        img: "images/previews/efluentgallery.png"
      },
      "ninjawasp.html": {
        title: "仁者无敌 - The True Power Behind Invincibility",
        author: "Kingstar",
        desc: "仁者无敌的真正力量在于通过仁爱与共识激发合作，使领导者和追随者朝向共同目标前进，从而战胜一切挑战。",
        img: ""
      },
      "webuildnas.html": {
        title: "垃圾佬在学校里开网吧惨遭制裁",
        author: "xxt8582753",
        desc: "我们在学校里找到一些垃圾配件，居然组了一台NAS？感谢南方中学通用技术老师舒老师",
        img: "images/previews/nasin507.jpg",
        disturbing: true
      },
      "eyes.html": {
        title: "眼睛",
        author: "Cookie",
        desc: "据说是xxt8582753的一个同学失恋时写的",
        img: ""
      },
      "entp.html": {
        title: "EasiNote Theme Patcher - 希沃白板课堂活动资源替换器",
        author: "xxt8582753",
        desc: "希沃白板太单调？来试试给它换个皮肤，让课堂活动更有趣。",
        img: "images/previews/entp.png"
      },
      "fucknfzx.html": {
        title: "校园电子产品生存指南",
        author: "xxt8582753",
        desc: "学校不让带电子产品？没关系，这份指南教你如何在校园里安全使用各种电子设备，避免被没收！",
        img: "images/previews/fucknfzx.jpg",
        disturbing: true
      },
      "wefuckedsalt.html": {
        title: "我和AbCd白嫖了一台 12 代 i5 电脑！",
        author: "xxt8582753",
        desc: "我们开发者很缺算力，学校机房拉完了，但学校里有一台12代英特尔希沃竟然闲置着！于是我们就RDP上去白嫖了它。",
        img: "images/previews/wefcukedsalt.jpg",
        disturbing: true
      },
      "748-exitboard-fang-xue-dao-ji-shi": {
        title: "【外链】ExitBoard 放学倒计时",
        author: "xxt8582753",
        desc: "每一秒的流逝都是为了迎接最后的自由。吸附在任务栏上的放学倒计时程序，放学全屏提醒效果",
        img: "images/previews/exitboard.png"
      },
      "740-360tuo-tang-wei-shi": {
        title: "【外链】360 拖堂卫士 - 守护珍贵的课间十分钟！",
        author: "xxt8582753",
        desc: "针对某些喜欢拖堂的老师开发的工具，你敢拖堂就强制查杀希沃白板/PPT等软件！",
        img: "images/previews/360classguard.jpg"
      },
      "20251005.html": {
        title: "SKToolBox - 打包自己的单文件工具箱",
        author: "SK",
        desc: "SKToolBox 相关内容",
        img: "images/previews/sktb.jpg"
      },
      "athomevideofucker.html": {
        title: "《 掌 上 看 冢 采 集 端 》",
        author: "xxt8582753",
        desc: "老师喜欢用《掌上看家采集端》这个程序监控我们。做个假的骗骗Ta？",
        img: "images/previews/athomevideofucker.JPG"
      },
      "win10remaster.html": {
        title: "Win10 优化宗师",
        author: "xxt8582753",
        desc: "自制工具让Win10更好用",
        img: ""
      },
      "fuckjunxun.html": {
        title: "强烈建议取消军训",
        author: "xxt8582753",
        desc: "个人感言，关于军训形式与实际意义的吐槽与思考。",
        img: "",
      },
      "fuckbihuo.html": {
        title: "千万不要用必火推广！",
        author: "xxt8582753",
        desc: "B站你妈死了",
        img: "images/previews/bihuo.jpg",
      },
      "playmaimaiwithabcd.html": {
        title: "记与AbCd夜拼机",
        author: "xxt8582753",
        desc: "音游人的快乐就是这么简单。和好哥们去机厅拼机、刷分的日常。",
        img: ""
      },
      "openduolingo.html": {
        title: "自学两周 PyQt6，做出来的日语假名学习程序—— OpenDuolingo",
        author: "xxt8582753",
        desc: "边学边练，用 Python 写了一个练习日语假名的小工具",
        img: ""
      },
      "enji_but_pyqt": {
        title: "【外链】欸，我不是窗口吗？——胭脂，但是 Windows",
        author: "AbCd",
        desc: "一个使用PySide6仿照《胭脂》PV制作的窗口动画程序",
        img: "images/previews/enji.jpg"
      },
      "winres.html": {
        title: "【保姆级教程】提取 Windows 中的资源素材",
        author: "xxt8582753",
        desc: "教你如何从系统 DLL 或 EXE 中挖掘那些漂亮的图标和素材。",
        img: "images/previews/winres.jpg"
      },
      "textract.html": {
        title: "【保姆级教程】用 Python textract 库读取 Word、Excel、PPT",
        author: "xxt8582753",
        desc: "告别繁琐的 Office 套件，直接用 Python 高效提取文档中的文本内容。",
        img: "images/previews/python_office.jpg"
      },
      "explorerkiller.html": {
        title: "Explorer 控制工具——ExplorerKiller",
        author: "xxt8582753",
        desc: "当资源管理器卡死时，这个工具就是你的救命稻草。",
        img: "images/previews/killer.jpg"
      },
      "saltai.html": {
        title: "谁能拒绝一只可爱的纱露朵住进自己电脑呢？Python+DeepSeek API 开发实战演练！",
        author: "xxt8582753",
        desc: "ソルト最可爱了嘿嘿嘿",
        img: "images/previews/ai.jpg"
      },
      "fuckgit.html": {
        title: "git 缓存清不掉，试试再建一个文件夹",
        author: "xxt8582753",
        desc: "Git简单粗暴的解决那些清理不掉的缓存难题。",
        img: "images/previews/git.jpg",
      },
      "pass.html": {
        title: "无题",
        author: "xxt8582753",
        desc: "",
        img: "images/previews/none.jpg"
      },
      "an_old_music_game.html": {
        title: "很久以前的自制音游，十分甚至九分难绷",
        author: "xxt8582753",
        desc: "回顾以前易语言写的逆天代码和令人绝望的判定机制。",
        img: "images/previews/old_game.jpg"
      },
      "reviewsomething.html": {
        title: "回忆往事",
        author: "xxt8582753",
        desc: "人老了（15岁）总喜欢回忆，看看过去做过的那些事儿。",
        img: "images/previews/review.jpg"
      },
      "fuck11.html": {
        title: "Windows 11, **都不用",
        author: "AbCd",
        desc: "关于 Win11 各种 Bug 的愤怒吐槽。",
        img: "",
      },
      "aeronopeak.html": {
        title: "Aero 的巅峰 —— Longhorn 4074",
        author: "xxt8582753",
        desc: "关于 Longhorn 4074 的介绍和评价。",
        img: ""
      },
      "upload.html": {
        title: "投稿指南",
        author: "xxt8582753",
        desc: "想让你的文章出现在本站？快来看看具体的投稿流程吧。",
        img: ""
      },
      "test.html": {
        title: "测试文章",
        author: "xxt8582753",
        desc: "这是一个单纯的测试，用来看看样式有没有崩坏。",
        img: ""
      },
      "ACDSaw.html": {
        title: "ACDSaw",
        author: "xxt8582753",
        desc: "自制一个适用于Windows98的图片查看器",
        img: "images/old_archive.png"
      },
      "fuckyourmother.html": {
        title: "我 抄 你 妈",
        author: "xxt8582753",
        desc: "老师总是罚我们抄写，这毫无意义。于是我做了一个小游戏，你的任务是尽可能多地抄写各个老师布置的罚抄任务，通过购买道具提升抄写速度",
        img: "images/old_archive.png",
      },
      "Fun_2_Rhyme.html": {
        title: "Fun Rhyme 2",
        author: "xxt8582753",
        desc: "提升您的英语词汇量和拼写能力。程序会给出4个不完整的单词，尝试补全它们",
        img: "images/old_archive.png"
      },
      "homobomb.html": {
        title: "沼气弹引爆器",
        author: "xxt8582753",
        desc: "远程连接到班级电脑，然后使用本程序播放恶臭的音效。",
        img: "images/old_archive.png",
      },
      "how-to-use-img-in-vmware-or-limbo.html": {
        title: "如何在VMware和Limbo上使用img软盘镜像",
        author: "xxt8582753",
        desc: "实用技术教程存档。讲解了在虚拟机环境挂载 img 软盘镜像的操作步骤。",
        img: "images/old_archive.png"
      },
      "lian-xiang-dian-nao-chu-xian-error1962-no-operating-system-found.ye-xu-bu-shi-cao-zuo-xi-tong-de-wen-ti.html": {
        title: "电脑出现error1962 no operating system found的解决方案",
        author: "xxt8582753",
        desc: "联想电脑常见的启动故障排查，也许不是系统问题，而是 BIOS 和 UEFI 引导设置的问题。",
        img: "images/old_archive.png"
      },
      "Longhorn_Tool.html": {
        title: "Longhorn Tool",
        author: "xxt8582753",
        desc: "针对经典的 Windows Longhorn 系统开发的实用工具相关介绍。",
        img: "images/old_archive.png"
      },
      "Microsoft_Agent_Character_Editor_完美汉化版.html": {
        title: "Microsoft Agent Character Editor 完美汉化版",
        author: "xxt8582753",
        desc: "就是那个经典的 Office 小助手编辑器！当年的汉化作品",
        img: "images/old_archive.png"
      },
      "OIerHelper.html": {
        title: "OIerHelper",
        author: "xxt8582753",
        desc: "为信息学竞赛选手（OIer）准备的辅助工具，不受干扰地上洛谷看题，基于 IE 内核。",
        img: "images/old_archive.png"
      },
      "Rectify8.1_project.html": {
        title: "Rectify8.1项目",
        author: "xxt8582753",
        desc: "改造 Windows 8.1 视觉体验的项目记录，让Win8.1具有Win11的Fluent样式",
        img: "images/old_archive.png"
      },
      "Win 8 Beta Build 8014 汉化包发布.html": {
        title: "Win 8 Beta Build 8014 汉化包发布",
        author: "xxt8582753",
        desc: "早期 Windows 8 测试版的汉化成果展示",
        img: "images/old_archive.png"
      },
      "Win8 beta 8155 汉化包.html": {
        title: "Win 8 Beta Build 8155 汉化包发布",
        author: "xxt8582753",
        desc: "另一个 Windows 8 测试版本的汉化补丁发布记录。",
        img: "images/old_archive.png"
      }
    };

    var links = document.querySelectorAll('.mainarticles ul li a');
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      var href = link.getAttribute('href');
      if (!href) continue;
      var pureName = href.split('/').pop().replace('.html', '');
      var fileNameWithHtml = pureName + ".html";
      var data = articleData[fileNameWithHtml] || articleData[pureName];
      if (!data) continue;

      // 过滤令人不安的内容：隐藏整行
      if (filterEnabled && data.disturbing) {
        var parentLi = link.parentNode;
        if (parentLi && parentLi.tagName === 'LI') {
          parentLi.style.display = 'none';
        }
        continue;
      }

      // 预览功能未启用则跳过
      if (!previewEnabled) continue;

      var previewBox = document.createElement('div');
      previewBox.className = 'preview-box';

      var imgTag = '';
      if (data.img && data.img !== "") {
        imgTag = '<img alt="" src="' + data.img + '" loading="lazy" onerror="this.style.display=\'none\';">';
      }
      var descTag = data.desc ? '<p>' + data.desc + '</p>' : '';
      var actionsHtml = '<div class="preview-actions" onclick="event.preventDefault(); event.stopPropagation(); return false;">' +
        '<div class="preview-link" onclick="window.location.href=\'' + href + '\'">' +
        '<img alt="" src="images/icons/start2.png">阅读全文' +
        '</div>' +
        '<div class="preview-link" onclick="xxtCopyToClipboard(\'' + href + '\')">' +
        '<img alt="" src="images/icons/copy.png">复制链接' +
        '</div>' +
        '<div class="preview-link" onclick="window.location.href=\'mailto:xxt8582753@126.com?subject=关于文章 ' + data.title + ' 的反馈\'">' +
        '<img alt="" src="images/icons/mail.png">发送反馈' +
        '</div>' +
        '</div>';
      previewBox.innerHTML = imgTag +
        '<div class="preview-info">' +
        '<strong>' + data.title + '</strong>' +
        '<span>作者：' + data.author + '</span>' +
        descTag +
        '</div>' + actionsHtml;

      link.style.position = 'relative';
      link.appendChild(previewBox);
    }
  }

  // 复制到剪贴板
  window.xxtCopyToClipboard = function (text) {
    var fullUrl = window.location.origin + '/' + text;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullUrl).catch(function () {
        fallbackCopy(fullUrl);
      });
    } else {
      fallbackCopy(fullUrl);
    }
  };

  function fallbackCopy(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      alert('复制失败，请手动复制：' + text);
    }
    document.body.removeChild(textArea);
  }

  // ==================== 看板娘搜索拦截 ====================
  function initWaifuSearch() {
    var observer = new MutationObserver(function (mutations) {
      var btn = document.getElementById('waifu-tool-search');
      if (btn && !btn.getAttribute('data-search-hooked')) {
        btn.setAttribute('data-search-hooked', '1');
        // 移除旧事件（克隆节点）
        var newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          var tips = document.getElementById('waifu-tips');
          if (!tips) return;
          tips.innerHTML = '<div class="waifu-search-box" style="padding:10px 8px;display:flex;align-items:center;gap:4px;">' +
            '<input type="text" id="waifuSearchInput" placeholder="搜点什么..." style="' +
            'flex:1;padding:5px 8px;border:1px solid #7da2ce;border-radius:2px;' +
            'font-size:13px;font-family:inherit;background:#fff;color:#000;min-width:0;" />' +
            '<button id="waifuSearchGo" style="' +
            'padding:5px 14px;background:linear-gradient(to bottom,#fefefe 0%,#E5EAF5 30%,#D4DBED 31%,#E1E6F6 100%);' +
            'color:#000;border:1px solid #8b8b8b;border-radius:2px;' +
            'cursor:pointer;font-size:12px;font-family:inherit;white-space:nowrap;">' +
            '搜索</button></div>';
          tips.classList.add('waifu-tips-active');
          var input = document.getElementById('waifuSearchInput');
          if (input) {
            input.focus();
            input.addEventListener('keypress', function (ev) {
              if (ev.key === 'Enter') goWaifuSearch();
            });
          }
          var goBtn = document.getElementById('waifuSearchGo');
          if (goBtn) {
            goBtn.addEventListener('click', function (ev) {
              ev.stopPropagation();
              goWaifuSearch();
            });
          }
          function goWaifuSearch() {
            var term = (document.getElementById('waifuSearchInput') || {}).value || '';
            term = term.trim();
            if (term) {
              window.location.href = 'search.html?s=' + encodeURIComponent(term);
            } else {
              tips.classList.remove('waifu-tips-active');
            }
          }
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ==================== 个性化面板 ====================
  function initCustomize() {
    var panel = document.getElementById('customizePanel');
    var openBtn = document.getElementById('openCustomize');
    var sidebar = document.getElementById('sidebarContainer');

    if (!panel || !openBtn) return;

    // 主题列表
    var themes = ['style.css', 'xpstyle.css'];

    // 保存打开时的初始状态，用于"取消"恢复
    var savedWindowStates = {};

    function saveCurrentState() {
      if (!sidebar) return;
      var wins = sidebar.querySelectorAll('.window');
      savedWindowStates = {};
      for (var i = 0; i < wins.length; i++) {
        var id = wins[i].getAttribute('data-sidebar-id') || ('_idx_' + i);
        savedWindowStates[id] = wins[i].classList.contains('window-hidden');
      }
    }

    function restoreSavedState() {
      if (!sidebar) return;
      var wins = sidebar.querySelectorAll('.window');
      for (var i = 0; i < wins.length; i++) {
        var id = wins[i].getAttribute('data-sidebar-id') || ('_idx_' + i);
        if (savedWindowStates.hasOwnProperty(id)) {
          if (savedWindowStates[id]) {
            wins[i].classList.add('window-hidden');
          } else {
            wins[i].classList.remove('window-hidden');
          }
        }
      }
    }

    function resetToDefault() {
      if (!sidebar) return;
      var defaultOrder = ['function', 'news', 'contact', 'progress', 'wmp'];
      for (var i = 0; i < defaultOrder.length; i++) {
        var win = sidebar.querySelector('.window[data-sidebar-id="' + defaultOrder[i] + '"]');
        if (win) {
          win.classList.remove('window-hidden');
          sidebar.appendChild(win);
        }
      }
    }

    // 更新组件图标的灰色状态
    function updateGrayedIcons() {
      var items = panel.querySelectorAll('.customize-icon-item[data-sidebar-id]');
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var sidebarId = item.getAttribute('data-sidebar-id');
        // "功能"永远置灰
        if (sidebarId === 'function') {
          item.classList.add('grayed');
          continue;
        }
        var win = sidebar ? sidebar.querySelector('.window[data-sidebar-id="' + sidebarId + '"]') : null;
        if (win && !win.classList.contains('window-hidden')) {
          item.classList.add('grayed');
        } else {
          item.classList.remove('grayed');
        }
      }
    }

    // 打开个性化模式
    function openPanel() {
      saveCurrentState();
      updateGrayedIcons();
      panel.style.display = 'block';
      document.body.classList.add('customizing');
    }

    // 关闭个性化面板
    function closePanel() {
      // === 着陆动画：冻结当前位置再过渡回原点 ===
      var allWins = document.querySelectorAll('.main .window, .sidebar .window');
      for (var i = 0; i < allWins.length; i++) {
        (function (w) {
          if (w.classList.contains('window-hidden')) return;
          var computed = getComputedStyle(w).transform;
          if (computed && computed !== 'none' && computed !== 'matrix(1, 0, 0, 1, 0, 0)') {
            // 冻结当前动画位置
            w.style.animation = 'none';
            w.style.transition = 'none';
            w.style.transform = computed;
            // 用 RAF 确保冻结生效后再启动着陆
            requestAnimationFrame(function () {
              requestAnimationFrame(function () {
                w.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)';
                w.style.transform = 'translate(0, 0)';
              });
            });
          }
        })(allWins[i]);
      }
      // 过渡结束后清理 inline 样式
      setTimeout(function () {
        for (var j = 0; j < allWins.length; j++) {
          allWins[j].style.transition = '';
          allWins[j].style.transform = '';
          allWins[j].style.animation = '';
        }
      }, 700);

      panel.style.display = 'none';
      document.body.classList.remove('customizing');
      // 清除所有拖拽状态
      if (sidebar) {
        var wins = sidebar.querySelectorAll('.window');
        for (var k = 0; k < wins.length; k++) {
          wins[k].classList.remove('dragging', 'drag-over');
        }
      }
    }

    // 切换背景
    function cycleBackground() {
      var backgrounds = [
        'background.webp',
        'background/background_1.webp',
        'background/background_2.webp',
        'background/background_3.webp',
        'background/background_4.webp'
      ];
      var currentBgIndex = localStorage.getItem('bgIndex');
      currentBgIndex = currentBgIndex !== null ? parseInt(currentBgIndex) : 0;
      currentBgIndex = (currentBgIndex + 1) % backgrounds.length;
      document.body.style.backgroundImage = "url('" + backgrounds[currentBgIndex] + "')";
      localStorage.setItem('bgIndex', currentBgIndex);
    }

    // 切换主题
    function cycleTheme() {
      var currentTheme = localStorage.getItem('theme') || 'style.css';
      var idx = themes.indexOf(currentTheme);
      if (idx === -1) idx = 0;
      idx = (idx + 1) % themes.length;
      var newTheme = themes[idx];
      localStorage.setItem('theme', newTheme);
      var themeLink = document.getElementById('themeCss');
      if (themeLink) themeLink.href = newTheme;
    }

    // 切换侧边栏组件
    function toggleSidebarWindow(sidebarId, item) {
      if (!sidebarId || !sidebar) return;
      // "功能"不可切换
      if (sidebarId === 'function') return;
      var win = sidebar.querySelector('.window[data-sidebar-id="' + sidebarId + '"]');
      if (!win) return;

      if (win.classList.contains('window-hidden')) {
        win.classList.remove('window-hidden');
        item.classList.add('grayed');
      } else {
        win.classList.add('window-hidden');
        item.classList.remove('grayed');
      }
    }

    // 打开/关闭按钮
    openBtn.addEventListener('click', function (e) {
      e.preventDefault();

      // 移动端不允许
      if (window.innerWidth <= 1000) {
        alert('手机不能更改视图');
        return;
      }

      if (panel.style.display === 'block') {
        closePanel();
        return;
      }

      openPanel();
    });

    // 图标点击处理
    panel.addEventListener('click', function (e) {
      var item = e.target.closest('.customize-icon-item');
      if (!item) return;
      var action = item.getAttribute('data-action');

      if (action === 'background') {
        cycleBackground();
        return;
      }

      if (action === 'theme') {
        cycleTheme();
        return;
      }

      if (action && action.indexOf('toggle-') === 0) {
        var sidebarId = item.getAttribute('data-sidebar-id');
        toggleSidebarWindow(sidebarId, item);
        return;
      }
    });

    // 确定按钮
    var okBtn = document.getElementById('customizeOK');
    if (okBtn) {
      okBtn.addEventListener('click', function () {
        closePanel();
      });
    }

    // 取消按钮 - 恢复初始状态
    var cancelBtn = document.getElementById('customizeCancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        restoreSavedState();
        closePanel();
      });
    }

    // 恢复默认按钮
    var resetBtn = document.getElementById('customizeReset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        resetToDefault();
        updateGrayedIcons();
      });
    }
  }

  // ==================== 侧边栏窗口拖拽排序（pointer 实现） ====================
  function initSidebarDrag() {
    var sidebar = document.getElementById('sidebarContainer');
    if (!sidebar) return;

    var dragInfo = null; // { el, ghost, startY, offsetY, offsetX, lastTarget, origHeight }

    function getWindowIndex(el) {
      var wins = sidebar.querySelectorAll('.window');
      for (var i = 0; i < wins.length; i++) {
        if (wins[i] === el) return i;
      }
      return -1;
    }

    function getWindowAtY(y) {
      var wins = sidebar.querySelectorAll('.window');
      for (var i = 0; i < wins.length; i++) {
        if (wins[i].classList.contains('dragging')) continue;
        var rect = wins[i].getBoundingClientRect();
        if (y >= rect.top && y <= rect.bottom) return wins[i];
      }
      return null;
    }

    function createGhost(el) {
      var ghost = el.cloneNode(true);
      ghost.style.position = 'fixed';
      ghost.style.zIndex = '9999';
      ghost.style.pointerEvents = 'none';
      ghost.style.opacity = '0.85';
      ghost.style.width = el.offsetWidth + 'px';
      ghost.style.transform = 'scale(1.02)';
      ghost.style.boxShadow = '0 8px 25px rgba(0,0,0,0.35)';
      ghost.style.transition = 'none';
      ghost.classList.remove('dragging', 'drag-over');
      document.body.appendChild(ghost);
      return ghost;
    }

    function shiftTarget(target, sourceEl) {
      // 暂停浮动动画，让目标窗口滑到源窗口原位，形成可见空位
      target.style.animation = 'none';
      var srcRect = sourceEl.getBoundingClientRect();
      var targetRect = target.getBoundingClientRect();
      var shiftY;
      if (targetRect.top < srcRect.top) {
        shiftY = srcRect.height;
      } else {
        shiftY = -srcRect.height;
      }
      target.style.transition = 'transform 0.2s ease';
      target.style.transform = 'translateY(' + shiftY + 'px)';
    }

    function unshiftTarget(target) {
      if (!target) return;
      target.style.transition = 'transform 0.2s ease';
      target.style.transform = '';
      // 过渡结束后恢复浮动动画
      var savedTarget = target;
      setTimeout(function () {
        if (savedTarget && !savedTarget.classList.contains('drag-over')) {
          savedTarget.style.animation = '';
          savedTarget.style.transition = '';
        }
      }, 220);
    }

    function onPointerDown(e) {
      if (!document.body.classList.contains('customizing')) return;

      var titlebar = e.target.closest('.window-titlebar');
      if (!titlebar) return;
      if (e.target.closest('.sidebar-close-btn')) return;

      var win = titlebar.closest('.window');
      if (!win) return;

      e.preventDefault();
      var rect = win.getBoundingClientRect();

      dragInfo = {
        el: win,
        ghost: createGhost(win),
        startY: e.clientY,
        offsetY: e.clientY - rect.top,
        offsetX: e.clientX - rect.left,
        lastTarget: null,
        pendingTarget: null,
        debounceTimer: null,
        origHeight: rect.height
      };

      dragInfo.ghost.style.left = rect.left + 'px';
      dragInfo.ghost.style.top = rect.top + 'px';

      win.classList.add('dragging');
      win.style.animation = 'none';
      win.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e) {
      if (!dragInfo) return;
      e.preventDefault();

      dragInfo.ghost.style.left = (e.clientX - dragInfo.offsetX) + 'px';
      dragInfo.ghost.style.top = (e.clientY - dragInfo.offsetY) + 'px';

      // 防抖目标切换：用短定时器避免边界抽搐
      var target = getWindowAtY(e.clientY);
      if (target === dragInfo.el) target = null;

      // 如果目标与已生效的不同，启动/重置防抖
      if (target !== dragInfo.pendingTarget) {
        dragInfo.pendingTarget = target;
        if (dragInfo.debounceTimer) clearTimeout(dragInfo.debounceTimer);
        dragInfo.debounceTimer = setTimeout(function () {
          if (!dragInfo) return;
          var resolved = dragInfo.pendingTarget;
          if (resolved === dragInfo.lastTarget) return; // 没变，跳过

          // 还原旧目标
          if (dragInfo.lastTarget) {
            unshiftTarget(dragInfo.lastTarget);
            dragInfo.lastTarget.classList.remove('drag-over');
          }
          // 应用新目标
          if (resolved) {
            dragInfo.lastTarget = resolved;
            resolved.classList.add('drag-over');
            shiftTarget(resolved, dragInfo.el);
          } else {
            dragInfo.lastTarget = null;
          }
        }, 60); // 60ms 稳定后才切换
      }
    }

    function onPointerUp(e) {
      if (!dragInfo) return;

      // 清理防抖
      if (dragInfo.debounceTimer) clearTimeout(dragInfo.debounceTimer);

      var targetWin = dragInfo.lastTarget;

      // 还原目标移位
      if (targetWin) {
        unshiftTarget(targetWin);
        targetWin.classList.remove('drag-over');
      }

      // 移除 ghost
      if (dragInfo.ghost && dragInfo.ghost.parentNode) {
        dragInfo.ghost.parentNode.removeChild(dragInfo.ghost);
      }

      // 清理源
      dragInfo.el.classList.remove('dragging');
      dragInfo.el.style.animation = '';

      // 执行排序（只要目标不是自己）
      if (targetWin && targetWin !== dragInfo.el) {
        var srcIndex = getWindowIndex(dragInfo.el);
        var targetIndex = getWindowIndex(targetWin);
        if (srcIndex !== -1 && targetIndex !== -1) {
          if (srcIndex < targetIndex) {
            sidebar.insertBefore(dragInfo.el, targetWin.nextSibling);
          } else {
            sidebar.insertBefore(dragInfo.el, targetWin);
          }
        }
      }

      dragInfo = null;
    }

    sidebar.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  }

  // ==================== 侧边栏关闭按钮 ====================
  function initSidebarClose() {
    var sidebar = document.getElementById('sidebarContainer');
    if (!sidebar) return;

    sidebar.addEventListener('click', function (e) {
      var closeBtn = e.target.closest('.sidebar-close-btn');
      if (!closeBtn) return;

      // 只在个性化模式下响应
      if (!document.body.classList.contains('customizing')) return;

      var win = closeBtn.closest('.window');
      if (win && win.getAttribute('data-sidebar-id') !== 'function') {
        win.classList.add('window-hidden');
        // 同步更新个性化面板中的图标状态
        var panel = document.getElementById('customizePanel');
        if (panel) {
          var sidebarId = win.getAttribute('data-sidebar-id');
          var item = panel.querySelector('.customize-icon-item[data-sidebar-id="' + sidebarId + '"]');
          if (item) item.classList.remove('grayed');
        }
      }
    });
  }

  // ==================== 主题初始化 ====================
  function initTheme() {
    var savedTheme = localStorage.getItem('theme') || 'style.css';
    var themeLink = document.getElementById('themeCss');
    if (themeLink) themeLink.href = savedTheme;
  }

  // ==================== 初始化 ====================
  function initAll() {
    initTheme();
    initSettings();
    initBackground();
    initCustomize();
    initSidebarDrag();
    initSidebarClose();
    initWidget();
    initLive2D();
    initArticlePreviews();
    initWaifuSearch();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
