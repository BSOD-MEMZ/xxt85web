const { createApp, reactive, ref, computed, watch, onMounted, onBeforeUnmount } = Vue;
const { snackbar, setColorScheme } = mdui;

const STORAGE_KEY = 'classboard_vue_mdui_config_v1';
const defaultConfig = {
  schoolName: '株洲市南方中学',
  classroomName: '未命名教室',
  themeMode: 'auto',
  themeColor: '#2a5f9e',
  scheduleMode: 'simple',
  classStart: '18:40',
  classEnd: '20:20',
  preClassProgressWindow: 10,
  weatherEnabled: true,
  weatherCity: '株洲',
  weatherLatitude: 27.83,
  weatherLongitude: 113.15,
  csesRaw: '',
  csesFormat: 'auto',
  schedule: {
    odd: {
      0: { course: '班会', teacher: '班主任' },
      1: { course: '数学拓展', teacher: '周老师' },
      2: { course: '英语听说', teacher: '李老师' },
      3: { course: '物理实验', teacher: '陈老师' },
      4: { course: '语文阅读', teacher: '王老师' },
      5: { course: '信息技术', teacher: '刘老师' },
      6: { course: '社团活动', teacher: '指导老师' }
    },
    even: {
      0: { course: '体育康复', teacher: '任课老师' },
      1: { course: '化学提升', teacher: '赵老师' },
      2: { course: '历史专题', teacher: '唐老师' },
      3: { course: '生物探究', teacher: '吴老师' },
      4: { course: '地理实践', teacher: '孙老师' },
      5: { course: '政治时评', teacher: '何老师' },
      6: { course: '心理成长', teacher: '辅导老师' }
    }
  }
};
const weatherCodeMap = {
  0: '晴', 1: '大部晴朗', 2: '多云', 3: '阴', 45: '有雾', 48: '雾凇',
  51: '小毛毛雨', 53: '毛毛雨', 55: '大毛毛雨', 61: '小雨', 63: '中雨', 65: '大雨',
  71: '小雪', 73: '中雪', 75: '大雪', 80: '阵雨', 81: '较强阵雨', 82: '强阵雨', 95: '雷暴'
};
const dayLabels = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

const FEED_URL = 'https://xxtsoft.top/support/ClassBoard/feed.json';
const FEED_PROXY_URLS = [
  FEED_URL,
  `https://api.allorigins.win/raw?url=${encodeURIComponent(FEED_URL)}`,
  `https://cors.isomorphic-git.org/${FEED_URL}`
];
const FEED_CACHE_KEY = 'classboard_feed_cache_v1';
const yamlLoad = (window.jsyaml && typeof window.jsyaml.load === 'function') ? window.jsyaml.load.bind(window.jsyaml) : null;
const LOCAL_FEED_DATA = window.__LOCAL_FEED_DATA__ || null;

function cloneDefault() {
  if (typeof structuredClone === 'function') return structuredClone(defaultConfig);
  return JSON.parse(JSON.stringify(defaultConfig));
}

function normalizeConfig(parsed) {
  return {
    ...cloneDefault(),
    ...parsed,
    schedule: {
      odd: { ...defaultConfig.schedule.odd, ...(parsed?.schedule?.odd || {}) },
      even: { ...defaultConfig.schedule.even, ...(parsed?.schedule?.even || {}) }
    }
  };
}

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefault();
    return normalizeConfig(JSON.parse(raw));
  } catch {
    return cloneDefault();
  }
}

function saveConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function parseTimeToMinutes(timeText) {
  const parts = String(timeText).split(':');
  if (parts.length !== 2 && parts.length !== 3) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  const s = parts.length === 3 ? Number(parts[2]) : 0;
  if (!Number.isInteger(h) || !Number.isInteger(m) || !Number.isInteger(s) || h < 0 || h > 23 || m < 0 || m > 59 || s < 0 || s > 59) return null;
  return h * 60 + m + (s / 60);
}

function normalizeClockText(timeText) {
  const t = String(timeText || '');
  if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t.slice(0, 5);
  if (/^\d{2}:\d{2}$/.test(t)) return t;
  return t;
}

