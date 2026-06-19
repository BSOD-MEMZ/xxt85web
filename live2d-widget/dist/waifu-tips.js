/*!
 * Live2D Widget
 * https://github.com/stevenjoezhang/live2d-widget
 */
function e(e) {
  return Array.isArray(e) ? e[Math.floor(Math.random() * e.length)] : e;
}
function t(e, t) {
  const s = Math.floor(Math.random() * (e - 1));
  return s >= t ? s + 1 : s;
}
function s(e, t) {
  return new Promise((t, s) => {
    let o;
    ((o = document.createElement('script')),
      (o.src = e),
      o &&
        ((o.onload = () => t(e)),
        (o.onerror = () => s(e)),
        document.head.appendChild(o)));
  });
}
let o = null;
function i(t, s, i, n = !0) {
  let l = parseInt(sessionStorage.getItem('waifu-message-priority'), 10);
  if ((isNaN(l) && (l = 0), !t || (n && l > i) || (!n && l >= i))) return;
  (o && (clearTimeout(o), (o = null)),
    (t = e(t)),
    sessionStorage.setItem('waifu-message-priority', String(i)));
  const a = document.getElementById('waifu-tips');
  ((a.innerHTML = t),
    a.classList.add('waifu-tips-active'),
    (o = setTimeout(() => {
      (sessionStorage.removeItem('waifu-message-priority'),
        a.classList.remove('waifu-tips-active'));
    }, s)));
}
function n(e, ...t) {
  return e.replace(/\$(\d+)/g, (e, s) => {
    var o;
    const i = parseInt(s, 10) - 1;
    return null !== (o = t[i]) && void 0 !== o ? o : '';
  });
}
class l {
  constructor(e = 'info') {
    this.level = e;
  }
  setLevel(e) {
    e && (this.level = e);
  }
  shouldLog(e) {
    return l.levelOrder[e] <= l.levelOrder[this.level];
  }
  error(e, ...t) {
    this.shouldLog('error') && console.error('[Live2D Widget][ERROR]', e, ...t);
  }
  warn(e, ...t) {
    this.shouldLog('warn') && console.warn('[Live2D Widget][WARN]', e, ...t);
  }
  info(e, ...t) {
    this.shouldLog('info') && console.log('[Live2D Widget][INFO]', e, ...t);
  }
  trace(e, ...t) {
    this.shouldLog('trace') && console.log('[Live2D Widget][TRACE]', e, ...t);
  }
}
l.levelOrder = { error: 0, warn: 1, info: 2, trace: 3 };
const a = new l();
class c {
  constructor(e, t = []) {
    var s;
    this.modelList = null;
    let { apiPath: o, cdnPath: i } = e;
    const { cubism2Path: n, cubism5Path: l } = e;
    let c = !1;
    if ('string' == typeof i) (i.endsWith('/') || (i += '/'), (c = !0));
    else if ('string' == typeof o)
      (o.endsWith('/') || (o += '/'),
        (i = o),
        (c = !0),
        a.warn('apiPath option is deprecated. Please use cdnPath instead.'));
    else if (!t.length) throw 'Invalid initWidget argument!';
    let d = parseInt(localStorage.getItem('modelId'), 10),
      r = parseInt(localStorage.getItem('modelTexturesId'), 10);
    ((isNaN(d) || isNaN(r)) && (r = 0),
      isNaN(d) && (d = null !== (s = e.modelId) && void 0 !== s ? s : 0),
      (this.useCDN = c),
      (this.cdnPath = i || ''),
      (this.cubism2Path = n || ''),
      (this.cubism5Path = l || ''),
      (this._modelId = d),
      (this._modelTexturesId = r),
      (this.currentModelVersion = 0),
      (this.loading = !1),
      (this.modelJSONCache = {}),
      (this.models = t));
  }
  static async initCheck(e, t = []) {
    const s = new c(e, t);
    if (s.useCDN) {
      const e = await fetch(`${s.cdnPath}model_list.json`);
      ((s.modelList = await e.json()),
        s.modelId >= s.modelList.models.length && (s.modelId = 0));
      const t = s.modelList.models[s.modelId];
      if (Array.isArray(t))
        s.modelTexturesId >= t.length && (s.modelTexturesId = 0);
      else {
        const e = `${s.cdnPath}model/${t}/index.json`,
          o = await s.fetchWithCache(e);
        if (2 === s.checkModelVersion(o)) {
          const e = await s.loadTextureCache(t);
          s.modelTexturesId >= e.length && (s.modelTexturesId = 0);
        }
      }
    } else
      (s.modelId >= s.models.length && (s.modelId = 0),
        s.modelTexturesId >= s.models[s.modelId].paths.length &&
          (s.modelTexturesId = 0));
    return s;
  }
  set modelId(e) {
    ((this._modelId = e), localStorage.setItem('modelId', e.toString()));
  }
  get modelId() {
    return this._modelId;
  }
  set modelTexturesId(e) {
    ((this._modelTexturesId = e),
      localStorage.setItem('modelTexturesId', e.toString()));
  }
  get modelTexturesId() {
    return this._modelTexturesId;
  }
  resetCanvas() {
    document.getElementById('waifu-canvas').innerHTML =
      '<canvas id="live2d" width="800" height="800"></canvas>';
  }
  async fetchWithCache(e) {
    let t;
    if (e in this.modelJSONCache) t = this.modelJSONCache[e];
    else {
      try {
        const s = await fetch(e);
        t = await s.json();
      } catch (e) {
        t = null;
      }
      this.modelJSONCache[e] = t;
    }
    return t;
  }
  checkModelVersion(e) {
    return 3 === e.Version || e.FileReferences ? 3 : 2;
  }
  async loadLive2D(e, t) {
    if (this.loading) a.warn('Still loading. Abort.');
    else {
      this.loading = !0;
      try {
        const o = this.checkModelVersion(t);
        if (2 === o) {
          if (!this.cubism2model) {
            if (!this.cubism2Path)
              return void a.error(
                'No cubism2Path set, cannot load Cubism 2 Core.',
              );
            await s(this.cubism2Path);
            const { default: e } = await import('./chunk/index.js');
            this.cubism2model = new e();
          }
          (3 === this.currentModelVersion &&
            (this.cubism5model.release(), this.resetCanvas()),
            3 !== this.currentModelVersion && this.cubism2model.gl
              ? await this.cubism2model.changeModelWithJSON(e, t)
              : await this.cubism2model.init('live2d', e, t));
        } else {
          if (!this.cubism5Path)
            return void a.error(
              'No cubism5Path set, cannot load Cubism 5 Core.',
            );
          await s(this.cubism5Path);
          const { AppDelegate: t } = await import('./chunk/index2.js');
          ((this.cubism5model = new t()),
            2 === this.currentModelVersion &&
              (this.cubism2model.destroy(), this.resetCanvas()),
            2 !== this.currentModelVersion &&
            this.cubism5model.subdelegates.at(0)
              ? this.cubism5model.changeModel(e)
              : (this.cubism5model.initialize(),
                this.cubism5model.changeModel(e),
                this.cubism5model.run()));
        }
        (a.info(`Model ${e} (Cubism version ${o}) loaded`),
          (this.currentModelVersion = o));
      } catch (e) {
        console.error('loadLive2D failed', e);
      }
      this.loading = !1;
    }
  }
  async loadTextureCache(e) {
    return (
      (await this.fetchWithCache(`${this.cdnPath}model/${e}/textures.cache`)) ||
      []
    );
  }
  async loadModel(e) {
    let t, s;
    if (this.useCDN) {
      let e = this.modelList.models[this.modelId];
      (Array.isArray(e) && (e = e[this.modelTexturesId]),
        (t = `${this.cdnPath}model/${e}/index.json`),
        (s = await this.fetchWithCache(t)));
      if (2 === this.checkModelVersion(s)) {
        const t = await this.loadTextureCache(e);
        if (t.length > 0) {
          let e = t[this.modelTexturesId];
          ('string' == typeof e && (e = [e]), (s.textures = e));
        }
      }
    } else
      ((t = this.models[this.modelId].paths[this.modelTexturesId]),
        (s = await this.fetchWithCache(t)));
    (await this.loadLive2D(t, s), i(e, 4e3, 10));
  }
  async loadRandTexture(e = '', s = '') {
    const { modelId: o } = this;
    let n = !1;
    if (this.useCDN) {
      const e = this.modelList.models[o];
      if (Array.isArray(e))
        this.modelTexturesId = t(e.length, this.modelTexturesId);
      else {
        const s = `${this.cdnPath}model/${e}/index.json`,
          o = await this.fetchWithCache(s);
        if (2 === this.checkModelVersion(o)) {
          const s = await this.loadTextureCache(e);
          s.length <= 1
            ? (n = !0)
            : (this.modelTexturesId = t(s.length, this.modelTexturesId));
        } else n = !0;
      }
    } else
      1 === this.models[o].paths.length
        ? (n = !0)
        : (this.modelTexturesId = t(
            this.models[o].paths.length,
            this.modelTexturesId,
          ));
    n ? i(s, 4e3, 10) : await this.loadModel(e);
  }
  async loadNextModel() {
    ((this.modelTexturesId = 0),
      this.useCDN
        ? ((this.modelId = (this.modelId + 1) % this.modelList.models.length),
          await this.loadModel(this.modelList.messages[this.modelId]))
        : ((this.modelId = (this.modelId + 1) % this.models.length),
          await this.loadModel(this.models[this.modelId].message)));
  }
}
class d {
  constructor(e, t, s) {
    ((this.config = t),
      (this.tools = {
        hitokoto: {
          icon: '<img src="live2d-widget/dist/assets/hitokoto.png" alt="hitokoto" style="width:32px;height:32px;">',
          callback: async () => {
            const e = await fetch('https://v1.hitokoto.cn'),
              t = await e.json(),
              o = n(s.message.hitokoto, t.from, t.creator);
            (i(t.hitokoto, 6e3, 9),
              setTimeout(() => {
                i(o, 4e3, 9);
              }, 6e3));
          },
        },
        asteroids: {
          icon: '<img src="live2d-widget/dist/assets/game.png" alt="asteroids" style="width:32px;height:32px;">',
          callback: () => {
            if (window.Asteroids)
              (window.ASTEROIDSPLAYERS || (window.ASTEROIDSPLAYERS = []),
                window.ASTEROIDSPLAYERS.push(new window.Asteroids()));
            else {
              const e = document.createElement('script');
              ((e.src =
                'https://fastly.jsdelivr.net/gh/stevenjoezhang/asteroids/asteroids.js'),
                document.head.appendChild(e));
            }
          },
        },
        'switch-model': {
          icon: '<img src="live2d-widget/dist/assets/model.png" alt="switch-model" style="width:32px;height:32px;">',
          callback: () => e.loadNextModel(),
        },
        'switch-texture': {
          icon: '<img src="live2d-widget/dist/assets/texture.png" alt="switch-texture" style="width:32px;height:32px;">',
          callback: () => {
            let t = '',
              o = '';
            (s && ((t = s.message.changeSuccess), (o = s.message.changeFail)),
              e.loadRandTexture(t, o));
          },
        },
        search: {
          icon: '<img src="live2d-widget/dist/assets/search.png" alt="search" style="width:32px;height:32px;">',
          callback: () => {
            open('search.html');
          },
        },
        chat: {
          icon: '<img src="live2d-widget/dist/assets/chat.png" alt="chat" style="width:32px;height:32px;">',
          callback: () => {
            const tips = document.getElementById('waifu-tips');
            if (!tips) return;
            tips.innerHTML =
              '<div style="padding:8px 8px;display:flex;align-items:center;gap:4px;">' +
              '<input type="text" id="waifuChatInput" placeholder="输入问题" style="' +
              'flex:1;padding:5px 8px;border:1px solid #7da2ce;border-radius:2px;' +
              'font-size:13px;font-family:inherit;background:#fff;color:#000;min-width:0;" />' +
              '<button id="waifuChatClose" style="padding:4px 10px;background:linear-gradient(to bottom,#fefefe,#E5EAF5 30%,#D4DBED 31%,#E1E6F6);color:#000;border:1px solid #8b8b8b;border-radius:2px;cursor:pointer;font-size:12px;font-family:inherit;white-space:nowrap;">关闭</button>' +
              '<button id="waifuChatSend" style="padding:4px 10px;background:linear-gradient(to bottom,#fefefe,#E5EAF5 30%,#D4DBED 31%,#E1E6F6);color:#000;border:1px solid #8b8b8b;border-radius:2px;cursor:pointer;font-size:12px;font-family:inherit;white-space:nowrap;">发送</button>' +
              '</div>';
            tips.classList.add('waifu-tips-active');
            sessionStorage.setItem('waifu-message-priority', '11');
            const input = document.getElementById('waifuChatInput');
            if (input) {
              input.focus();
              const closeChat = () => {
                sessionStorage.removeItem('waifu-message-priority');
                tips.classList.remove('waifu-tips-active');
              };
              const doTypewriter = (text, duration, priority) => {
                const picked = Array.isArray(text) ? text[Math.floor(Math.random() * text.length)] : text;
                sessionStorage.setItem('waifu-message-priority', String(priority));
                if (o) { clearTimeout(o); o = null; }
                const tips = document.getElementById('waifu-tips');
                tips.innerHTML = '';
                tips.classList.add('waifu-tips-active');
                let idx = 0;
                const chars = [...picked];
                const type = () => {
                  if (idx < chars.length) {
                    const chunk = 1 + Math.floor(Math.random() * 4);
                    tips.textContent += chars.slice(idx, idx + chunk).join('');
                    idx += chunk;
                    o = setTimeout(type, 20 + Math.random() * 120);
                  } else {
                    o = setTimeout(() => {
                      sessionStorage.removeItem('waifu-message-priority');
                      tips.classList.remove('waifu-tips-active');
                    }, duration);
                  }
                };
                o = setTimeout(type, 60);
              };
              const doThinking = (cb) => {
                if (Math.random() > 0.35) { cb(); return; }
                const tips = document.getElementById('waifu-tips');
                tips.innerHTML = '<span style="color:#888;">正在思考...</span>';
                tips.classList.add('waifu-tips-active');
                setTimeout(() => { tips.innerHTML = ''; cb(); }, 600 + Math.random() * 900);
              };
              const send = () => {
                const q = input.value.trim();
                if (!q) { closeChat(); return; }
                const t = q.toLowerCase();
                if (/转人工|人工客服|联系站长|邮箱|mail/i.test(t)) {
                  i('正在为您转接人工客服...', 3000, 11);
                  setTimeout(() => { window.location.href = 'mailto:xxt8582753@126.com'; }, 1500);
                } else if (/你是谁|你的名字|介绍自己/i.test(t)) {
                  doThinking(() => doTypewriter(['我平时帮他看家，顺便陪大家聊天~', '我是来自 Bilibili Live 的看板娘，被站长领养过来帮忙看家啦！'], 6000, 11));
                } else if (/网站|小站|xxtsoft/i.test(t)) {
                  doThinking(() => doTypewriter(['xxtsoft.top 是站长的个人网站，有他写的程序、文章和奇奇怪怪的小玩意。去「下载」页面看看有没有你需要的工具吧~', '这是站长亲手打造的秘密基地！文章、下载、多媒体一应俱全，记得收藏哦~'], 6000, 11));
                } else if (/收藏|域名|地址/i.test(t)) {
                  doThinking(() => doTypewriter(['本站永久域名：xxtsoft.top，快收藏起来！', '记住 xxtsoft.top，这就是回家的路~', '别忘了收藏 xxtsoft.top 哦，站长会持续更新的！'], 4000, 11));
                } else if (/hello|hi|你好|嗨|嗨喽|ciallo/i.test(t)) {
                  doThinking(() => doTypewriter(['你好呀！', '嗨！有什么可以帮你的吗？', '你好你好~欢迎来到 xxtsoft！'], 4000, 11));
                } else if (/谢谢|感谢|多谢|thank/i.test(t)) {
                  doThinking(() => doTypewriter(['不客气~有什么需要再来找我哦！', '客气啦，能帮到你就好！', '嘿嘿，小事一桩~'], 4000, 11));
                } else if (/再见|拜拜|bye|走了/i.test(t)) {
                  doThinking(() => doTypewriter(['拜拜~下次再来玩哦！', '再见啦，随时欢迎你回来！'], 4000, 11));
                } else if (/我觉得(.+)/.test(q)) {
                  var m = q.match(/我觉得(.+)/);
                  doThinking(() => doTypewriter(['那你为什么觉得' + m[1] + '呢？', '原来你觉得' + m[1] + '啊，能展开说说吗？', '有意思，' + m[1] + '... 你是怎么得出这个结论的？'], 6000, 11));
                } else if (/我想(.+)/.test(q)) {
                  var m = q.match(/我想(.+)/);
                  doThinking(() => doTypewriter(['你想' + m[1] + '吗？为什么会有这个想法呢？', '想' + m[1] + '是个不错的想法！能具体聊聊吗？'], 5000, 11));
                } else if (/我喜欢(.+)/.test(q)) {
                  var m = q.match(/我喜欢(.+)/);
                  doThinking(() => doTypewriter(['哇，' + m[1] + '确实不错呢！', '我也觉得' + m[1] + '很棒！', m[1] + '有什么特别吸引你的地方吗？'], 5000, 11));
                } else if (/我讨厌(.+)/.test(q) || /我恨(.+)/.test(q)) {
                  var m = q.match(/我(?:讨厌|恨)(.+)/);
                  doThinking(() => doTypewriter([m[1] + '确实让人头疼呢... 是遇到什么事了吗？', '理解理解，' + m[1] + '有时候真的很烦人。'], 5000, 11));
                } else if (/我不(?:知道|懂|明白)(.+)/.test(q)) {
                  var m = q.match(/我不(?:知道|懂|明白)(.+)/);
                  doThinking(() => doTypewriter(['没关系，' + m[1] + '这种东西慢慢就懂了~', '其实' + m[1] + '没那么复杂，要不要问问站长？'], 5000, 11));
                } else if (/我认为(.+)/.test(q)) {
                  var m = q.match(/我认为(.+)/);
                  doThinking(() => doTypewriter(['你认为是' + m[1] + '？很有见地！', m[1] + '... 这个观点挺有意思的，为什么这么认为呢？'], 5000, 11));
                } else if (/怎么(.+)/.test(q)) {
                  var m = q.match(/怎么(.+)/);
                  doThinking(() => doTypewriter(['关于怎么' + m[1] + '，这个可能要去问站长本人了~', '唔，怎么' + m[1] + '... 或许可以去文章里找找答案？'], 5000, 11));
                } else if (/(.+)怎么样/.test(q)) {
                  var m = q.match(/(.+)怎么样/);
                  doThinking(() => doTypewriter([m[1] + '啊... 我觉得还行？你怎么看？', '这个嘛，你自己体验过' + m[1] + '吗？感觉如何？'], 5000, 11));
                } else if (/python|pyqt|编程|代码|开发/i.test(t)) {
                  doThinking(() => doTypewriter(['去「下载」页面看看！站长把好用的工具都放在那里了。',], 5000, 11));
                } else if (/文章|博客|blog|教程/i.test(t)) {
                  doThinking(() => doTypewriter(['站长写的文章都在「文章」页面，从编程教程到生活吐槽应有尽有~', '文章页是站长的精神自留地，翻一翻能发现不少宝藏。'], 5000, 11));
                } else if (/视频|多媒体|media|bilibili|b站/i.test(t)) {
                  doThinking(() => doTypewriter(['想看站长做的视频？去「多媒体」页面！或者直接去B站搜 xxt8582753~', '站长在B站也有号，B站直接搜BSOD-MEMZ，多媒体页有链接！'], 5000, 11));
                } else if (/友链|友情链接|友站|邻居/i.test(t)) {
                  doThinking(() => doTypewriter(['本站有友链功能！如果你也有个人网站，可以去「关于」页面申请交换友链~', '想和站长做邻居吗？去关于页发邮件申请友链吧！'], 5000, 11));
                } else if (/留言|guestbook|评论/i.test(t)) {
                  doThinking(() => doTypewriter(['去留言本页面就可以给站长留言啦！他看到了会回复的。', '留言本在导航栏里，有什么想对站长说的就去写吧~'], 5000, 11));
                } else if (/你.*傻|你.*笨|笨蛋|sb/i.test(t)) {
                  doThinking(() => doTypewriter(['喂！我可是很聪明的！……大概吧。', '呜呜呜被骂了……我去找站长告状！', '哼！不理你了！（但还是会回答问题的）'], 4000, 11));
                } else {
                  doThinking(() => doTypewriter(['唔...这个问题有点难到我了。要不换个问法试试？', '哎呀，超出我的知识范围了。试试问点别的？', '这个我还真不太清楚呢……', '可以再详细点吗？', '你是指？'], 5000, 11));
                }
              };
              document.getElementById('waifuChatSend').addEventListener('click', send);
              document.getElementById('waifuChatClose').addEventListener('click', closeChat);
              input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
            }
          },
        },
        info: {
          icon: '<img src="live2d-widget/dist/assets/info.png" alt="info" style="width:32px;height:32px;">',
          callback: () => {
            open('https://github.com/BSOD-MEMZ/xxt85web');
          },
        },
        quit: {
          icon: '<img src="live2d-widget/dist/assets/close.png" alt="quit" style="width:32px;height:32px;">',
          callback: () => {
            localStorage.setItem('waifu-display', Date.now().toString());
            i(s.message.goodbye, 2e3, 11);
            const e = document.getElementById('waifu');
            e &&
              (e.classList.remove('waifu-active'),
              setTimeout(() => {
                e.classList.add('waifu-hidden');
                const t = document.getElementById('waifu-toggle');
                null == t || t.classList.add('waifu-toggle-active');
              }, 3e3));
          },
        },
      }));
  }
  registerTools() {
    var e;
    Array.isArray(this.config.tools) ||
      (this.config.tools = Object.keys(this.tools));
    for (const t of this.config.tools)
      if (this.tools[t]) {
        const { icon: s, callback: o } = this.tools[t],
          i = document.createElement('span');
        ((i.id = `waifu-tool-${t}`),
          (i.innerHTML = s),
          null === (e = document.getElementById('waifu-tool')) ||
            void 0 === e ||
            e.insertAdjacentElement('beforeend', i),
          i.addEventListener('click', o));
      }
  }
}
async function r(t) {
  var s;
  (localStorage.removeItem('waifu-display'),
    sessionStorage.removeItem('waifu-message-priority'),
    document.body.insertAdjacentHTML(
      'beforeend',
      '<div id="waifu">\n       <div id="waifu-tips"></div>\n       <div id="waifu-canvas">\n         <canvas id="live2d" width="800" height="800"></canvas>\n       </div>\n       <div id="waifu-tool"></div>\n     </div>',
    ));
  let o,
    l = [];
  if (t.waifuPath) {
    const s = await fetch(t.waifuPath);
    ((o = await s.json()),
      (l = o.models),
      (function (t) {
        let s,
          o = !1;
        const n = t.message.default;
        let l;
        (t.seasons.forEach(({ date: t, text: s }) => {
          const o = new Date(),
            i = t.split('-')[0],
            l = t.split('-')[1] || i;
          Number(i.split('/')[0]) <= o.getMonth() + 1 &&
            o.getMonth() + 1 <= Number(l.split('/')[0]) &&
            Number(i.split('/')[1]) <= o.getDate() &&
            o.getDate() <= Number(l.split('/')[1]) &&
            ((s = (s = e(s)).replace('{year}', String(o.getFullYear()))),
            n.push(s));
        }),
          window.addEventListener('mousemove', () => (o = !0)),
          window.addEventListener('keydown', () => (o = !0)),
          setInterval(() => {
            o
              ? ((o = !1), clearInterval(s), (s = null))
              : s ||
                (s = setInterval(() => {
                  i(n, 6e3, 9);
                }, 2e4));
          }, 1e3),
          window.addEventListener('mouseover', (s) => {
            var o;
            for (let { selector: n, text: a } of t.mouseover)
              if (
                null === (o = s.target) || void 0 === o ? void 0 : o.closest(n)
              ) {
                if (l === n) return;
                return (
                  (l = n),
                  (a = e(a)),
                  (a = a.replace('{text}', s.target.innerText)),
                  void i(a, 4e3, 8)
                );
              }
          }),
          window.addEventListener('click', (s) => {
            var o;
            for (let { selector: n, text: l } of t.click)
              if (
                null === (o = s.target) || void 0 === o ? void 0 : o.closest(n)
              )
                return (
                  (l = e(l)),
                  (l = l.replace('{text}', s.target.innerText)),
                  void i(l, 4e3, 8)
                );
          }),
          window.addEventListener('live2d:hoverbody', () => {
            i(e(t.message.hoverBody), 4e3, 8, !1);
          }),
          window.addEventListener('live2d:tapbody', () => {
            i(e(t.message.tapBody), 4e3, 9);
          }));
        const a = () => {};
        (console.log('%c', a),
          (a.toString = () => {
            i(t.message.console, 6e3, 9);
          }),
          window.addEventListener('copy', () => {
            i(t.message.copy, 6e3, 9);
          }),
          window.addEventListener('visibilitychange', () => {
            document.hidden || i(t.message.visibilitychange, 6e3, 9);
          }));
      })(o),
      i(
        (function (e, t, s) {
          if ('/' === location.pathname)
            for (const { hour: t, text: s } of e) {
              const e = new Date(),
                o = t.split('-')[0],
                i = t.split('-')[1] || o;
              if (Number(o) <= e.getHours() && e.getHours() <= Number(i))
                return s;
            }
          const o = n(t, document.title);
          if ('' !== document.referrer) {
            const e = new URL(document.referrer);
            return location.hostname === e.hostname
              ? o
              : `${n(s, e.hostname)}<br>${o}`;
          }
          return o;
        })(o.time, o.message.welcome, o.message.referrer),
        7e3,
        11,
      ));
  }
  const a = await c.initCheck(t, l);
  (await a.loadModel(''),
    new d(a, t, o).registerTools(),
    t.drag &&
      (function () {
        const e = document.getElementById('waifu');
        if (!e) return;
        let t = window.innerWidth,
          s = window.innerHeight;
        const o = e.offsetWidth,
          i = e.offsetHeight;
        (e.addEventListener('mousedown', (n) => {
          if (2 === n.button) return;
          const l = document.getElementById('live2d');
          if (n.target !== l) return;
          n.preventDefault();
          const a = n.offsetX,
            c = n.offsetY;
          ((document.onmousemove = (n) => {
            const l = n.clientX,
              d = n.clientY;
            let r = l - a,
              m = d - c;
            (m < 0 ? (m = 0) : m >= s - i && (m = s - i),
              r < 0 ? (r = 0) : r >= t - o && (r = t - o),
              (e.style.top = m + 'px'),
              (e.style.left = r + 'px'));
          }),
            (document.onmouseup = () => {
              document.onmousemove = null;
            }));
        }),
          (window.onresize = () => {
            ((t = window.innerWidth), (s = window.innerHeight));
          }));
      })(),
    null === (s = document.getElementById('waifu')) ||
      void 0 === s ||
      s.classList.add('waifu-active'));
}
window.initWidget = function (e) {
  if ('string' == typeof e)
    return void a.error(
      'Your config for Live2D initWidget is outdated. Please refer to https://github.com/stevenjoezhang/live2d-widget/blob/master/dist/autoload.js',
    );
  (a.setLevel(e.logLevel),
    document.body.insertAdjacentHTML(
      'beforeend',
      '<div id="waifu-toggle">\n       <img src="live2d-widget/dist/assets/toggle.png" alt="waifu-toggle" style="width:16px;height:16px;">\n     </div>',
    ));
  const t = document.getElementById('waifu-toggle');
  (null == t ||
    t.addEventListener('click', () => {
      var s;
      (null == t || t.classList.remove('waifu-toggle-active'),
        (null == t ? void 0 : t.getAttribute('first-time'))
          ? (r(e), null == t || t.removeAttribute('first-time'))
          : (localStorage.removeItem('waifu-display'),
            null === (s = document.getElementById('waifu')) ||
              void 0 === s ||
              s.classList.remove('waifu-hidden'),
            setTimeout(() => {
              var e;
              null === (e = document.getElementById('waifu')) ||
                void 0 === e ||
                e.classList.add('waifu-active');
            }, 0)));
    }),
    localStorage.getItem('waifu-display') &&
    Date.now() - Number(localStorage.getItem('waifu-display')) <= 864e5
      ? (null == t || t.setAttribute('first-time', 'true'),
        setTimeout(() => {
          null == t || t.classList.add('waifu-toggle-active');
        }, 0))
      : r(e));
};
export { a as l };
//# sourceMappingURL=waifu-tips.js.map
