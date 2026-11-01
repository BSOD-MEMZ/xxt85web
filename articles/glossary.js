(function () {
    'use strict';

    var STORAGE_KEY = 'glossary_enabled';

    function disabled() {
        try {
            return localStorage.getItem(STORAGE_KEY) === 'false';
        } catch (err) {
            return false;
        }
    }

    if (disabled()) return;

    /* =============================================================
       1. 词条表
       -------------------------------------------------------------
       两种模式，靠字段区分，不靠开关：
         · 术语模式（默认）—— 技术用语，只写 t / d，卡片上只有词名与释义
         · 词典模式 —— 加 kind: 'dict'，再给 read（罗马音或音标）与 pos
           （词性），卡片上多出一行读音 + 词性标签

       t    = 词条原文（英文不分大小写匹配）
       d    = 释义。除非这个词本身是梗、或另有隐含意思怕人 get 不到，
              一律用书面语，不写「圈内干脆叫它…」这种口语
       link = 可选，{ href, text }
       ============================================================= */
    var TERMS = [
        {
            t: '中二节奏',
            d: 'SEGA 触屏音游 CHUNITHM 的中文译名。',
            link: { href: 'https://mzh.moegirl.org.cn/CHUNITHM', text: '探索此词条' }
        },
        {
            t: 'pjsk',
            kind: 'dict',
            read: 'puroseka',
            pos: '缩写',
            d: '指 《世界计划 缤纷舞台！ feat. 初音未来》。该名称在日本玩家中简称「プロセカ」，罗马字作 puroseka。',
            link: { href: 'https://mzh.moegirl.org.cn/%E4%B8%96%E7%95%8C%E8%AE%A1%E5%88%92_%E7%BC%A4%E7%BA%B7%E8%88%9E%E5%8F%B0%EF%BC%81_feat._%E5%88%9D%E9%9F%B3%E6%9C%AA%E6%9D%A5', text: '探索此词条' }
        },
        {
            t: 'ping',
            d: '网络诊断命令，通常被用于确认因特网上的一台主机是否可达。'
        },
        {
            t: 'FFmpeg',
            d: '开源计算机程序，提供视频采集、格式转换、流媒体传输等功能。该程序内置音视频编解码技术，支持GPU加速处理，可实现视频截图、水印添加及设备录制等操作。'
        },
        {
            t: 'Vocaloid',
            kind: 'dict',
            read: '/ˈvoʊkəlɔɪd/',
            pos: '专有名词',
            d: 'VOCALOID（ボーカロイド）是电子音乐制作语音合成软件。在软件中输入音调和歌词，就可以合成出类似人类声音的歌声。'
        },
        {
            t: '术力口',
            d: '指雅马哈旗下软件VOCALOID，用于为虚拟歌手调音。因其片假名写为“ボーカロイド”，前三个假名“ボカロ”和汉字“术力口”相似而得此称呼。'
        },
        {
            t: 'ClassIsland',
            d: '开源的桌面课表软件。'
        },
        {
            t: 'Git',
            d: '开源的分布式版本控制系统，该系统通过高效管理项目版本历史，支持从微型到超大规模项目的协作开发。允许开发者在本地克隆完整代码库并独立提交修改，无需依赖中央服务器。典型功能包括分支创建与管理、本地版本提交、多分支合并及冲突智能解决，支持生成补丁并与团队异步协作。'
        },
        {
            t: 'こんにちは',
            kind: 'dict',
            read: 'konnichiwa',
            pos: '感动',
            d: '你好；您好'
        },
        {
            t: '超魔丸バスターズ',
            d: 'kingstar 创建的小团体，专门在校内干坏事。',
			link: { href: '../support/chomowan/index.html', text: '超魔丸バスターズ 故事导读' }
        },
		{
            t: 'ITEx',
            d: '株洲市南方中学信息拓展社。',
			link: { href: 'https://itex.zznfzx.com/', text: '访问社团官网' }
        },
        {
            t: 'Available Fish',
            d: '其实是闲鱼的意思',
            ctx: {
                en: 'Fine! I\'m considering the possibility of selling the taiko on Available Fish.',
                zh: '好吧！我在考虑把这面太鼓挂到闲鱼上卖掉的可行性。',
                when: 'considering the possibility of selling the taiko'
            }
        },
        {
            t: 'RDP',
            d: '远程桌面协议（Remote Desktop Protocol），微软开发，默认走 3389 端口，可远程操作另一台 Windows 电脑的桌面。'
        },
        {
            t: 'VNC',
            d: '虚拟网络计算（Virtual Network Computing），跨平台的远程桌面协议，传输的是画面像素而非窗口指令。'
        },
        {
            t: 'mstsc',
            d: 'Windows 自带的「远程桌面连接」客户端，在运行窗口输入 mstsc 即可打开。'
        },
        {
            t: 'NAS',
            d: '网络附加存储（Network Attached Storage），接入局域网、供多台设备共享文件的存储设备，常用旧电脑或小主机自己搭。'
        },
        {
            t: 'OMV',
            d: 'OpenMediaVault，基于 Debian 的开源 NAS 系统。'
        },
        {
            t: 'SATA',
            d: '串行 ATA（Serial ATA），硬盘与主板之间的接口标准。'
        },
        {
            t: 'DHCP',
            d: '动态主机配置协议（Dynamic Host Configuration Protocol），给局域网内的设备自动分配 IP 地址、网关与 DNS。'
        },
        {
            t: 'API',
            d: '应用程序编程接口（Application Programming Interface），软件之间约定好的调用方式。'
        },
        {
            t: 'CSS',
            d: '层叠样式表（Cascading Style Sheets），负责网页的外观与排版。'
        },
        {
            t: 'BMP',
            d: '位图（Bitmap）格式，逐像素记录颜色、不做压缩，体积大但保真，方便直接改像素。'
        },
        {
            t: 'GPT',
            d: '生成式预训练变换器（Generative Pre-trained Transformer），OpenAI 提出的大语言模型系列，现也泛指同类对话模型。'
        },
        {
            t: 'DeepSeek',
            d: '国内的 AI 公司及其大模型系列，以开源权重与较低的训练、推理成本著称。'
        },
        {
            t: 'GitHub',
            d: '基于 Git 的代码托管平台，用于存放仓库、协作开发与发布版本。'
        },
        {
            t: 'VSCode',
            d: 'Visual Studio Code，微软出品的开源代码编辑器，基于 Electron 开发，靠扩展支撑各种语言。'
        },
        {
            t: 'Electron',
            d: '基于 Chromium 与 Node.js 的桌面应用框架，可用网页技术写跨平台程序；上手快、代码可复用，代价是体积与内存开销大。'
        },
        {
            t: 'PySide6',
            d: 'Qt for Python 的官方绑定库，用 Python 写 Qt 桌面界面，常与 QFluentWidgets 这类样式库搭配。'
        },
        {
            t: 'EasiNote',
            d: '希沃白板（seewo EasiNote）的英文名，国内中小学常用的互动教学软件。'
        },
        {
            t: 'enbx',
            d: '希沃白板的课件格式（.enbx），可以理解为一个打包过的课件工程，内含页面、音视频与交互资源。'
        },
        {
            t: 'Patcher',
            d: '给程序打补丁的工具，文中指替换希沃白板安装目录内资源文件的补丁程序。'
        },
        {
            t: 'Toast',
            d: 'Android 中的轻量提示控件：只显示一小段文字、几秒后自动消失，不打断当前操作。'
        },
        {
            t: 'Aero',
            d: 'Windows Vista 与 7 采用的界面风格，特征是半透明玻璃质感、模糊边缘与高光反射。'
        },
        {
            t: 'J1900',
            d: 'Intel Celeron J1900，2013 年前后的低功耗四核处理器，常见于入门 NAS、软路由与迷你主机。'
        },
        {
            t: 'EasyRC',
            d: '国产的 Windows 系统重装工具，在 PE 环境下一键完成分区、释放镜像与引导修复。'
        },
        {
            t: 'textract',
            d: 'Python 的文档文本提取库，可从 Word、Excel、PPT 等 Office 文件中读出文字。'
        },
        {
            t: 'vibe coding',
            d: '主要靠自然语言向 AI 描述需求、由模型生成代码的开发方式，实现细节交给模型。'
        },
        {
            t: 'Nielsen Norman Group',
            d: '由 Jakob Nielsen 与 Don Norman 创立的可用性咨询公司，网页阅读的「F 型视线分布」即出自其 2006 年的眼动研究。'
        },
        {
            t: 'さん',
            kind: 'dict',
            read: 'san',
            pos: '后缀',
            d: '接在人名或称谓后的敬称，相当于汉语的「先生」「女士」，ACG 语境里常音译作「桑」。',
            link: { href: 'https://www.mojidict.com/search?text=さん', text: '在 MOJi 辞書中查看' }
        },
        {
            t: 'ちゃん',
            kind: 'dict',
            read: 'chan',
            pos: '后缀',
            d: '接在人名后的亲昵敬称，语气比「さん」亲近，多用于称呼小孩、年轻女性或关系亲密的人，常译作「小……」「酱」。',
            link: { href: 'https://www.mojidict.com/search?text=ちゃん', text: '在 MOJi 辞書中查看' }
        },
        {
            t: 'ありがとう',
            kind: 'dict',
            read: 'arigatō',
            pos: '寒暄语',
            d: '感谢的寒暄语，相当于「谢谢」；郑重场合说「ありがとうございます」。',
            link: { href: 'https://www.mojidict.com/search?text=ありがとう', text: '在 MOJi 辞書中查看' }
        },
        {
            t: 'ようこそ',
            kind: 'dict',
            read: 'yōkoso',
            pos: '寒暄语',
            d: '欢迎的寒暄语，用于迎接来客，相当于「欢迎」。',
            link: { href: 'https://www.mojidict.com/search?text=ようこそ', text: '在 MOJi 辞書中查看' }
        },
        {
            t: 'だいじょうぶ',
            kind: 'dict',
            read: 'daijōbu',
            pos: '形容动词',
            d: '假名写法的「大丈夫」，意为「不要紧」「没关系」，也可用来委婉拒绝。',
            link: { href: 'https://www.mojidict.com/search?text=だいじょうぶ', text: '在 MOJi 辞書中查看' }
        },
        {
            t: 'かのじょ',
            kind: 'dict',
            read: 'kanojo',
            pos: '名词',
            d: '假名写法的「彼女」，意为「她」，也指「女朋友」。',
            link: { href: 'https://www.mojidict.com/search?text=かのじょ', text: '在 MOJi 辞書中查看' }
        },
        {
            t: 'セカイ',
            kind: 'dict',
            read: 'sekai',
            pos: '名词',
            d: '「世界」的片假名写法。在《世界计划》中指角色各自的心象空间。',
            link: { href: 'https://www.mojidict.com/search?text=セカイ', text: '在 MOJi 辞書中查看' }
        },
        {
            t: 'チームメイト',
            kind: 'dict',
            read: 'chīmumeito',
            pos: '名词',
            d: 'teammate 的片假名音译，意为「队友」。文中也是《世界计划》收录曲《チームメイト》的曲名。',
            link: { href: 'https://www.mojidict.com/search?text=チームメイト', text: '在 MOJi 辞書中查看' }
        },
        {
            t: 'ソルト',
            kind: 'dict',
            read: 'soruto',
            pos: '名词',
            d: 'salt 的片假名音译，意为「盐」。文中指《maimai》系列角色「纱露朵（ソルト）」。',
            link: { href: 'https://www.mojidict.com/search?text=ソルト', text: '在 MOJi 辞書中查看' }
        },
        {
            t: 'でらっくす',
            kind: 'dict',
            read: 'derakkusu',
            pos: '名词',
            d: 'deluxe 的片假名音译，意为「豪华」「高级」。文中用作调侃，形容住宿条件好。',
            link: { href: 'https://www.mojidict.com/search?text=でらっくす', text: '在 MOJi 辞書中查看' }
        },
        {
            t: 'スケッチ',
            kind: 'dict',
            read: 'suketchi',
            pos: '名词',
            d: 'sketch 的片假名音译，意为「素描」「草图」。文中出现在 Windows 截图工具「切り取り & スケッチ」的日文界面文本里。',
            link: { href: 'https://www.mojidict.com/search?text=スケッチ', text: '在 MOJi 辞書中查看' }
        },
        {
            t: 'ずんだ',
            kind: 'dict',
            read: 'zunda',
            pos: '名词',
            d: '毛豆泥，日本宫城县的传统食品。文中出自游戏标题《あなたは世界の終わりにずんだを食べるのだ》。',
            link: { href: 'https://www.mojidict.com/search?text=ずんだ', text: '在 MOJi 辞書中查看' }
        },
        {
            t: 'Administrator',
            d: 'Windows 内置的最高权限本地账户，默认隐藏，可绕过多数权限提示；远程连接时常用它登录。'
        },
        {
            t: 'i5',
            d: 'Intel Core i5，英特尔面向主流市场的处理器系列，性能低于 i7、高于 i3。'
        },
        {
            t: 'Python',
            d: '通用编程语言，语法接近自然语言、生态庞大，常用于脚本、数据处理与桌面小工具。'
        },
        {
            t: 'Linux',
            d: '开源的类 Unix 操作系统内核，也泛指以它为基础的系统（如 Debian、Ubuntu）。'
        },
        {
            t: 'Debian',
            d: '历史悠久的 Linux 发行版，以稳定与完全自由软件著称，Ubuntu、OMV 都基于它。'
        },
        {
            t: 'xfce',
            d: '轻量的 Linux 桌面环境，占用内存小，常用于低配机器或服务器上加图形界面。'
        },
        {
            t: 'DPI',
            d: '每英寸点数（Dots Per Inch）。在 Windows 设置里指系统缩放比例，高 DPI 屏幕需要界面按比例放大，否则字会小得看不清。'
        },
        {
            t: 'B85',
            d: 'Intel 8 系芯片组，对应第四代酷睿平台的主板，2013 年前后出货量极大，二手市场常见。'
        },
        {
            t: 'JavaScript',
            d: '网页脚本语言，负责页面的交互逻辑，与 HTML、CSS 并称前端三件套。'
        },
        {
            t: 'Salt',
            d: '英文「盐」。文中指《maimai》系列角色「纱露朵（ソルト）」，也用作那场行动的计划代号。'
        },
        {
            t: '一体机',
            d: '把主机、屏幕、触摸与音响做在一块的教学设备，教室里那台能写能放的「大电视」就是它。'
        },
        {
            t: '电子班牌',
            d: '挂在教室门口的一块安卓屏，用来显示班级信息、考勤与通知，本质上是一台锁定了桌面的安卓设备。'
        },
        {
            t: '端口',
            d: '网络通信中区分服务的编号。一台电脑的同一个 IP 上，远程桌面走 3389、网页走 80／443，靠端口区分是谁在收发。'
        },
        {
            t: '局域网',
            d: '覆盖范围较小的私有网络，比如一个教室、一栋楼或一个家庭内部的网络，设备之间可直接互访。'
        },
        {
            t: '虚拟机',
            d: '用软件模拟出来的一台「电脑」，有自己的虚拟硬件与系统，跑在宿主机的窗口里，可随时快照、回滚。'
        },
        {
            t: '注册表',
            d: 'Windows 存放系统与软件配置的中心数据库，改界面、改策略、关功能很多都要动它，改错也容易把系统弄坏。'
        },
        {
            t: '组策略',
            d: 'Windows 面向批量设备的管理机制，可统一限制功能、锁定设置，家庭版默认不带完整编辑器。'
        },
        {
            t: '内网穿透',
            d: '把只能在内网访问的服务，通过一台有公网地址的服务器转发出去，使外网也能连上。'
        },
        {
            t: '子网掩码',
            d: '和 IP 地址一起决定「哪些地址算同一个局域网」的参数，配置错误就会出现能 ping 通却连不上的情况。'
        },
        {
            t: '群晖',
            d: 'Synology，台湾的 NAS 厂商，其系统 DSM 以易用著称，成品机价格偏高。'
        },
        {
            t: '黑群晖',
            d: '把群晖的 DSM 系统装到非群晖硬件的机器上，功能接近成品 NAS，但不受官方支持、也无法正常升级。'
        },
        {
            t: 'Android',
            d: '谷歌主导的移动操作系统，手机、平板、班牌与一体机大多跑它；开源部分称 AOSP。'
        },
        {
            t: 'ADB',
            d: 'Android 调试桥（Android Debug Bridge），电脑通过它与安卓设备通信，可安装应用、截屏、查看日志。'
        },
        {
            t: 'scrcpy',
            d: '开源投屏工具，通过 ADB 把安卓设备的画面与操作搬到电脑上，不需要在手机上装任何东西。'
        },
        {
            t: 'BIOS',
            d: '主板上的固件，负责开机自检与引导系统，开机时按 Del／F2 进入设置界面。新机器多已换成 UEFI。'
        },
        {
            t: 'UEFI',
            d: '取代传统 BIOS 的新式固件接口，支持图形界面、大容量硬盘与安全启动。'
        },
        {
            t: 'HTML',
            d: '超文本标记语言，用标签描述网页的结构与内容，与 CSS、JavaScript 并称前端三件套。'
        },
        {
            t: 'JSON',
            d: '一种轻量的数据交换格式，用键值对与数组描述结构，配置文件与接口返回常用它。'
        },
        {
            t: 'GSoC',
            d: 'Google Summer of Code，谷歌每年资助学生参与开源项目的暑期活动，入选者由导师带做项目并领取津贴。'
        }
    ];

    TERMS.sort(function (a, b) {
        return b.t.length - a.t.length;
    });

    var isAsciiTerm = {};
    for (var ti = 0; ti < TERMS.length; ti++) {
        isAsciiTerm[TERMS[ti].t] = /[A-Za-z0-9]/.test(TERMS[ti].t);
    }

    function detectTheme() {
        var links = document.querySelectorAll('link[rel="stylesheet"]');
        for (var i = 0; i < links.length; i++) {
            var href = links[i].getAttribute('href') || '';
            if (/modern-sticker-article\.css$/.test(href)) return 'sticker';
        }
        try {
            if ((localStorage.getItem('theme') || '').indexOf('modern-sticker') > -1) return 'sticker';
        } catch (err) { /* 隐私模式下读不到，按默认主题走 */ }
        return 'default';
    }

    document.documentElement.setAttribute('data-glossary-theme', detectTheme());
    var SKIP_TAGS = /^(A|CODE|PRE|KBD|SAMP|SCRIPT|STYLE|TEXTAREA|BUTTON|H1|H2|H3|H4|H5|H6)$/;

    function collectTextNodes(root) {
        var out = [];
        if (!root || !document.createTreeWalker) return out;

        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: function (node) {
                if (!node.nodeValue || !/\S/.test(node.nodeValue)) {
                    return NodeFilter.FILTER_REJECT;
                }
                for (var p = node.parentNode; p && p !== root; p = p.parentNode) {
                    if (p.nodeType !== 1) continue;
                    if (SKIP_TAGS.test(p.nodeName)) return NodeFilter.FILTER_REJECT;
                    if (p.classList && (p.classList.contains('xxt-term') ||
                        p.classList.contains('xxt-code-block'))) {
                        return NodeFilter.FILTER_REJECT;
                    }
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        });

        var node;
        while ((node = walker.nextNode())) out.push(node);
        return out;
    }

    /* 在纯文本里找一次命中。英文术语要求前后不贴着字母数字，
       否则 "Git" 会命中 "digital"、"ping" 会命中 "mapping"。 */
    function findHit(text, lower, term, ascii) {
        var needle = ascii ? term.toLowerCase() : term;
        var hay = ascii ? lower : text;
        var from = 0;
        while (true) {
            var idx = hay.indexOf(needle, from);
            if (idx < 0) return -1;
            if (!ascii) return idx;
            var before = idx > 0 ? text.charAt(idx - 1) : '';
            var after = text.charAt(idx + term.length);
            if (!/[A-Za-z0-9_]/.test(before) && !/[A-Za-z0-9_]/.test(after)) return idx;
            from = idx + 1;
        }
    }

    var tip = null;
    var tipParts = null;
    var activeTermEl = null;
    var rafId = 0;

    function buildTip() {
        var el = document.createElement('div');
        el.id = 'xxt-gloss';
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-label', '名词解释');
        el.hidden = true;

        var closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'xxt-gloss-x';
        closeBtn.setAttribute('aria-label', '关闭名词解释');
        closeBtn.textContent = '×';

        var name = document.createElement('div');
        name.className = 'xxt-gloss-name';

        /* 词典模式那一行:读音 + 词性。术语模式的词条没有这两项,整行藏起来 */
        var meta = document.createElement('div');
        meta.className = 'xxt-gloss-meta';
        meta.hidden = true;

        var read = document.createElement('span');
        read.className = 'xxt-gloss-read';

        var pos = document.createElement('span');
        pos.className = 'xxt-gloss-pos';

        meta.appendChild(read);
        meta.appendChild(pos);

        var desc = document.createElement('p');
        desc.className = 'xxt-gloss-desc';

        /* 可选:原文与译文。给「整句看不懂」的梗用,没有就整块藏起来 */
        var ctx = document.createElement('div');
        ctx.className = 'xxt-gloss-ctx';
        ctx.hidden = true;

        var ctxEn = document.createElement('div');
        ctxEn.className = 'xxt-gloss-ctx-en';

        var ctxZh = document.createElement('div');
        ctxZh.className = 'xxt-gloss-ctx-zh';

        ctx.appendChild(ctxEn);
        ctx.appendChild(ctxZh);

        var more = document.createElement('a');
        more.className = 'xxt-gloss-more';
        more.setAttribute('target', '_blank');
        more.setAttribute('rel', 'noopener noreferrer');
        var moreText = document.createElement('span');
        var arrow = document.createElement('span');
        arrow.className = 'xxt-gloss-arrow';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '→';
        more.appendChild(moreText);
        more.appendChild(arrow);

        el.appendChild(closeBtn);
        el.appendChild(name);
        el.appendChild(meta);
        el.appendChild(desc);
        el.appendChild(ctx);
        el.appendChild(more);
        document.body.appendChild(el);

        closeBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            close(true);
        });

        tip = el;
        tipParts = {
            name: name,
            meta: meta,
            read: read,
            pos: pos,
            desc: desc,
            ctx: ctx,
            ctxEn: ctxEn,
            ctxZh: ctxZh,
            more: more,
            moreText: moreText,
            closeBtn: closeBtn
        };

        document.addEventListener('click', function (e) {
            if (!tip || tip.hidden) return;
            if (tip.contains(e.target)) return;
            close(false);
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' || e.key === 'Esc') close(true);
        });

        window.addEventListener('scroll', scheduleReposition, true);
        window.addEventListener('resize', scheduleReposition);
    }

    function scheduleReposition() {
        if (!tip || tip.hidden || !activeTermEl) return;
        if (rafId) return;
        rafId = window.requestAnimationFrame(function () {
            rafId = 0;
            if (!tip || tip.hidden || !activeTermEl) return;
            place(activeTermEl);
        });
    }

    function place(anchor) {
        var rect = anchor.getBoundingClientRect();
        var vw = document.documentElement.clientWidth;
        var vh = document.documentElement.clientHeight;
        if (rect.bottom < 0 || rect.top > vh) {
            close(false);
            return;
        }

        var w = tip.offsetWidth;
        var h = tip.offsetHeight;
        var gap = 12;
        var above = false;
        var top = rect.bottom + gap;

        if (top + h > vh - 10 && rect.top - gap - h > 10) {
            above = true;
            top = rect.top - gap - h;
        }
        top = Math.max(10, Math.min(top, vh - h - 10));

        var left = rect.left + rect.width / 2 - w / 2;
        left = Math.max(10, Math.min(left, vw - w - 10));

        tip.style.left = Math.round(left) + 'px';
        tip.style.top = Math.round(top) + 'px';
        tip.classList.toggle('is-above', above);

        var arrowX = Math.round(rect.left + rect.width / 2 - left);
        arrowX = Math.max(16, Math.min(arrowX, w - 16));
        tip.style.setProperty('--gx', arrowX + 'px');
    }

    /* ctx 只在词确实落在那句话里才显示 —— 同一个词条出现在别的文章、别的语境，
       不该凭空冒出一句不相干的译文。比对范围取词所在的段落，空白与大小写先归一。 */
    var CTX_SCOPE = /^(P|LI|BLOCKQUOTE|TD|FIGCAPTION|DD|DT|H1|H2|H3|H4|H5|H6)$/;

    function ctxApplies(termEl, ctx) {
        var probe = String(ctx.when || ctx.en || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (!probe) return false;

        var host = termEl.parentNode;
        while (host && host !== document.body) {
            if (host.nodeType === 1 && CTX_SCOPE.test(host.nodeName)) break;
            host = host.parentNode;
        }
        if (!host || host === document.body) host = termEl.parentNode;

        var text = ((host && host.textContent) || '').replace(/\s+/g, ' ').trim().toLowerCase();
        return text.indexOf(probe) > -1;
    }

    function open(termEl, term) {
        if (!tip) buildTip();

        if (activeTermEl && activeTermEl !== termEl) {
            activeTermEl.classList.remove('is-open');
            activeTermEl.setAttribute('aria-expanded', 'false');
        }

        tipParts.name.textContent = term.t;
        tipParts.desc.textContent = term.d;

        /* 有 read / pos 的按词典条目渲染,其余仍是术语条目 */
        tip.setAttribute('data-mode', term.kind === 'dict' ? 'dict' : 'term');
        tipParts.read.textContent = term.read || '';
        tipParts.read.hidden = !term.read;
        tipParts.pos.textContent = term.pos || '';
        tipParts.pos.hidden = !term.pos;
        tipParts.meta.hidden = !(term.read || term.pos);

        if (term.ctx && (term.ctx.en || term.ctx.zh) && ctxApplies(termEl, term.ctx)) {
            tipParts.ctxEn.textContent = term.ctx.en || '';
            tipParts.ctxEn.hidden = !term.ctx.en;
            tipParts.ctxZh.textContent = term.ctx.zh || '';
            tipParts.ctxZh.hidden = !term.ctx.zh;
            tipParts.ctx.hidden = false;
        } else {
            tipParts.ctx.hidden = true;
        }

        if (term.link && term.link.href) {
            tipParts.more.href = term.link.href;
            tipParts.moreText.textContent = term.link.text || '继续探索';
            tipParts.more.hidden = false;
        } else {
            tipParts.more.removeAttribute('href');
            tipParts.more.hidden = true;
        }

        tip.hidden = false;
        tip.classList.remove('is-above');
        place(termEl);

        activeTermEl = termEl;
        termEl.classList.add('is-open');
        termEl.setAttribute('aria-expanded', 'true');

        try {
            tipParts.closeBtn.focus({ preventScroll: true });
        } catch (err) {
            tipParts.closeBtn.focus();
        }
    }

    function close(restoreFocus) {
        if (!tip || tip.hidden) return;
        tip.hidden = true;

        var prev = activeTermEl;
        activeTermEl = null;
        if (prev) {
            prev.classList.remove('is-open');
            prev.setAttribute('aria-expanded', 'false');
        }
        if (restoreFocus && prev) {
            try {
                prev.focus({ preventScroll: true });
            } catch (err) { /* 老浏览器不支持参数，放弃置焦 */ }
        }
    }

    function toggle(termEl, term) {
        if (activeTermEl === termEl && tip && !tip.hidden) {
            close(true);
            return;
        }
        open(termEl, term);
    }

    function makeTermEl(text, term) {
        var el = document.createElement('span');
        el.className = 'xxt-term';
        el.setAttribute('data-gloss', term.t);
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-haspopup', 'true');
        el.setAttribute('aria-expanded', 'false');
        el.textContent = text;

        el.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            toggle(el, term);
        });

        el.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                e.stopPropagation();
                toggle(el, term);
            }
        });

        return el;
    }

    function annotate(container) {
        var nodes = collectTextNodes(container);
        if (!nodes.length) return 0;

        /* 每个节点切成若干片段；片段带 term 的就是要包起来的命中 */
        var segments = [];
        for (var i = 0; i < nodes.length; i++) {
            segments.push([{ text: nodes[i].nodeValue, term: null }]);
        }

        var hitCount = 0;

        for (var t = 0; t < TERMS.length; t++) {
            var term = TERMS[t];
            var ascii = isAsciiTerm[term.t];
            var done = false;

            for (var n = 0; n < segments.length && !done; n++) {
                var segs = segments[n];
                for (var s = 0; s < segs.length; s++) {
                    var seg = segs[s];
                    if (seg.term || !seg.text) continue;

                    var idx = findHit(seg.text, seg.text.toLowerCase(), term.t, ascii);
                    if (idx < 0) continue;

                    var parts = [];
                    if (idx > 0) parts.push({ text: seg.text.slice(0, idx) });
                    parts.push({ text: seg.text.substr(idx, term.t.length), term: term });
                    var rest = seg.text.slice(idx + term.t.length);
                    if (rest) parts.push({ text: rest });

                    segments[n] = segs.slice(0, s).concat(parts, segs.slice(s + 1));
                    hitCount++;
                    done = true;
                    break;
                }
            }
        }

        if (!hitCount) return 0;

        for (var k = 0; k < nodes.length; k++) {
            var list = segments[k];
            var hasTerm = false;
            for (var q = 0; q < list.length; q++) {
                if (list[q].term) { hasTerm = true; break; }
            }
            if (!hasTerm) continue;

            var node = nodes[k];
            var frag = document.createDocumentFragment();
            for (var p = 0; p < list.length; p++) {
                var piece = list[p];
                frag.appendChild(piece.term
                    ? makeTermEl(piece.text, piece.term)
                    : document.createTextNode(piece.text));
            }
            if (node.parentNode) node.parentNode.replaceChild(frag, node);
        }

        return hitCount;
    }

    function run() {
        var containers = document.querySelectorAll('.article-content');
        for (var i = 0; i < containers.length; i++) {
            var box = containers[i];
            if (box.getAttribute('data-gloss-ready') === '1') continue;
            if (annotate(box)) box.setAttribute('data-gloss-ready', '1');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