function formatDuration(ms) {
  const mins = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}小时${m}分钟` : `${m}分钟`;
}

function getIsoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getWeekType(date) {
  return getIsoWeek(date) % 2 === 0 ? 'even' : 'odd';
}

function getSimpleClassInfo(schedule, date) {
  const weekType = getWeekType(date);
  const day = date.getDay();
  return schedule[weekType]?.[day] || { course: '晚自习', teacher: '' };
}

function normalizeWeekType(input) {
  const val = String(input ?? '').trim().toLowerCase();
  if (!val || val === 'all' || val === 'both' || val === '0' || val === 'every') return 'all';
  if (['odd', 'single', 'dan', '1', '单', '单周'].includes(val)) return 'odd';
  if (['even', 'double', 'shuang', '2', '双', '双周'].includes(val)) return 'even';
  return 'all';
}

function normalizeDay(rawDay) {
  if (rawDay === undefined || rawDay === null || rawDay === '') return null;
  const d = Number(rawDay);
  if (!Number.isFinite(d)) return null;

  if (d >= 0 && d <= 6) return d;

  if (d >= 1 && d <= 7) {
    const map = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 0 };
    return map[d];
  }

  return null;
}

function buildWorkDayWeekdayMap(cycle) {
  if (!cycle || typeof cycle !== 'object') return null;
  const workCount = Number(cycle.work_count);
  const spans = Array.isArray(cycle.spans) ? cycle.spans : [];
  if (!Number.isInteger(workCount) || workCount < 1 || !spans.length) return null;

  const map = new Map();
  let weekday = 1; // assume day 1 starts on Monday
  let workSeen = 0;
  for (const span of spans) {
    const activity = String(span?.activity || '').toLowerCase();
    const count = Number(span?.count || 0);
    if (!Number.isInteger(count) || count < 1) continue;
    for (let i = 0; i < count; i += 1) {
      if (activity === 'work') {
        workSeen += 1;
        if (workSeen <= workCount) map.set(workSeen, weekday);
      }
      weekday = (weekday % 7) + 1;
      if (workSeen >= workCount) return map;
    }
  }
  return map.size ? map : null;
}

function pickFirst(obj, keys) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
  }
  return undefined;
}

function stripYamlComment(line) {
  let out = '';
  let single = false;
  let dbl = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === "'" && !dbl) single = !single;
    else if (ch === '"' && !single) dbl = !dbl;
    if (ch === '#' && !single && !dbl) break;
    out += ch;
  }
  return out;
}

function parseYamlScalar(text) {
  const t = String(text || '').trim();
  if (!t) return '';
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (t === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  return t;
}

function parseSimpleYaml(rawText) {
  const rawLines = String(rawText || '').split(/\r?\n/);
  const lines = rawLines
    .map((line) => stripYamlComment(line))
    .filter((line) => line.trim().length > 0)
    .map((line) => ({ indent: line.match(/^ */)[0].length, text: line.trim() }));

  let i = 0;
  function parseNode(indent) {
    if (i >= lines.length) return null;
    const line = lines[i];
    if (line.indent < indent) return null;
    if (line.text.startsWith('- ')) return parseArray(indent);
    return parseObject(indent);
  }

  function parseArray(indent) {
    const arr = [];
    while (i < lines.length && lines[i].indent === indent && lines[i].text.startsWith('- ')) {
      const content = lines[i].text.slice(2).trim();
      i += 1;
      if (!content) {
        arr.push(parseNode(indent + 2));
        continue;
      }
      const colon = content.indexOf(':');
      if (colon > -1) {
        const key = content.slice(0, colon).trim();
        const val = content.slice(colon + 1).trim();
        const obj = {};
        if (val) obj[key] = parseYamlScalar(val);
        else obj[key] = parseNode(indent + 2);
        while (i < lines.length && lines[i].indent === indent + 2 && !lines[i].text.startsWith('- ')) {
          const p = lines[i].text.indexOf(':');
          if (p < 0) {
            i += 1;
            continue;
          }
          const k = lines[i].text.slice(0, p).trim();
          const v = lines[i].text.slice(p + 1).trim();
          i += 1;
          if (v) obj[k] = parseYamlScalar(v);
          else obj[k] = parseNode(indent + 4);
        }
        arr.push(obj);
      } else {
        arr.push(parseYamlScalar(content));
      }
    }
    return arr;
  }

  function parseObject(indent) {
    const obj = {};
    while (i < lines.length && lines[i].indent === indent && !lines[i].text.startsWith('- ')) {
      const t = lines[i].text;
      const p = t.indexOf(':');
      if (p < 0) {
        i += 1;
        continue;
      }
      const key = t.slice(0, p).trim();
      const val = t.slice(p + 1).trim();
      i += 1;
      if (val) obj[key] = parseYamlScalar(val);
      else obj[key] = parseNode(indent + 2);
    }
    return obj;
  }

  return parseNode(0) || {};
}

function parseYamlText(rawText) {
  if (yamlLoad) return yamlLoad(rawText);
  return parseSimpleYaml(rawText);
}
function parseCsesLessons(rawText, preferredFormat = 'auto') {
  const text = String(rawText || '').trim();
  if (!text) return { ok: true, lessons: [], warning: '未提供 CSES 内容，当前无课程。' };

  let root;
  const detectJson = text.startsWith('{') || text.startsWith('[');
  const parserPlan = preferredFormat === 'json'
    ? ['json', 'yaml']
    : preferredFormat === 'yaml'
    ? ['yaml', 'json']
    : detectJson
    ? ['json', 'yaml']
    : ['yaml', 'json'];
  for (const fmt of parserPlan) {
    try {
      root = fmt === 'json' ? JSON.parse(text) : parseYamlText(text);
      if (root && typeof root === 'object') break;
    } catch {
      // try next parser
    }
  }
  if (!root || typeof root !== 'object') {
    return { ok: false, error: 'CSES 内容解析失败（JSON/YAML）。' };
  }

  const subjectMap = new Map();
  const subjects = Array.isArray(root?.subjects) ? root.subjects : [];
  const workDayWeekdayMap = buildWorkDayWeekdayMap(root?.configuration?.cycle);
  for (const s of subjects) {
    const name = pickFirst(s, ['name', 'subject', 'course', 'title']);
    const short = pickFirst(s, ['simplified_name', 'short_name']);
    const teacher = String(pickFirst(s, ['teacher', 'teacher_name']) || '');
    if (name) subjectMap.set(String(name), { course: String(name), teacher });
    if (short) subjectMap.set(String(short), { course: String(name || short), teacher });
  }

  const lessons = [];
  const addLesson = (day, weekType, start, end, course, teacher) => {
    const dayN = normalizeDay(day);
    const startM = parseTimeToMinutes(start);
    const endM = parseTimeToMinutes(end);
    if (dayN === null || startM === null || endM === null || endM <= startM) return;
    lessons.push({
      day: dayN,
      weekType: normalizeWeekType(weekType),
      start: normalizeClockText(start),
      end: normalizeClockText(end),
      startM,
      endM,
      course: String(course || '未命名课程'),
      teacher: String(teacher || '')
    });
  };

  if (Array.isArray(root?.schedules)) {
    for (const schedule of root.schedules) {
      const rawDays = Array.isArray(schedule?.enable_day)
        ? schedule.enable_day
        : [pickFirst(schedule, ['enable_day', 'day', 'weekday', 'week_day'])];
      const days = rawDays.map((d) => {
        const n = Number(d);
        if (workDayWeekdayMap && Number.isInteger(n) && workDayWeekdayMap.has(n)) return workDayWeekdayMap.get(n);
        if (workDayWeekdayMap && Number.isInteger(n) && n > 0) {
          const size = workDayWeekdayMap.size;
          const idx = ((n - 1) % size) + 1;
          if (workDayWeekdayMap.has(idx)) return workDayWeekdayMap.get(idx);
        }
        return d;
      });
      const weekType = pickFirst(schedule, ['weeks', 'week_type', 'weekType', 'week', 'type']) || 'all';
      const classes = Array.isArray(schedule?.classes) ? schedule.classes : [];

      for (const day of days) {
        for (const cls of classes) {
          const subjectText = pickFirst(cls, ['subject', 'name', 'course', 'title']);
          const mapped = subjectMap.get(String(subjectText));
          const start = pickFirst(cls, ['start_time', 'start', 'startTime']);
          const end = pickFirst(cls, ['end_time', 'end', 'endTime']);
          const teacher = pickFirst(cls, ['teacher', 'teacher_name', 'instructor']) || mapped?.teacher;
          addLesson(day, weekType, start, end, mapped?.course || subjectText, teacher);
        }
      }
    }
  }

  lessons.sort((a, b) => (a.day - b.day) || (a.startM - b.startM));
  if (!lessons.length) {
    return { ok: false, error: '未从 CSES 内容解析出课程。请检查 schedules.enable_day、classes.start_time、classes.end_time 等字段。' };
  }
  return { ok: true, lessons };
}

function isLessonInWeek(lesson, weekType) {
  return lesson.weekType === 'all' || lesson.weekType === weekType;
}

function lessonsForDate(allLessons, date) {
  const day = date.getDay();
  const weekType = getWeekType(date);
  return allLessons.filter((x) => x.day === day && isLessonInWeek(x, weekType)).sort((a, b) => a.startM - b.startM);
}

function validateSimpleSchedule(schedule) {
  if (!schedule || typeof schedule !== 'object') return false;
  for (const wt of ['odd', 'even']) {
    if (!schedule[wt] || typeof schedule[wt] !== 'object') return false;
    for (let day = 0; day <= 6; day += 1) {
      const e = schedule[wt][String(day)] ?? schedule[wt][day];
      if (!e || typeof e !== 'object') return false;
      if (typeof e.course !== 'string' || typeof e.teacher !== 'string') return false;
    }
  }
  return true;
}

function normalizeFeedPayload(payload) {
  const source = payload && typeof payload === 'object' ? payload : {};
  const title = typeof source.title === 'string' && source.title.trim() ? source.title.trim() : '校园资讯';
  const updatedAt = typeof source.updatedAt === 'string' ? source.updatedAt : '';
  const rawItems = Array.isArray(source.items) ? source.items : [];
  const items = rawItems
    .map((item) => ({
      title: String(item?.title || '').trim(),
      summary: String(item?.summary || '').trim(),
      time: String(item?.time || '').trim()
    }))
    .filter((x) => x.title)
    .slice(0, 8);
  return { title, updatedAt, items };
}

const app = createApp({
  setup() {
    const teacherLabel = (teacher) => {
      const t = String(teacher || '').trim();
      return t ? `任课老师：${t}` : '';
    };

    const config = reactive(loadConfig());
    const activeTab = ref('home');
    const now = ref(new Date());

    const weatherText = ref('');
    const weatherVisible = ref(false);
    const feedData = ref({ title: '校园资讯', updatedAt: '', items: [] });

    const cityQuery = ref('');
    const cityResults = ref([]);
    const cityLoading = ref(false);

    const settingsDraft = reactive({
      schoolName: config.schoolName,
      classroomName: config.classroomName,
      themeMode: config.themeMode,
      themeColor: config.themeColor,
      scheduleMode: config.scheduleMode || 'simple',
      classStart: config.classStart,
      classEnd: config.classEnd,
      preClassProgressWindow: String(config.preClassProgressWindow),
      weatherEnabled: config.weatherEnabled,
      weatherCity: config.weatherCity,
      weatherLatitude: String(config.weatherLatitude),
      weatherLongitude: String(config.weatherLongitude),
      scheduleText: JSON.stringify(config.schedule, null, 2),
      csesRaw: config.csesRaw || '',
      csesFormat: config.csesFormat || 'auto'
    });
    const settingsSection = ref('root');
    const settingsSections = [
      { key: 'wlan', label: 'WLAN', icon: 'wifi', description: '暂无权限 - 以太网' },
      { key: 'bluetooth', label: '蓝牙', icon: 'bluetooth', description: '暂无权限' },
      { key: 'appearance', label: '显示', icon: 'palette', description: '深色主题、动态主题色' },
      { key: 'basic', label: '课表', icon: 'dashboard', description: '学校信息、课表与进度' },
      { key: 'weather', label: '天气', icon: 'partly_cloudy_day', description: '' },
      { key: 'device', label: '关于设备', icon: 'memory', description: '' },
      { key: 'data', label: '数据与维护', icon: 'tune', description: '导出、恢复默认' }
    ];
    const xxtsoftDialogOpen = ref(false);
    const screenOff = ref(false);
    const todayLessonsExpanded = ref(false);
    const appsView = ref('list');
    const activeApp = ref(null);
    const appTools = [
      { key: 'classwork', name: 'ClassWork 作业板', description: '显示作业内容和管理班级信息', icon: 'dashboard', url: 'https://classworks.wuyuan.dev/' },
      { key: 'cutdown', name: '倒计时', description: '在线倒计时', icon: 'alarm', url: 'https://www.lddgo.net/common/countdown' },
      { key: 'ua', name: 'User-Agent在线分析', description: '查看班牌的浏览器内核和系统信息', icon: 'app_shortcut', url: 'https://www.lddgo.net/network/useragent' },
      { key: 'gushiwen', name: '古文岛', description: '查询古诗文', icon: 'book', url: 'https://www.gushiwen.cn/default_1.aspx' }
    ];
    const modelTapCount = ref(0);
    const fakeDevEnabled = ref(false);
    let weatherRefreshTimer = null;

    let clockTimer = null;
    let weatherTimer = null;
    let feedTimer = null;
    let mediaQuery = null;
    let mediaHandler = null;

    function applyTheme(modeOverride, colorOverride) {
      const root = document.documentElement;
      const mode = modeOverride || config.themeMode || 'auto';
      const seed = colorOverride || config.themeColor || defaultConfig.themeColor;
      root.classList.remove('mdui-theme-light', 'mdui-theme-dark');
      if (mode === 'dark') {
        root.classList.add('mdui-theme-dark');
      } else if (mode === 'light') {
        root.classList.add('mdui-theme-light');
      } else {
        const dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.add(dark ? 'mdui-theme-dark' : 'mdui-theme-light');
      }
      root.style.setProperty('--app-seed-color', seed);
      try {
        if (typeof setColorScheme === 'function') setColorScheme(seed);
      } catch {
        // ignore color scheme errors on unsupported environments
      }
    }

    const timeText = computed(() => {
      const d = now.value;
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    });

    const dateText = computed(() => {
      const d = now.value;
      return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日 ${dayLabels[d.getDay()]}`;
    });

    const parsedCses = computed(() => {
      return parseCsesLessons(config.csesRaw || '', config.csesFormat || 'auto');
    });

    const classState = computed(() => {
      const current = now.value;
      const currentM = current.getHours() * 60 + current.getMinutes() + current.getSeconds() / 60;
      const preWindow = Number(config.preClassProgressWindow) || 10;

      let lessonsToday = [];
      let allLessons = [];

      if (config.scheduleMode === 'cses') {
        if (!parsedCses.value.ok) {
          return {
            statusText: parsedCses.value.error,
            courseText: '-',
            teacherText: '',
            showProgress: false,
            progress: 0,
            progressNote: ''
          };
        }
        allLessons = parsedCses.value.lessons;
        lessonsToday = lessonsForDate(allLessons, current);
      } else {
        const startM = parseTimeToMinutes(config.classStart);
        const endM = parseTimeToMinutes(config.classEnd);
        if (startM === null || endM === null || endM <= startM) {
          return {
            statusText: '设置中的上课/下课时间无效',
            courseText: '-',
            teacherText: '',
            showProgress: false,
            progress: 0,
            progressNote: ''
          };
        }

        const info = getSimpleClassInfo(config.schedule, current);
        lessonsToday = [{
          day: current.getDay(),
          weekType: getWeekType(current),
          start: config.classStart,
          end: config.classEnd,
          startM,
          endM,
          course: info.course,
          teacher: info.teacher
        }];
        allLessons = [];
      }

      for (const lesson of lessonsToday) {
        if (currentM >= lesson.startM && currentM < lesson.endM) {
          const total = lesson.endM - lesson.startM;
          const elapsed = currentM - lesson.startM;
          const progress = Math.max(0, Math.min(1, elapsed / total));
          const endDate = new Date(current);
          endDate.setHours(Math.floor(lesson.endM / 60), lesson.endM % 60, 0, 0);
          return {
            statusText: `正在上课，距离下课还有 ${formatDuration(endDate - current)}`,
            courseText: lesson.course,
            teacherText: teacherLabel(lesson.teacher),
            showProgress: true,
            progress,
            progressNote: `课程进度 ${Math.floor(progress * 100)}%`
          };
        }
      }

      const nextToday = lessonsToday.find((x) => x.startM > currentM);
      if (nextToday) {
        const startDate = new Date(current);
        startDate.setHours(Math.floor(nextToday.startM / 60), nextToday.startM % 60, 0, 0);
        const remain = startDate - current;
        const remainMin = remain / 60000;
        const remainSec = Math.max(0, Math.ceil(remain / 1000));
        const show = remainMin <= preWindow;
        const p = show ? Math.max(0, Math.min(1, (preWindow - remainMin) / preWindow)) : 0;
        return {
          statusText: show ? '' : `下一节课 ${nextToday.start}-${nextToday.end}`,
          courseText: nextToday.course,
          teacherText: teacherLabel(nextToday.teacher),
          showProgress: show,
          progress: p,
          progressNote: show ? `即将上课（${remainSec} 秒）` : ''
        };
      }

      const scanBase = new Date(current);
      for (let i = 1; i <= 14; i += 1) {
        const d = new Date(scanBase);
        d.setDate(d.getDate() + i);

        let targetLessons;
        if (config.scheduleMode === 'cses') {
          targetLessons = lessonsForDate(allLessons, d);
        } else {
          const startM = parseTimeToMinutes(config.classStart);
          const endM = parseTimeToMinutes(config.classEnd);
          const info = getSimpleClassInfo(config.schedule, d);
          if (startM === null || endM === null || endM <= startM) continue;
          targetLessons = [{ startM, endM, start: config.classStart, end: config.classEnd, course: info.course, teacher: info.teacher }];
        }

        if (targetLessons.length) {
          const first = targetLessons[0];
          const startDate = new Date(d);
          startDate.setHours(Math.floor(first.startM / 60), first.startM % 60, 0, 0);
          return {
            statusText: `下一节课在 ${d.getMonth() + 1}月${d.getDate()}日 ${first.start}（${formatDuration(startDate - current)}后）`,
            courseText: first.course,
            teacherText: teacherLabel(first.teacher),
            showProgress: false,
            progress: 0,
            progressNote: ''
          };
        }
      }

      return {
        statusText: '暂无课程安排',
        courseText: '-',
        teacherText: '',
        showProgress: false,
        progress: 0,
        progressNote: ''
      };
    });
    const todayLessons = computed(() => {
      const current = now.value;
      if (config.scheduleMode === 'cses') {
        if (!parsedCses.value.ok) return [];
        return lessonsForDate(parsedCses.value.lessons, current);
      }
      const startM = parseTimeToMinutes(config.classStart);
      const endM = parseTimeToMinutes(config.classEnd);
      if (startM === null || endM === null || endM <= startM) return [];
      const info = getSimpleClassInfo(config.schedule, current);
      return [{
        start: normalizeClockText(config.classStart),
        end: normalizeClockText(config.classEnd),
        course: info.course,
        teacher: info.teacher
      }];
    });

    const todayLessonsVisible = computed(() => {
      if (todayLessonsExpanded.value) return todayLessons.value;
      return todayLessons.value.slice(0, 4);
    });
    const hasMoreTodayLessons = computed(() => todayLessons.value.length > 4);

    function toggleTodayLessons() {
      todayLessonsExpanded.value = !todayLessonsExpanded.value;
    }

    function showLessonDetail(lesson) {
      if (!lesson) return;
      const course = String(lesson.course || '未命名课程');
      const time = `${lesson.start || '--:--'}-${lesson.end || '--:--'}`;
      const teacher = String(lesson.teacher || '').trim();
      const teacherPart = teacher ? `｜任课老师：${teacher}` : '';
      snackbar({ message: `${course}｜${time}${teacherPart}` });
    }

    function openAppTool(tool) {
      activeApp.value = tool;
      appsView.value = 'web';
    }

    function closeAppTool() {
      activeApp.value = null;
      appsView.value = 'list';
    }
    async function refreshWeather() {
      if (!config.weatherEnabled) {
        weatherVisible.value = false;
        return;
      }

      try {
        const lat = Number(config.weatherLatitude);
        const lon = Number(config.weatherLongitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          weatherVisible.value = false;
          return;
        }

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current=temperature_2m,weather_code,wind_speed_10m&timezone=Asia%2FShanghai`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const current = data.current;
        if (!current) throw new Error('missing current weather');

        const weather = weatherCodeMap[current.weather_code] || '未知天气';
        weatherText.value = `${config.weatherCity || '当前城市'} ${weather} ${Math.round(current.temperature_2m)}°C  风速${Math.round(current.wind_speed_10m)}km/h`;
        weatherVisible.value = true;
      } catch {
        weatherVisible.value = false;
      }
    }

    async function loadFeedFallbackLocal() {
      if (LOCAL_FEED_DATA) {
        feedData.value = normalizeFeedPayload(LOCAL_FEED_DATA);
        return;
      }

      if (window.location.protocol === 'file:') {
        feedData.value = {
          title: '校园资讯',
          updatedAt: '',
          items: [{ title: '暂无资讯', summary: 'file 模式下未提供内置资讯数据。', time: '' }]
        };
        return;
      }

      try {
        const res = await fetch('./feed.json', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const normalized = normalizeFeedPayload(json);
        feedData.value = normalized;
      } catch {
        feedData.value = {
          title: '校园资讯',
          updatedAt: '',
          items: [{ title: '暂无资讯', summary: '网络不可用且无本地缓存资讯。', time: '' }]
        };
      }
    }

    async function refreshFeed() {
      const decodeFeedResponse = async (res) => {
        const text = await res.text();
        const trimmed = String(text || '').trim();
        if (!trimmed) return null;
        let parsed;
        try {
          parsed = JSON.parse(trimmed);
        } catch {
          return null;
        }
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.items)) return parsed;
          if (typeof parsed.contents === 'string') {
            try {
              return JSON.parse(parsed.contents);
            } catch {
              return null;
            }
          }
          if (typeof parsed.data === 'string') {
            try {
              return JSON.parse(parsed.data);
            } catch {
              return null;
            }
          }
        }
        return null;
      };

      const fetchFeedFromNetwork = async () => {
        for (const url of FEED_PROXY_URLS) {
          let timeout = null;
          try {
            const ctrl = new AbortController();
            timeout = setTimeout(() => ctrl.abort(), 7000);
            const res = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
            clearTimeout(timeout);
            if (!res.ok) continue;
            const json = await decodeFeedResponse(res);
            if (!json) continue;
            const normalized = normalizeFeedPayload(json);
            if (!normalized.items.length) continue;
            feedData.value = normalized;
            localStorage.setItem(FEED_CACHE_KEY, JSON.stringify(normalized));
            return true;
          } catch {
            // try next candidate
          } finally {
            if (timeout) clearTimeout(timeout);
          }
        }
        return false;
      };

      if (window.location.protocol === 'file:') {
        const ok = await fetchFeedFromNetwork();
        if (ok) return;

        try {
          const cacheRaw = localStorage.getItem(FEED_CACHE_KEY);
          if (cacheRaw) {
            const normalizedCache = normalizeFeedPayload(JSON.parse(cacheRaw));
            if (normalizedCache.items.length) {
              feedData.value = normalizedCache;
              return;
            }
          }
        } catch {
          // ignore cache parse error
        }
        await loadFeedFallbackLocal();
        return;
      }

      {
        const ok = await fetchFeedFromNetwork();
        if (ok) return;

        try {
          const cacheRaw = localStorage.getItem(FEED_CACHE_KEY);
          if (cacheRaw) {
            const normalizedCache = normalizeFeedPayload(JSON.parse(cacheRaw));
            if (normalizedCache.items.length) {
              feedData.value = normalizedCache;
              return;
            }
          }
        } catch {
          // ignore cache parse error
        }
      }

      await loadFeedFallbackLocal();
    }

    function syncDraftFromConfig() {
      settingsDraft.schoolName = config.schoolName;
      settingsDraft.classroomName = config.classroomName;
      settingsDraft.themeMode = config.themeMode;
      settingsDraft.themeColor = config.themeColor;
      settingsDraft.scheduleMode = config.scheduleMode || 'simple';
      settingsDraft.classStart = config.classStart;
      settingsDraft.classEnd = config.classEnd;
      settingsDraft.preClassProgressWindow = String(config.preClassProgressWindow);
      settingsDraft.weatherEnabled = config.weatherEnabled;
      settingsDraft.weatherCity = config.weatherCity;
      settingsDraft.weatherLatitude = String(config.weatherLatitude);
      settingsDraft.weatherLongitude = String(config.weatherLongitude);
      settingsDraft.scheduleText = JSON.stringify(config.schedule, null, 2);
      settingsDraft.csesRaw = config.csesRaw || '';
      settingsDraft.csesFormat = config.csesFormat || 'auto';
      cityQuery.value = '';
      cityResults.value = [];
    }

    function onTabChange(event) {
      activeTab.value = event.target.value;
      if (activeTab.value === 'settings') {
        syncDraftFromConfig();
        settingsSection.value = 'root';
      } else if (activeTab.value === 'home') {
        todayLessonsExpanded.value = false;
      }
      if (activeTab.value !== 'apps' && appsView.value === 'web') {
        closeAppTool();
      }
    }

    function openSettingsSection(sectionKey) {
      settingsSection.value = sectionKey;
    }

    function backToSettingsMenu() {
      settingsSection.value = 'root';
    }

    const screenOffRipple = reactive({
      active: false,
      x: 0,
      y: 0
    });

    function powerOffScreen(event) {
      const btn = event?.currentTarget;
      const rect = btn && btn.getBoundingClientRect ? btn.getBoundingClientRect() : null;
      const x = rect ? rect.left + rect.width / 2 : window.innerWidth - 36;
      const y = rect ? rect.top + rect.height / 2 : window.innerHeight - 92;
      screenOffRipple.x = Math.round(x);
      screenOffRipple.y = Math.round(y);
      screenOffRipple.active = true;
      setTimeout(() => {
        screenOff.value = true;
        screenOffRipple.active = false;
      }, 480);
    }

    function wakeScreen() {
      screenOff.value = false;
      screenOffRipple.active = false;
    }

    function openXxtsoftDialog() {
      xxtsoftDialogOpen.value = true;
    }

    function onDeviceModelTap() {
      if (fakeDevEnabled.value) {
        snackbar({ message: '开发者模式已开启' });
        return;
      }

      modelTapCount.value += 1;
      const remain = 7 - modelTapCount.value;
      if (remain > 0) {
        snackbar({ message: `现在只需要再执行 ${remain} 步操作即可进入开发者模式。` });
      } else {
        fakeDevEnabled.value = true;
        snackbar({ message: '您现在处于开发者模式！' });
      }
    }
    function scheduleWeatherRefresh() {
      if (weatherRefreshTimer) clearTimeout(weatherRefreshTimer);
      weatherRefreshTimer = setTimeout(() => {
        refreshWeather();
      }, 400);
    }

    function applyDraftLive() {
      config.schoolName = settingsDraft.schoolName.trim() || defaultConfig.schoolName;
      config.classroomName = settingsDraft.classroomName.trim() || defaultConfig.classroomName;
      config.themeMode = settingsDraft.themeMode;
      config.themeColor = settingsDraft.themeColor || defaultConfig.themeColor;
      config.scheduleMode = settingsDraft.scheduleMode;
      config.classStart = settingsDraft.classStart;
      config.classEnd = settingsDraft.classEnd;
      config.weatherEnabled = settingsDraft.weatherEnabled;
      config.weatherCity = settingsDraft.weatherCity.trim() || '当前城市';
      config.csesFormat = settingsDraft.csesFormat || 'auto';

      const preMins = Number(settingsDraft.preClassProgressWindow);
      if (Number.isFinite(preMins) && preMins >= 1 && preMins <= 180) {
        config.preClassProgressWindow = Math.floor(preMins);
      }

      const lat = Number(settingsDraft.weatherLatitude);
      const lon = Number(settingsDraft.weatherLongitude);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        config.weatherLatitude = lat;
        config.weatherLongitude = lon;
      }

      if (config.scheduleMode === 'simple') {
        const s = parseTimeToMinutes(settingsDraft.classStart);
        const e = parseTimeToMinutes(settingsDraft.classEnd);
        if (s !== null && e !== null && e > s) {
          config.classStart = settingsDraft.classStart;
          config.classEnd = settingsDraft.classEnd;
        }

        try {
          const schedule = JSON.parse(settingsDraft.scheduleText);
          if (validateSimpleSchedule(schedule)) {
            config.schedule = schedule;
          }
        } catch {
          // keep previous valid schedule while editing
        }
      } else {
        const parsed = parseCsesLessons(settingsDraft.csesRaw, settingsDraft.csesFormat || 'auto');
        config.csesRaw = settingsDraft.csesRaw;
        if (!parsed.ok) {
          // keep raw text so user input is persisted even when incomplete
        }
      }

      saveConfig(config);
      applyTheme();
      scheduleWeatherRefresh();
    }
    function setThemeMode(mode) {
      settingsDraft.themeMode = mode;
    }

    function setThemeColor(color) {
      settingsDraft.themeColor = color;
    }

    async function searchCity() {
      const q = cityQuery.value.trim();
      if (!q) {
        snackbar({ message: '请输入城市名。' });
        return;
      }

      cityLoading.value = true;
      cityResults.value = [];
      try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=zh&format=json`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        cityResults.value = Array.isArray(data.results) ? data.results : [];
        if (!cityResults.value.length) snackbar({ message: '未找到匹配城市。' });
      } catch {
        snackbar({ message: '城市搜索失败，请检查网络。' });
      } finally {
        cityLoading.value = false;
      }
    }

    function useCity(city) {
      settingsDraft.weatherCity = city.name || '';
      settingsDraft.weatherLatitude = String(city.latitude ?? '');
      settingsDraft.weatherLongitude = String(city.longitude ?? '');
      cityResults.value = [];
      cityQuery.value = city.name || '';
      snackbar({ message: `已选择 ${settingsDraft.weatherCity}` });
    }

    function exportSettingsJson() {
      const exportObj = { ...config, exportedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `classboard-settings-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
    function resetSettings() {
      const next = cloneDefault();
      Object.assign(config, next);
      saveConfig(config);
      syncDraftFromConfig();
      applyTheme();
      refreshWeather();
      snackbar({ message: '已恢复默认设置。' });
    }

    onMounted(() => {
      applyTheme();

      watch(settingsDraft, () => {
        applyDraftLive();
      }, { deep: true });

      mediaQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
      if (mediaQuery) {
        mediaHandler = () => {
          if ((config.themeMode || 'auto') === 'auto') {
            applyTheme('auto', config.themeColor);
          }
        };
        if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', mediaHandler);
        else if (mediaQuery.addListener) mediaQuery.addListener(mediaHandler);
      }

      clockTimer = setInterval(() => {
        now.value = new Date();
      }, 1000);

      refreshWeather();
      refreshFeed();
      weatherTimer = setInterval(refreshWeather, 15 * 60 * 1000);
      feedTimer = setInterval(refreshFeed, 5 * 60 * 1000);
    });

    onBeforeUnmount(() => {
      if (clockTimer) clearInterval(clockTimer);
      if (weatherTimer) clearInterval(weatherTimer);
      if (feedTimer) clearInterval(feedTimer);
      if (weatherRefreshTimer) clearTimeout(weatherRefreshTimer);
      if (mediaQuery && mediaHandler) {
        if (mediaQuery.removeEventListener) mediaQuery.removeEventListener('change', mediaHandler);
        else if (mediaQuery.removeListener) mediaQuery.removeListener(mediaHandler);
      }
    });
    const currentSettingsTitle = computed(() => {
      return settingsSections.find((x) => x.key === settingsSection.value)?.label || '设置';
    });
    const showTopBack = computed(() => {
      return (activeTab.value === 'settings' && settingsSection.value !== 'root')
        || (activeTab.value === 'apps' && appsView.value === 'web');
    });
    const topBarTitle = computed(() => {
      if (activeTab.value === 'settings' && settingsSection.value !== 'root') return currentSettingsTitle.value;
      if (activeTab.value === 'apps' && appsView.value === 'web' && activeApp.value) return activeApp.value.name;
      return 'SaltOS 南方中学电子班牌';
    });
    function handleTopBack() {
      if (activeTab.value === 'settings' && settingsSection.value !== 'root') {
        backToSettingsMenu();
        return;
      }
      if (activeTab.value === 'apps' && appsView.value === 'web') {
        closeAppTool();
      }
    }
    return {
      config,
      activeTab,
      timeText,
      dateText,
      weatherText,
      weatherVisible,
      feedData,
      classState,
      todayLessons,
      todayLessonsVisible,
      hasMoreTodayLessons,
      settingsDraft,
      cityQuery,
      cityResults,
      cityLoading,
      onTabChange,
      setThemeMode,
      setThemeColor,
      toggleTodayLessons,
      showLessonDetail,
      searchCity,
      useCity,
      resetSettings,
      exportSettingsJson,
      settingsSection,
      settingsSections,
      openSettingsSection,
      backToSettingsMenu,
      xxtsoftDialogOpen,
      openXxtsoftDialog,
      screenOff,
      powerOffScreen,
      wakeScreen,
      screenOffRipple,
      todayLessonsExpanded,
      appsView,
      activeApp,
      appTools,
      openAppTool,
      showTopBack,
      topBarTitle,
      handleTopBack,
      onDeviceModelTap,
      fakeDevEnabled,
      currentSettingsTitle
    };
  },
  template: `
    <div class="app-shell" :class="{ 'webview-mode': activeTab === 'apps' && appsView === 'web' }">
      <mdui-top-app-bar v-if="!screenOff" variant="small" class="app-top-bar" scroll-target=".page-body">
        <mdui-button-icon v-if="showTopBack" @click="handleTopBack">
          <span class="material-symbols-rounded icon-glyph">arrow_back</span>
        </mdui-button-icon>
        <mdui-top-app-bar-title @click="handleTopBack">{{ topBarTitle }}</mdui-top-app-bar-title>
      </mdui-top-app-bar>

      <main class="page-body">
        <section v-if="activeTab === 'home'" class="view view-home">
          <mdui-card class="block school-block">
            <div class="school-name">{{ config.schoolName }}</div>
            <div class="classroom-name">{{ config.classroomName }}</div>
          </mdui-card>

          <mdui-card class="block time-block">
            <div class="clock">{{ timeText }}</div>
            <div class="line"><span class="material-symbols-outlined">calendar_month</span><span>{{ dateText }}</span></div>
            <div v-if="weatherVisible" class="line"><span class="material-symbols-outlined">partly_cloudy_day</span><span>{{ weatherText }}</span></div>
          </mdui-card>

          <mdui-card class="block class-block">
            <div class="block-title">课程状态</div>
            <div v-if="classState.statusText" class="status">{{ classState.statusText }}</div>
            <div class="course">{{ classState.courseText }}</div>
            <div v-if="classState.teacherText" class="teacher">{{ classState.teacherText }}</div>
            <div v-if="classState.showProgress" class="progress-box">
              <mdui-linear-progress :value="classState.progress"></mdui-linear-progress>
              <div class="progress-note">{{ classState.progressNote }}</div>
            </div>
            <div class="today-lessons">
              <div class="tiny-label">今日课程安排</div>
              <mdui-list v-if="todayLessons.length" class="today-lesson-list">
                <mdui-list-item v-for="(lesson, idx) in todayLessonsVisible" :key="idx" @click="showLessonDetail(lesson)">
                  <div slot="custom" class="today-lesson-item">
                    <span>{{ lesson.start }} - {{ lesson.end }}</span>
                    <span>{{ lesson.course }}</span>
                  </div>
                </mdui-list-item>
              </mdui-list>
              <mdui-button v-if="hasMoreTodayLessons" variant="text" class="lesson-toggle-btn" @click="toggleTodayLessons">
                {{ todayLessonsExpanded ? '收起' : '展开全部' }}
              </mdui-button>
              <div v-else-if="!todayLessons.length" class="tip compact-tip">今日无课程</div>
            </div>
          </mdui-card>

          <mdui-card class="block feed-block">
            <div class="block-title">{{ feedData.title || '校园资讯' }}</div>
            <div v-if="feedData.updatedAt" class="tip">更新：{{ feedData.updatedAt }}</div>
            <div class="feed-list">
              <div v-for="(item, idx) in feedData.items.slice(0, 4)" :key="idx" class="feed-item">
                <div class="feed-title">{{ item.title }}</div>
                <div v-if="item.summary" class="feed-summary">{{ item.summary }}</div>
                <div v-if="item.time" class="feed-time">{{ item.time }}</div>
              </div>
              <div v-if="!feedData.items.length" class="tip">暂无资讯</div>
            </div>
          </mdui-card>

          <mdui-fab class="power-fab" variant="secondary" @click="powerOffScreen">
            <span slot="icon" class="material-symbols-rounded icon-glyph">power_settings_new</span>
          </mdui-fab>
        </section>

        <section v-else-if="activeTab === 'settings'" class="view view-settings">
          <template v-if="settingsSection === 'root'">
            <mdui-card class="block settings-block settings-menu-card">
              <div class="block-title">设置</div>
              <mdui-list class="settings-category-list">
                <mdui-list-item v-for="item in settingsSections" :key="item.key" rounded @click="openSettingsSection(item.key)">
                  <span slot="icon" class="material-symbols-outlined">{{ item.icon }}</span>
                  {{ item.label }}
                  <span slot="description">{{ item.description }}</span>
                  <span slot="end-icon" class="material-symbols-outlined">chevron_right</span>
                </mdui-list-item>
                <mdui-list-item rounded @click="openXxtsoftDialog">
                  <span slot="icon" class="material-symbols-outlined">cloud_sync</span>
                  连接到 xxtsoft
                  <span slot="description">启用在线同步与公告分发能力</span>
                  <span slot="end-icon" class="material-symbols-outlined">open_in_new</span>
                </mdui-list-item>
              </mdui-list>
            </mdui-card>
          </template>

          <template v-else>
            <mdui-card v-if="settingsSection === 'appearance'" class="block settings-block">
              <div class="block-title">外观</div>
              <div class="form-grid">
                <div class="mode-group">
                  <mdui-button :variant="settingsDraft.themeMode === 'light' ? 'filled' : 'tonal'" @click="setThemeMode('light')">浅色</mdui-button>
                  <mdui-button :variant="settingsDraft.themeMode === 'dark' ? 'filled' : 'tonal'" @click="setThemeMode('dark')">深色</mdui-button>
                  <mdui-button :variant="settingsDraft.themeMode === 'auto' ? 'filled' : 'tonal'" @click="setThemeMode('auto')">跟随系统</mdui-button>
                </div>
                <div class="color-row">
                  <label class="tiny-label" for="theme-color">主题色</label>
                  <input id="theme-color" class="color-input" type="color" :value="settingsDraft.themeColor" @input="setThemeColor($event.target.value)" />
                  <mdui-text-field label="主题色 HEX" :value="settingsDraft.themeColor" @input="setThemeColor($event.target.value)"></mdui-text-field>
                </div>
              </div>
            </mdui-card>

            <mdui-card v-if="settingsSection === 'basic'" class="block settings-block">
              <div class="block-title">班牌与课表</div>
              <div class="form-grid">
                <mdui-text-field label="学校名称" :value="settingsDraft.schoolName" @input="settingsDraft.schoolName = $event.target.value"></mdui-text-field>
                <mdui-text-field label="教室名称" :value="settingsDraft.classroomName" @input="settingsDraft.classroomName = $event.target.value"></mdui-text-field>
                <div class="switch-row">
                  <span>课表模式</span>
                  <mdui-select :value="settingsDraft.scheduleMode" @change="settingsDraft.scheduleMode = $event.target.value" style="min-width: 180px;">
                    <mdui-menu-item value="simple">简单模式（单节课）</mdui-menu-item>
                    <mdui-menu-item value="cses">CSES 模式（多课程）</mdui-menu-item>
                  </mdui-select>
                </div>
                <template v-if="settingsDraft.scheduleMode === 'simple'">
                  <div class="split-2">
                    <mdui-text-field label="上课时间" type="time" :value="settingsDraft.classStart" @input="settingsDraft.classStart = $event.target.value"></mdui-text-field>
                    <mdui-text-field label="下课时间" type="time" :value="settingsDraft.classEnd" @input="settingsDraft.classEnd = $event.target.value"></mdui-text-field>
                  </div>
                  <mdui-text-field class="json-field" textarea autosize rows="10" :value="settingsDraft.scheduleText" @input="settingsDraft.scheduleText = $event.target.value"></mdui-text-field>
                </template>
                <template v-else>
                  <div class="switch-row">
                    <span>CSES 输入格式</span>
                    <mdui-select :value="settingsDraft.csesFormat" @change="settingsDraft.csesFormat = $event.target.value" style="min-width: 140px;">
                      <mdui-menu-item value="auto">自动识别</mdui-menu-item>
                      <mdui-menu-item value="yaml">YAML</mdui-menu-item>
                      <mdui-menu-item value="json">JSON</mdui-menu-item>
                    </mdui-select>
                  </div>
                  <mdui-text-field class="json-field" textarea autosize rows="12" placeholder="粘贴 CSES JSON/YAML" :value="settingsDraft.csesRaw" @input="settingsDraft.csesRaw = $event.target.value"></mdui-text-field>
                </template>
                <mdui-text-field label="课前进度条分钟数" type="number" min="1" max="180" :value="settingsDraft.preClassProgressWindow" @input="settingsDraft.preClassProgressWindow = $event.target.value"></mdui-text-field>
              </div>
            </mdui-card>

            <mdui-card v-if="settingsSection === 'weather'" class="block settings-block">
              <div class="block-title">天气</div>
              <div class="form-grid">
                <div class="switch-row">
                  <span>启用天气</span>
                  <mdui-switch :checked="settingsDraft.weatherEnabled" @change="settingsDraft.weatherEnabled = $event.target.checked"></mdui-switch>
                </div>
                <mdui-text-field label="城市名称" :value="settingsDraft.weatherCity" @input="settingsDraft.weatherCity = $event.target.value"></mdui-text-field>
                <div class="split-2">
                  <mdui-text-field label="纬度" type="number" step="0.0001" :value="settingsDraft.weatherLatitude" @input="settingsDraft.weatherLatitude = $event.target.value"></mdui-text-field>
                  <mdui-text-field label="经度" type="number" step="0.0001" :value="settingsDraft.weatherLongitude" @input="settingsDraft.weatherLongitude = $event.target.value"></mdui-text-field>
                </div>
                <div class="city-search">
                  <mdui-text-field label="搜索城市自动填经纬度" :value="cityQuery" @input="cityQuery = $event.target.value"></mdui-text-field>
                  <mdui-button variant="outlined" @click="searchCity">搜索</mdui-button>
                </div>
                <div v-if="cityLoading" class="tip">搜索中...</div>
                <div v-if="cityResults.length" class="city-results">
                  <button v-for="city in cityResults" :key="city.id" type="button" class="city-item" @click="useCity(city)">
                    <div class="city-name">{{ city.name }}</div>
                    <div class="city-meta">{{ city.admin1 || city.country || '' }} · {{ Number(city.latitude).toFixed(2) }}, {{ Number(city.longitude).toFixed(2) }}</div>
                  </button>
                </div>
              </div>
            </mdui-card>

            <mdui-card v-if="settingsSection === 'device'" class="block settings-block">
              <div class="block-title">关于设备</div>
              <mdui-list class="device-list">
                <mdui-list-item nonclickable>
                  <div slot="custom" class="device-row"><span>品牌</span><span class="device-value">ClassBoard</span></div>
                </mdui-list-item>
                <mdui-list-item @click="onDeviceModelTap">
                  <div slot="custom" class="device-row"><span>型号</span><span class="device-value">NFZX-EDU-01</span></div>
                </mdui-list-item>
                <mdui-list-item nonclickable>
                  <div slot="custom" class="device-row"><span>SaltOS 版本</span><span class="device-value">0.1.1</span></div>
                </mdui-list-item>
                <mdui-list-item nonclickable>
                  <div slot="custom" class="device-row"><span>Android 版本</span><span class="device-value">5.1.1</span></div>
                </mdui-list-item>
                <mdui-list-item nonclickable>
                  <div slot="custom" class="device-row"><span>WebView 版本</span><span class="device-value">95.0.4638.74</span></div>
                </mdui-list-item>
                <mdui-divider></mdui-divider>
                <mdui-list-item nonclickable>
                  <div slot="custom" class="device-row"><span>IMEI</span><span class="device-value">无</span></div>
                </mdui-list-item>
                <mdui-list-item nonclickable>
                  <div slot="custom" class="device-row"><span>MEID</span><span class="device-value">无</span></div>
                </mdui-list-item>
                <mdui-list-item nonclickable>
                  <div slot="custom" class="device-row"><span>处理器</span><span class="device-value">未知</span></div>
                </mdui-list-item>
                <mdui-list-item nonclickable>
                  <div slot="custom" class="device-row"><span>运行内存</span><span class="device-value">2 GB</span></div>
                </mdui-list-item>
                <mdui-list-item nonclickable>
                  <div slot="custom" class="device-row"><span>存储</span><span class="device-value">8 GB</span></div>
                </mdui-list-item>
                <mdui-divider></mdui-divider>
                <mdui-list-item nonclickable>
                  <div slot="custom" class="device-row"><span>设备安全补丁</span><span class="device-value">2016-10-05</span></div>
                </mdui-list-item>
                <mdui-list-item nonclickable>
                  <div slot="custom" class="device-row"><span>开发者模式</span><span class="device-value">{{ fakeDevEnabled ? '已开启' : '未开启' }}</span></div>
                </mdui-list-item>
              </mdui-list>
            </mdui-card>

            <mdui-card v-if="settingsSection === 'data'" class="block settings-block">
              <div class="block-title">数据与维护</div>
              <div class="actions">
                <mdui-button variant="outlined" @click="exportSettingsJson">导出设置 JSON</mdui-button>
                <mdui-button variant="text" @click="resetSettings">恢复默认</mdui-button>
              </div>
            </mdui-card>
          </template>
        </section>

        <section v-else-if="activeTab === 'apps'" class="view view-apps">
          <mdui-card v-if="appsView === 'list'" class="block apps-block">
            <div class="block-title">应用</div>
            <div class="tip">在线工具非 xxtsoft 提供，若页面禁止嵌入，请点击标题栏返回并更换工具。</div>
            <mdui-list class="apps-list">
              <mdui-list-item v-for="tool in appTools" :key="tool.key" rounded @click="openAppTool(tool)">
                <span slot="icon" class="material-symbols-outlined">{{ tool.icon }}</span>
                {{ tool.name }}
                <span slot="description">{{ tool.description }}</span>
                <span slot="end-icon" class="material-symbols-outlined">open_in_new</span>
              </mdui-list-item>
            </mdui-list>
          </mdui-card>
          <div v-else class="app-web-shell">
            <iframe :src="activeApp && activeApp.url ? activeApp.url : 'about:blank'" class="app-web-frame" referrerpolicy="no-referrer"></iframe>
          </div>
        </section>

        <section v-else class="view view-about">
          <mdui-card class="block">
            <div class="block-title">关于</div>
            <div class="tip">学校一堆废弃的班牌，摆在那里插着电又不用，遂 Vibe 此项目。使用 Vue 前端技术 + MDUI2 组件库</div>
            <div class="tip">想 folk 本项目吗？联系 xxt8582753@126.com，我会指导你</div>
            <div class="tip">目前已具有课表编辑，天气查询，校园资讯功能，后续我还会加入其它功能，比如调用班牌摄像头进行 AI 解题，查看希沃白板课件等（2524 @Cookie 开发的程序给了我灵感，目前有想法在做）</div>
            <div class="tip">by xxtsoft · 南方中学信息拓展社</div>
          </mdui-card>
        </section>
      </main>

      <footer class="bottom-nav">
        <mdui-navigation-bar :value="activeTab" @change="onTabChange">
          <mdui-navigation-bar-item value="home">
            主页
            <span slot="icon" class="material-symbols-outlined nav-icon">home</span>
            <span slot="active-icon" class="material-symbols-rounded nav-icon">home</span>
          </mdui-navigation-bar-item>
          <mdui-navigation-bar-item value="apps">
            应用
            <span slot="icon" class="material-symbols-outlined nav-icon">apps</span>
            <span slot="active-icon" class="material-symbols-rounded nav-icon">apps</span>
          </mdui-navigation-bar-item>
          <mdui-navigation-bar-item value="settings">
            设置
            <span slot="icon" class="material-symbols-outlined nav-icon">settings</span>
            <span slot="active-icon" class="material-symbols-rounded nav-icon">settings</span>
          </mdui-navigation-bar-item>
          <mdui-navigation-bar-item value="about">
            关于
            <span slot="icon" class="material-symbols-outlined nav-icon">info</span>
            <span slot="active-icon" class="material-symbols-rounded nav-icon">info</span>
          </mdui-navigation-bar-item>
          
        </mdui-navigation-bar>
      </footer>

      <div v-if="screenOffRipple.active" class="screen-off-ripple" :style="{ '--ripple-x': screenOffRipple.x + 'px', '--ripple-y': screenOffRipple.y + 'px' }"></div>
      <div v-if="screenOff" class="screen-off-overlay" @click="wakeScreen"></div>

      <mdui-dialog :open="xxtsoftDialogOpen" @close="xxtsoftDialogOpen = false" close-on-overlay-click close-on-esc>
        <div class="xxtsoft-dialog">
          <img class="xxtsoft-logo" src="./assets/xxtsoft.png" alt="xxtsoft" />
          <div class="xxtsoft-title">连接到 xxtsoft</div>
          <div class="xxtsoft-desc">连接后可使用我们提供的在线服务，包括资讯下发、统一配置同步与远程维护支持。</div>
        </div>
        <mdui-button slot="action" variant="text" @click="xxtsoftDialogOpen = false">关闭</mdui-button>
      </mdui-dialog>
    </div>
  `
});

app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('mdui-');
app.mount('#app');























